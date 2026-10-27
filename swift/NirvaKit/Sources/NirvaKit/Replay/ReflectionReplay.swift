import Foundation
import Observation

/// Plays tonight's stream into an observable snapshot. Views read `reflection`
/// (a Partial) and `done(_:)`; they never see the queue. With Foundation Models,
/// `play()` would become `for try await partial in session.streamResponse(...)`;
/// any backend that yields partial snapshots fits the same views.
@MainActor
@Observable
public final class ReflectionReplay {
    public private(set) var snapshot = Snapshot()
    public private(set) var reflection = Reflection.Partial()
    public private(set) var tone: Delivery.Tone = .gentle
    public private(set) var ack: String?
    public private(set) var patternNote: String?
    public private(set) var momentRemoved = false
    public private(set) var corrected = false
    public private(set) var hunchReply: String?
    public var hiddenPeople: Set<String> = []

    @ObservationIgnored private var queue: [Patch]
    @ObservationIgnored private let fixture: Fixture
    @ObservationIgnored let patternIndex: Int
    @ObservationIgnored let momentIndex: Int
    @ObservationIgnored let arcIndex: Int
    @ObservationIgnored let peopleIndex: Int
    @ObservationIgnored private var drain: Task<Void, Never>?

    public init(fixture: Fixture, stream: [Patch]) {
        self.fixture = fixture
        self.queue = stream
        patternIndex = fixture.reflection.blocks.firstIndex { if case .pattern = $0 { true } else { false } } ?? 0
        momentIndex = fixture.reflection.blocks.firstIndex { if case .moment = $0 { true } else { false } } ?? 0
        arcIndex = fixture.reflection.blocks.firstIndex { if case .dayArc = $0 { true } else { false } } ?? 0
        peopleIndex = fixture.reflection.blocks.firstIndex { if case .people = $0 { true } else { false } } ?? 0
    }

    public var isStreaming: Bool { !queue.isEmpty }
    public func done(block index: Int) -> Done { Done(snapshot, block: index) }

    /// Drain the queue at reading pace. Cancelling the task stops it cleanly,
    /// without applying a patch it was waiting on.
    public func play(speed: Double = 1) async {
        while let next = queue.first {
            do { try await Task.sleep(for: .milliseconds(Int(Self.delay(for: next) / speed))) } catch { return }
            guard queue.first == next else { continue }
            queue.removeFirst()
            apply(next)
        }
    }

    /// Dial and corrections append to the queue after the first play; keep draining.
    private func keepPlaying() {
        guard drain == nil else { return }
        drain = Task { [weak self] in
            await self?.play()
            self?.drain = nil
        }
    }

    public func reply(_ r: String) { hunchReply = r }

    /// Apply everything queued at once (renders, tests, Reduce Motion "show all").
    public func flush() {
        while !queue.isEmpty { apply(queue.removeFirst()) }
    }

    /// Apply the first `count` queued patches, for mid-stream renders.
    public func advance(_ count: Int) {
        for _ in 0..<min(count, queue.count) { apply(queue.removeFirst()) }
    }

    private func apply(_ patch: Patch) {
        snapshot.apply(patch)
        reflection = snapshot.reflection
    }

    static func delay(for patch: Patch) -> Double {
        if case .field("kind") = patch.p.last { return 260 }
        if case .string = patch.v { return 34 }
        return 8
    }

    // MARK: - The dial and corrections (mirror web/lib/tonight.ts)

    public func setTone(_ tone: Delivery.Tone) {
        guard tone != self.tone else { return }
        self.tone = tone
        queue += Self.restream(delivery: delivery(for: tone), at: [.field("blocks"), .index(patternIndex), .field("delivery")])
        keepPlaying()
    }

    /// A different feeling reinterprets the moment but keeps the facts (she still said
    /// sorry first), so the pattern keeps its count. "wrongMoment" and "forget" remove
    /// the moment and rebuild everything that leaned on it.
    public func correct(_ key: String) {
        guard !corrected else { return }
        let alt = fixture.alternates
        let moment: [Patch.Key] = [.field("blocks"), .index(momentIndex)]
        if let f = alt.feeling[key] {
            corrected = true
            ack = f.ack
            patternNote = alt.feelingPatternNote
            queue += Self.restream(string: f.headline, at: moment + [.field("headline")])
            queue += Self.restream(string: f.body, at: moment + [.field("body")])
            queue += Self.restream(string: f.summary, at: [.field("summary")])
            keepPlaying()
            return
        }
        guard key == "wrongMoment" || key == "forget" else { return }
        corrected = true
        momentRemoved = true
        ack = key == "forget" ? alt.removal.forget.ack : alt.removal.wrongMoment.ack
        patternNote = alt.removal.patternNote
        queue += Self.replace(block: .dayArc(alt.removal.arc), at: arcIndex)
        if case .pattern(let p) = fixture.reflection.blocks[patternIndex], case .moment(let m) = fixture.reflection.blocks[momentIndex] {
            let kept = p.occurrences.filter { !($0.day == "Fri" && $0.at == m.at) }
            let path: [Patch.Key] = [.field("blocks"), .index(patternIndex), .field("occurrences")]
            queue.append(Patch(p: path, v: .array([])))
            for (i, o) in kept.enumerated() {
                let item = path + [.index(i)]
                queue += Self.chunks(o.day, at: item + [.field("day")])
                queue += Self.chunks(o.at, at: item + [.field("at")])
                queue += Self.chunks(o.note, at: item + [.field("note")])
                queue.append(Patch(p: item, done: true))
            }
            queue.append(Patch(p: path, done: true))
        }
        queue += Self.restream(delivery: delivery(for: tone), at: [.field("blocks"), .index(patternIndex), .field("delivery")])
        queue += Self.replace(block: .people(alt.removal.people), at: peopleIndex)
        queue += Self.restream(string: alt.removal.summary, at: [.field("summary")])
        keepPlaying()
    }

    /// Swap a whole block in one step, then close every field in it.
    static func replace(block: Block, at index: Int) -> [Patch] {
        let path: [Patch.Key] = [.field("blocks"), .index(index)]
        guard let data = try? JSONEncoder().encode(block), let value = try? JSONDecoder().decode(JSONValue.self, from: data) else { return [] }
        var out = [Patch(p: path, v: value)]
        func close(_ v: JSONValue, _ p: [Patch.Key]) {
            switch v {
            case .object(let o): for (k, child) in o.sorted(by: { $0.key < $1.key }) { close(child, p + [.field(k)]) }
            case .array(let a): for (i, child) in a.enumerated() { close(child, p + [.index(i)]) }
            default: break
            }
            out.append(Patch(p: p, done: true))
        }
        close(value, path)
        return out
    }

    private func delivery(for tone: Delivery.Tone) -> Delivery {
        let set = momentRemoved ? fixture.alternates.removal.patternDelivery : fixture.alternates.patternDelivery
        return set[tone.rawValue]!
    }

    static func chunks(_ text: String, at path: [Patch.Key]) -> [Patch] {
        let words = text.split(separator: " ", omittingEmptySubsequences: false)
        return stride(from: 0, to: words.count, by: 3).map { i in
            let v = words[0..<min(i + 3, words.count)].joined(separator: " ")
            return Patch(p: path, v: .string(v), done: i + 3 >= words.count ? true : nil)
        }
    }

    static func restream(string: String, at path: [Patch.Key]) -> [Patch] {
        [Patch(p: path, v: .string(""))] + chunks(string, at: path)
    }

    static func restream(delivery d: Delivery, at path: [Patch.Key]) -> [Patch] {
        var out = [Patch(p: path, v: .object([:])), Patch(p: path + [.field("tone")], v: .string(d.tone.rawValue), done: true)]
        out += chunks(d.headline, at: path + [.field("headline")])
        out += chunks(d.body, at: path + [.field("body")])
        if let step = d.step { out += chunks(step, at: path + [.field("step")]) }
        out.append(Patch(p: path, done: true))
        return out
    }
}
