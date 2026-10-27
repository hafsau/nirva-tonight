import Foundation
import Testing
@testable import NirvaKit

@MainActor
struct ReplayTests {
    let fixture = try! Fixture.load()
    let stream = try! Fixture.stream()

    @Test func replayingTheStreamRebuildsTheReflection() throws {
        var snap = Snapshot()
        stream.forEach { snap.apply($0) }
        let data = try JSONEncoder().encode(snap.tree)
        #expect(try JSONDecoder().decode(Reflection.self, from: data) == fixture.reflection)
    }

    @Test func summaryIsGeneratedLast() {
        let lastTopLevel = stream.last { $0.done == true && $0.p.count == 1 }
        #expect(lastTopLevel?.p.first?.description == "summary")
    }

    @Test(arguments: Delivery.Tone.allCases)
    func dialChangesOnlyTheDelivery(tone: Delivery.Tone) throws {
        let replay = ReflectionReplay(fixture: fixture, stream: stream)
        replay.flush()
        let before = replay.reflection
        replay.setTone(tone)
        replay.flush()
        guard case .pattern(let p) = replay.reflection.blocks?[replay.patternIndex] else { Issue.record("no pattern"); return }
        if tone != .gentle { #expect(p.delivery?.body == fixture.alternates.patternDelivery[tone.rawValue]?.body) }
        for (i, b) in (replay.reflection.blocks ?? []).enumerated() where i != replay.patternIndex {
            #expect(b == before.blocks?[i])
        }
    }

    @Test(arguments: ["relieved", "tired", "focused"])
    func feelingCorrectionKeepsTheFacts(key: String) {
        let replay = ReflectionReplay(fixture: fixture, stream: stream)
        replay.flush()
        replay.correct(key)
        replay.flush()
        guard case .pattern(let p) = replay.reflection.blocks?[replay.patternIndex] else { Issue.record("no pattern"); return }
        #expect(p.occurrences?.count == 4)
        #expect(replay.reflection.summary == fixture.alternates.feeling[key]?.summary)
        #expect(!replay.momentRemoved)
    }

    @Test(arguments: ["wrongMoment", "forget"])
    func removalRebuildsEverythingThatLeanedOnIt(key: String) throws {
        let replay = ReflectionReplay(fixture: fixture, stream: stream)
        replay.flush()
        replay.correct(key)
        replay.flush()
        guard case .pattern(let p) = replay.reflection.blocks?[replay.patternIndex] else { Issue.record("no pattern"); return }
        #expect(p.occurrences?.compactMap(\.day) == ["Last Thu", "Tue", "Wed"])
        #expect(p.delivery?.body?.contains("Three times") == true)
        #expect(replay.reflection.summary == fixture.alternates.removal.summary)
        guard case .dayArc(let arc) = replay.reflection.blocks?[replay.arcIndex] else { Issue.record("no arc"); return }
        #expect(arc.marks?.contains { $0.at == "16:40" } == false)
        #expect(replay.snapshot.isClosed("blocks.\(replay.arcIndex)"))
    }

    @Test func dialKeepsStreamingAfterTheFirstPlay() async throws {
        let replay = ReflectionReplay(fixture: fixture, stream: stream)
        replay.flush()
        replay.setTone(.pattern)
        for _ in 0..<200 where replay.isStreaming { try await Task.sleep(for: .milliseconds(20)) }
        guard case .pattern(let p) = replay.reflection.blocks?[replay.patternIndex] else { Issue.record("no pattern"); return }
        #expect(p.delivery?.body == fixture.alternates.patternDelivery["pattern"]?.body)
    }
}
