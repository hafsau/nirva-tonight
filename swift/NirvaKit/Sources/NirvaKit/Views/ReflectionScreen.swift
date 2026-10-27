import SwiftUI

/// Tonight's reflection. `ReflectionContent` is the scroll-free body (used directly
/// for ImageRenderer); `ReflectionScreen` wraps it in a ScrollView, plays the
/// stream, and owns the sheets.
public struct ReflectionScreen: View {
    @State private var replay: ReflectionReplay
    @State private var lastAnnounced = 0
    @State private var why: WhyItem?
    @State private var correcting = false

    public init(replay: ReflectionReplay) {
        _replay = State(initialValue: replay)
    }

    public var body: some View {
        ScrollView {
            ReflectionContent(replay: replay, onWhy: { why = WhyItem(index: $0) }, onNotHow: { correcting = true })
        }
        .background(Tokens.ColorToken.mist.ignoresSafeArea())
        .task { await replay.play() }
        // One announcement per finished block, not per token.
        .onChange(of: closedBlocks) { _, count in
            guard count > lastAnnounced else { return }
            lastAnnounced = count
            AccessibilityNotification.Announcement("\(count) of \(replay.reflection.blocks?.count ?? count) ready").post()
        }
        .onChange(of: replay.ack) { _, ack in
            if let ack { AccessibilityNotification.Announcement(ack).post() }
        }
        .confirmationDialog(Copy.correctionTitle, isPresented: $correcting, titleVisibility: .visible) {
            ForEach(Copy.corrections, id: \.key) { c in
                Button(c.label, role: c.key == "forget" ? .destructive : nil) { replay.correct(c.key) }
            }
        }
        .sheet(item: $why) { item in
            ReceiptSheet(basis: basis(for: item.index))
                .presentationDetents([.medium, .large])
        }
    }

    private var closedBlocks: Int {
        (0..<(replay.reflection.blocks?.count ?? 0)).filter { replay.snapshot.isClosed("blocks.\($0)") }.count
    }

    /// What a block rests on, from the current snapshot (so it reflects corrections).
    private func basis(for index: Int) -> [Basis.Partial] {
        switch replay.reflection.blocks?[index] {
        case .dayArc(let b): b.basis ?? []
        case .moment(let b): b.basis ?? []
        case .hunch(let b): b.basis ?? []
        case .savor(let b): b.basis ?? []
        case .pattern(let b):
            (b.occurrences ?? []).map { Basis.Partial(signal: .words, at: $0.at, note: "\($0.day ?? ""): \($0.note ?? "")") }
        case .people, .none: []
        }
    }
}

struct WhyItem: Identifiable {
    let index: Int
    var id: Int { index }
}

struct ReceiptSheet: View {
    let basis: [Basis.Partial]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(Copy.receiptTitle).typeStyle(.title).foregroundStyle(Tokens.ColorToken.ink).accessibilityAddTraits(.isHeader)
                ForEach(Array(basis.enumerated()), id: \.offset) { _, b in
                    VStack(alignment: .leading, spacing: Tokens.Space.xxs) {
                        SectionLabel(text: [b.signal.map(Copy.signal), b.at.map(clock)].compactMap { $0 }.joined(separator: " · "))
                        Text(b.note ?? "").typeStyle(.callout).foregroundStyle(Tokens.ColorToken.ink)
                    }
                    .padding(Tokens.Space.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: Tokens.Radius.control).fill(Tokens.ColorToken.glass))
                }
                Text(Copy.receiptAssumption).typeStyle(.caption).italic().foregroundStyle(Tokens.ColorToken.slateInk)
            }
            .padding(Tokens.Space.lg)
        }
        .background(Tokens.ColorToken.mist)
    }
}

public struct ReflectionContent: View {
    let replay: ReflectionReplay
    var onWhy: (Int) -> Void = { _ in }
    var onNotHow: () -> Void = {}
    @State private var notTonight = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(replay: ReflectionReplay, onWhy: @escaping (Int) -> Void = { _ in }, onNotHow: @escaping () -> Void = {}) {
        self.replay = replay
        self.onWhy = onWhy
        self.onNotHow = onNotHow
    }

    public var body: some View {
        let r = replay.reflection
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                HStack {
                    SectionLabel(text: "\(Copy.eyebrow) · \(r.day ?? "")")
                    Spacer()
                    if !notTonight {
                        Button(Copy.notTonight) { notTonight = true }.buttonStyle(QuietLinkStyle())
                    }
                }
                Group {
                    if replay.snapshot.isClosed("summary"), let summary = r.summary {
                        AccentedLine(text: summary)
                            .id(summary)
                            .transition(.settle(reduceMotion: reduceMotion))
                    } else {
                        FieldText(text: nil, ready: false, style: .display, placeholderLines: 2)
                    }
                }
                .accessibilityAddTraits(.isHeader)
                ViewThatFits(in: .horizontal) {
                    HStack { checkInQuestion; checkInAnswer }
                    VStack(alignment: .leading) { checkInQuestion; checkInAnswer }
                }
                .padding(.top, Tokens.Space.xs)
            }
            .padding(.horizontal, Tokens.Space.xxs)
            .padding(.bottom, Tokens.Space.md)

            if notTonight {
                VStack(alignment: .leading, spacing: Tokens.Space.md) {
                    Text(Copy.notTonightDone).typeStyle(.aside).foregroundStyle(Tokens.ColorToken.deep)
                    Button(Copy.showNow) { notTonight = false }.buttonStyle(PillButtonStyle())
                }
                .padding(.horizontal, Tokens.Space.xxs)
            } else {
                ForEach(Array((r.blocks ?? []).enumerated()), id: \.offset) { i, block in
                    BlockView(block: block, index: i, replay: replay, onWhy: onWhy, onNotHow: onNotHow)
                        .transition(.settle(reduceMotion: reduceMotion))
                }
            }
        }
        .padding(.horizontal, Tokens.Space.md)
        .padding(.vertical, Tokens.Space.xl)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Tokens.ColorToken.mist)
    }

    private var checkInQuestion: some View {
        Text(Copy.checkInQuestion).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
    }

    private var checkInAnswer: some View {
        Text("\(Copy.checkInAnswered): \(replay.reflection.checkIn ?? "")")
            .typeStyle(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(Tokens.ColorToken.deep)
            .padding(.horizontal, Tokens.Space.sm)
            .padding(.vertical, Tokens.Space.xxs)
            .background(Capsule().fill(Tokens.ColorToken.glass))
            .overlay(Capsule().strokeBorder(Tokens.ColorToken.hairline))
    }
}

/// Serif line with the last two words in the slate accent, like nirva.life's headlines.
struct AccentedLine: View {
    let text: String
    var body: some View {
        let words = text.split(separator: " ")
        let head = words.dropLast(2).joined(separator: " ")
        let tail = words.suffix(2).joined(separator: " ")
        Text("\(head) \(Text(tail).foregroundStyle(Tokens.ColorToken.slate))")
            .foregroundStyle(Tokens.ColorToken.ink)
            .typeStyle(.display)
            .fixedSize(horizontal: false, vertical: true)
    }
}

// PreviewProvider rather than #Preview so the package still builds with Command Line Tools alone.
struct ReflectionScreen_Previews: PreviewProvider {
    static var previews: some View {
        NirvaFonts.register()
        return ReflectionScreen(replay: ReflectionReplay(fixture: try! Fixture.load(), stream: try! Fixture.stream()))
            .previewDisplayName("Tonight, streaming")
    }
}
