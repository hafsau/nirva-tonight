import Foundation

/// Untyped JSON, so a stream can be applied before it's complete enough to decode.
public enum JSONValue: Codable, Hashable, Sendable {
    case string(String), number(Double), bool(Bool), array([JSONValue]), object([String: JSONValue]), null

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let b = try? c.decode(Bool.self) { self = .bool(b) }
        else if let n = try? c.decode(Double.self) { self = .number(n) }
        else if let s = try? c.decode(String.self) { self = .string(s) }
        else if let a = try? c.decode([JSONValue].self) { self = .array(a) }
        else { self = .object(try c.decode([String: JSONValue].self)) }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        // Whole numbers go out as integers so Int fields decode.
        case .number(let n): if n.rounded() == n, abs(n) < 1e15 { try c.encode(Int(n)) } else { try c.encode(n) }
        case .bool(let b): try c.encode(b)
        case .array(let a): try c.encode(a)
        case .object(let o): try c.encode(o)
        case .null: try c.encodeNil()
        }
    }

    func setting(_ path: ArraySlice<Patch.Key>, to value: JSONValue) -> JSONValue {
        guard let head = path.first else { return value }
        let rest = path.dropFirst()
        let nextEmpty: JSONValue = if case .index = rest.first { .array([]) } else { .object([:]) }
        switch head {
        case .field(let k):
            var o: [String: JSONValue] = if case .object(let o) = self { o } else { [:] }
            o[k] = (o[k] ?? nextEmpty).setting(rest, to: value)
            return .object(o)
        case .index(let i):
            var a: [JSONValue] = if case .array(let a) = self { a } else { [] }
            while a.count <= i { a.append(nextEmpty) }
            a[i] = a[i].setting(rest, to: value)
            return .array(a)
        }
    }
}

/// One step of a streamed reflection. Same format as fixtures/tonight.stream.jsonl.
public struct Patch: Decodable, Hashable, Sendable {
    public enum Key: Decodable, Hashable, Sendable, CustomStringConvertible {
        case field(String), index(Int)
        public init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            if let i = try? c.decode(Int.self) { self = .index(i) } else { self = .field(try c.decode(String.self)) }
        }
        public var description: String {
            switch self {
            case .field(let s): s
            case .index(let i): String(i)
            }
        }
    }

    public var p: [Key]
    public var v: JSONValue?
    public var done: Bool?

    public init(p: [Key], v: JSONValue? = nil, done: Bool? = nil) {
        self.p = p
        self.v = v
        self.done = done
    }

    var path: String { p.map(\.description).joined(separator: ".") }
}

/// Patches 0...n applied in order: the partial document, plus which fields have closed.
public struct Snapshot: Sendable, Equatable {
    public private(set) var tree: JSONValue = .object([:])
    public private(set) var closed: Set<String> = []

    public init() {}

    public mutating func apply(_ patch: Patch) {
        let key = patch.path
        if let v = patch.v {
            tree = tree.setting(patch.p[...], to: v)
            // Re-opening a field to re-stream it: it and everything under it are open again.
            if patch.done != true, closed.contains(key) {
                closed = closed.filter { $0 != key && !$0.hasPrefix(key + ".") }
            }
        }
        if patch.done == true { closed.insert(key) }
    }

    /// The typed view of the snapshot, every field optional.
    public var reflection: Reflection.Partial {
        let data = (try? JSONEncoder().encode(tree)) ?? Data("{}".utf8)
        return (try? JSONDecoder().decode(Reflection.Partial.self, from: data)) ?? Reflection.Partial()
    }

    public func isClosed(_ path: String) -> Bool { closed.contains(path) }
}

/// Answers "has this field finished streaming?" for one block.
public struct Done: Sendable {
    let closed: Set<String>
    let base: String

    public init(_ snapshot: Snapshot, block index: Int) {
        closed = snapshot.closed
        base = "blocks.\(index)"
    }

    /// Every field done, for previews and renders of a finished card.
    public static let all = Done(closed: [], base: "*")
    init(closed: Set<String>, base: String) {
        self.closed = closed
        self.base = base
    }

    public func callAsFunction(_ fields: String...) -> Bool {
        base == "*" || closed.contains(([base] + fields).joined(separator: "."))
    }
}
