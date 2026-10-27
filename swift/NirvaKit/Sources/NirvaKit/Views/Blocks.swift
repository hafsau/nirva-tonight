import SwiftUI

/// One generated block. The switch is exhaustive over Block.Partial, so a new
/// block kind in the schema is a compile error here, not a silent blank card.
public struct BlockView: View {
    let block: Block.Partial
    let index: Int
    let replay: ReflectionReplay
    var onWhy: (Int) -> Void = { _ in }
    var onNotHow: () -> Void = {}

    public var body: some View {
        let done = replay.done(block: index)
        switch block {
        case .dayArc(let b): DayArcCard(arc: b, done: done)
        case .moment(let b):
            MomentCard(moment: b, done: done, ack: replay.ack, removed: replay.momentRemoved, canCorrect: !replay.corrected, onWhy: { onWhy(index) }, onNotHow: onNotHow)
        case .pattern(let b):
            PatternCard(pattern: b, done: done, note: replay.patternNote, tone: Binding(get: { replay.tone }, set: { replay.setTone($0) }), onWhy: { onWhy(index) })
        case .people(let b): PeopleCard(people: b, done: done, hidden: replay.hiddenPeople, onStop: { replay.hiddenPeople.insert($0) })
        case .hunch(let b): HunchCard(hunch: b, done: done, reply: replay.hunchReply, onReply: replay.reply)
        case .savor(let b): SavorCard(savor: b, done: done)
        }
    }
}

struct DayArcCard: View {
    let arc: DayArc.Partial
    let done: Done

    var body: some View {
        NirvaCard {
            SectionLabel(text: Copy.arcLabel)
            Group {
                if done("points"), done("paused"), done("removed"), done("marks"), let points = arc.points, let paused = arc.paused, let marks = arc.marks {
                    DayArcShape(points: points, paused: paused, removed: arc.removed ?? [], marks: marks)
                        .accessibilityElement()
                        .accessibilityLabel(arc.caption ?? Copy.arcLabel)
                } else {
                    RoundedRectangle(cornerRadius: Tokens.Radius.control).fill(Tokens.ColorToken.hairline.opacity(0.4)).frame(height: 150)
                }
            }
            .padding(.top, Tokens.Space.sm)
            FieldText(text: arc.caption, ready: done("caption"), style: .aside, color: Tokens.ColorToken.deep, placeholderLines: 2)
                .padding(.top, Tokens.Space.sm)
        }
    }
}

struct MomentCard: View {
    let moment: Moment.Partial
    let done: Done
    let ack: String?
    let removed: Bool
    let canCorrect: Bool
    let onWhy: () -> Void
    let onNotHow: () -> Void

    var body: some View {
        if removed, let ack {
            Text(ack)
                .typeStyle(.aside)
                .foregroundStyle(Tokens.ColorToken.deep)
                .padding(Tokens.Space.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .overlay(RoundedRectangle(cornerRadius: Tokens.Radius.card).strokeBorder(Tokens.ColorToken.hairline, style: StrokeStyle(lineWidth: 1, dash: [4, 4])))
        } else {
            NirvaCard {
                FieldText(text: moment.at.map(clock), ready: done("at"), style: .label, color: Tokens.ColorToken.slateInk)
                FieldText(text: moment.headline, ready: done("headline"), style: .title)
                    .padding(.top, Tokens.Space.xs)
                    .accessibilityAddTraits(.isHeader)
                FieldText(text: moment.body, ready: done("body"), placeholderLines: 3)
                    .padding(.top, Tokens.Space.xs)
                if let ack {
                    Text(ack).typeStyle(.aside).foregroundStyle(Tokens.ColorToken.deep).padding(.top, Tokens.Space.sm)
                }
                if done("body") {
                    ViewThatFits(in: .horizontal) {
                        HStack { why; Spacer(); notHow }
                        VStack(alignment: .leading) { why; notHow }
                    }
                    .padding(.top, Tokens.Space.sm)
                }
            }
        }
    }

    private var why: some View { Button(Copy.why, action: onWhy).buttonStyle(QuietLinkStyle()) }
    @ViewBuilder private var notHow: some View {
        if canCorrect { Button(Copy.notHow, action: onNotHow).buttonStyle(PillButtonStyle()) }
    }
}

struct PatternCard: View {
    let pattern: Pattern.Partial
    let done: Done
    let note: String?
    @Binding var tone: Delivery.Tone
    let onWhy: () -> Void

    /// The window's day labels, oldest first, ending today.
    private var days: [String] {
        let week = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"]
        let n = pattern.windowDays ?? 9
        return (0..<n).map { i in
            let back = n - 1 - i
            let label = week[(week.firstIndex(of: "Fri")! - back % 7 + 7) % 7]
            return back >= 7 ? "Last \(label)" : label
        }
    }

    var body: some View {
        let occurrences = pattern.occurrences ?? []
        let window = pattern.windowDays ?? 9
        NirvaCard {
            HStack(spacing: 0) {
                SectionLabel(text: "Pattern")
                if done("occurrences") {
                    Text(" · " + Copy.occurrences(occurrences.count, window)).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
                }
            }
            if let note, done("occurrences") {
                Text(note).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk).padding(.top, Tokens.Space.xxs)
            }
            HStack(spacing: Tokens.Space.xs) {
                ForEach(0..<window, id: \.self) { i in
                    let hit = done("occurrences") && occurrences.contains { $0.day.flatMap(days.firstIndex(of:)) == i }
                    Capsule().fill(hit ? Tokens.ColorToken.deep : Tokens.ColorToken.hairline).frame(height: 6)
                }
            }
            .padding(.top, Tokens.Space.sm)
            .accessibilityHidden(true)

            FieldText(text: pattern.delivery?.headline, ready: done("delivery", "headline"), style: .title)
                .padding(.top, Tokens.Space.md)
                .accessibilityAddTraits(.isHeader)
            FieldText(text: pattern.delivery?.body, ready: done("delivery", "body"), placeholderLines: 3)
                .padding(.top, Tokens.Space.xs)
            if let step = pattern.delivery?.step {
                FieldText(text: step, ready: done("delivery", "step"), style: .callout, color: Tokens.ColorToken.slateInk)
                    .padding(.leading, Tokens.Space.sm)
                    .overlay(alignment: .leading) { Rectangle().fill(Tokens.ColorToken.hairline).frame(width: 2) }
                    .padding(.top, Tokens.Space.sm)
            }
            if done("delivery") {
                ToneDial(tone: $tone).padding(.top, Tokens.Space.md)
                Button(Copy.why, action: onWhy).buttonStyle(QuietLinkStyle())
            }
        }
    }
}

/// Straight / Gentle / Just the pattern. Built from shapes (not a UISegmentedControl)
/// so it matches the pill language, scales to AX5, and renders in ImageRenderer.
struct ToneDial: View {
    @Binding var tone: Delivery.Tone

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.xs) {
            Text(Copy.dialLabel).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
            ViewThatFits(in: .horizontal) {
                HStack(spacing: Tokens.Space.xxs) { segments }.padding(Tokens.Space.xxs).background(Capsule().fill(Tokens.ColorToken.hairline.opacity(0.6)))
                VStack(spacing: Tokens.Space.xxs) { segments }.padding(Tokens.Space.xxs).background(RoundedRectangle(cornerRadius: Tokens.Radius.control).fill(Tokens.ColorToken.hairline.opacity(0.6)))
            }
            Text(Copy.dialHint).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Copy.dialLabel)
        .sensoryFeedback(.selection, trigger: tone)
    }

    private var segments: some View {
        ForEach(Copy.tones, id: \.0) { value, label in
            Button { tone = value } label: {
                Text(label)
                    .typeStyle(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(Tokens.ColorToken.deep)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Capsule().fill(tone == value ? Tokens.ColorToken.surface : .clear))
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(tone == value ? [.isSelected] : [])
        }
    }
}

struct PeopleCard: View {
    let people: People.Partial
    let done: Done
    let hidden: Set<String>
    let onStop: (String) -> Void

    var body: some View {
        // Never shown unless she opted in.
        if people.optedIn != false {
            card
        }
    }

    private var card: some View {
        NirvaCard {
            Text(Copy.peopleTitle).typeStyle(.title).foregroundStyle(Tokens.ColorToken.ink).accessibilityAddTraits(.isHeader)
            ForEach(Array((people.people ?? []).enumerated()), id: \.element.name) { i, person in
                Divider().overlay(Tokens.ColorToken.hairline).padding(.top, Tokens.Space.sm)
                if let name = person.name, hidden.contains(name) {
                    Text(Copy.stopped(name)).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk).padding(.top, Tokens.Space.sm)
                } else if done("people", "\(i)"), let name = person.name, let source = person.source {
                    VStack(alignment: .leading, spacing: Tokens.Space.xxs) {
                        ViewThatFits(in: .horizontal) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(name).typeStyle(.body).fontWeight(.semibold)
                                Spacer()
                                Text(Copy.source(source)).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
                            }
                            VStack(alignment: .leading) {
                                Text(name).typeStyle(.body).fontWeight(.semibold)
                                Text(Copy.source(source)).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
                            }
                        }
                        .foregroundStyle(Tokens.ColorToken.ink)
                        Text(person.observation ?? "").typeStyle(.callout).foregroundStyle(Tokens.ColorToken.ink).fixedSize(horizontal: false, vertical: true)
                        if let updated = person.updatedFrom {
                            Text(updated).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
                        }
                        Button("\(Copy.stopIncluding) \(name)") { onStop(name) }.buttonStyle(QuietLinkStyle())
                    }
                    .padding(.top, Tokens.Space.sm)
                } else {
                    FieldText(text: nil, ready: false, placeholderLines: 2).padding(.top, Tokens.Space.sm)
                }
            }
            FieldText(text: people.note, ready: done("note"), style: .caption, color: Tokens.ColorToken.slateInk, placeholderLines: 2)
                .padding(.top, Tokens.Space.xs)
        }
    }
}

struct HunchCard: View {
    let hunch: Hunch.Partial
    let done: Done
    let reply: String?
    let onReply: (String) -> Void

    var body: some View {
        NirvaCard(quiet: true) {
            SectionLabel(text: Copy.hunchLabel)
            FieldText(text: hunch.question, ready: done("question"), style: .aside, color: Tokens.ColorToken.deep)
                .padding(.top, Tokens.Space.xs)
            FieldText(text: hunch.reason, ready: done("reason"), style: .caption, color: Tokens.ColorToken.slateInk)
                .padding(.top, Tokens.Space.xxs)
            if done("replies") {
                if let reply {
                    Text(Copy.hunchReply(reply)).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk).padding(.top, Tokens.Space.sm)
                } else {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: Tokens.Space.xs) { replies }
                        VStack(alignment: .leading, spacing: Tokens.Space.xs) { replies }
                    }
                    .padding(.top, Tokens.Space.sm)
                }
            }
        }
    }
}

extension HunchCard {
    fileprivate var replies: some View {
        ForEach(hunch.replies ?? [], id: \.self) { r in
            Button(r) { onReply(r) }.buttonStyle(PillButtonStyle())
        }
    }
}

struct SavorCard: View {
    let savor: Savor.Partial
    let done: Done

    var body: some View {
        NirvaCard {
            SectionLabel(text: Copy.savorLabel)
            FieldText(text: savor.headline, ready: done("headline"), style: .title).padding(.top, Tokens.Space.xs).accessibilityAddTraits(.isHeader)
            FieldText(text: savor.body, ready: done("body"), placeholderLines: 2).padding(.top, Tokens.Space.xs)
            if let step = savor.step {
                FieldText(text: step, ready: done("step"), style: .callout, color: Tokens.ColorToken.slateInk)
                    .padding(.leading, Tokens.Space.sm)
                    .overlay(alignment: .leading) { Rectangle().fill(Tokens.ColorToken.hairline).frame(width: 2) }
                    .padding(.top, Tokens.Space.sm)
            }
        }
    }
}
