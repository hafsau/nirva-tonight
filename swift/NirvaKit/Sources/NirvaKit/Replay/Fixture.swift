import Foundation

/// The same night the web replays: fixtures/tonight.json and its stream, bundled.
public struct Fixture: Decodable, Sendable {
    public struct FeelingAlternate: Decodable, Sendable {
        public var ack: String
        public var headline: String
        public var body: String
        public var summary: String
    }

    public struct Removal: Decodable, Sendable {
        public struct Ack: Decodable, Sendable { public var ack: String }
        public var wrongMoment: Ack
        public var forget: Ack
        public var patternNote: String
        public var patternDelivery: [String: Delivery]
        public var summary: String
        public var arc: DayArc
        public var people: People
    }

    public struct Alternates: Decodable, Sendable {
        public var patternDelivery: [String: Delivery]
        /// She disputes the feeling: the read changes, the facts (and the count) don't.
        public var feeling: [String: FeelingAlternate]
        public var feelingPatternNote: String
        /// She removes the moment: everything that leaned on it is rebuilt without it.
        public var removal: Removal
    }

    public var reflection: Reflection
    public var alternates: Alternates

    public static func load() throws -> Fixture {
        let url = try resource("tonight", "json")
        return try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
    }

    public static func stream() throws -> [Patch] {
        let text = try String(contentsOf: resource("tonight.stream", "jsonl"), encoding: .utf8)
        let decoder = JSONDecoder()
        return try text.split(separator: "\n").map { try decoder.decode(Patch.self, from: Data($0.utf8)) }
    }

    static func resource(_ name: String, _ ext: String) throws -> URL {
        guard let url = Bundle.module.url(forResource: name, withExtension: ext, subdirectory: "Bundled") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return url
    }
}
