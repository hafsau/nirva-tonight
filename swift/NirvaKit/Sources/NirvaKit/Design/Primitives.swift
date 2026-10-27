import SwiftUI

/// UI copy that isn't model output. Mirrors web/lib/copy.ts; both are linted against the same voice rules.
public enum Copy {
    static let eyebrow = "Tonight"
    static let checkInQuestion = "Before I share mine, how did today feel?"
    static let checkInAnswered = "You said"
    static let why = "Why am I seeing this?"
    static let notHow = "That's not how I felt"
    static let dialLabel = "How should I say it?"
    static let dialHint = "Same observation, different delivery."
    static let peopleTitle = "Who you were with"
    static let stopIncluding = "Stop including"
    static let hunchLabel = "I'm less sure about this"
    static let savorLabel = "Worth keeping"
    static let arcLabel = "Your day"
    static let arcPaused = "You paused listening"
    static let arcRemoved = "You asked me to leave this out"
    static let notTonightDone = "Okay. It'll be here if you want it later."
    static let showNow = "Show it now"
    static let receiptTitle = "What this rests on"
    static let receiptAssumption = "How this concept assumes the pipeline works, based on what Nirva has said publicly. Not a description of Nirva's actual system."
    static let correctionTitle = "What fits better?"
    static let corrections: [(key: String, label: String)] = [
        ("relieved", "It felt more relieved"), ("tired", "It felt more tired"), ("focused", "It felt more focused"),
        ("wrongMoment", "That wasn't the moment"), ("forget", "Forget this"),
    ]
    static func stopped(_ name: String) -> String { "\(name) won't appear here again." }
    static func hunchReply(_ r: String) -> String {
        switch r {
        case "Yes": "Thanks. That helps me read tomorrow better."
        case "Not really": "Thanks. I'll read lunch as usual."
        default: "Okay. I'll leave lunch alone."
        }
    }
    static func signal(_ s: Basis.Signal) -> String {
        switch s {
        case .pace: "Pace"
        case .pitch: "Pitch"
        case .volume: "Volume"
        case .tone: "Tone of voice"
        case .words: "What you said"
        case .calendar: "Calendar"
        case .location: "Place"
        case .checkIn: "Your check-in"
        case .correction: "Something you told me"
        }
    }
    static let notTonight = "Not tonight"
    static func occurrences(_ n: Int, _ days: Int) -> String { "\(n) times in \(days) days" }
    static func source(_ s: Person.Source) -> String {
        switch s {
        case .calendar: "From your calendar"
        case .location: "From a place you saved"
        case .youSaid: "You said their name"
        }
    }
    static let tones: [(Delivery.Tone, String)] = [(.straight, "Straight"), (.gentle, "Gentle"), (.pattern, "Just the pattern")]
}

/// A field arriving: blur to sharp, a small rise. Reduce Motion gets a plain fade.
struct Settle: ViewModifier {
    var active: Bool
    func body(content: Content) -> some View {
        content.blur(radius: active ? 6 : 0).offset(y: active ? 8 : 0).opacity(active ? 0 : 1)
    }
}

extension AnyTransition {
    static func settle(reduceMotion: Bool) -> AnyTransition {
        reduceMotion ? .opacity : .modifier(active: Settle(active: true), identity: Settle(active: false))
    }
}

/// A generated text field. Holds its space with a redacted placeholder until the
/// stream closes it, then settles in whole. Never types out character by character.
struct FieldText: View {
    let text: String?
    let ready: Bool
    var style: TypeStyle = .body
    var color: Color = Tokens.ColorToken.ink
    var placeholderLines = 1
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .topLeading) {
            if ready, let text {
                Text(text)
                    .typeStyle(style)
                    .foregroundStyle(color)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .id(text)
                    .transition(.settle(reduceMotion: reduceMotion))
            } else {
                Text(String(repeating: "Placeholder words here ", count: placeholderLines * 2))
                    .typeStyle(style)
                    .lineLimit(placeholderLines)
                    .redacted(reason: .placeholder)
                    .foregroundStyle(Tokens.ColorToken.hairline)
                    .accessibilityHidden(true)
            }
        }
        .animation(reduceMotion ? Tokens.Motion.reduced : Tokens.Motion.settle, value: ready ? text : nil)
    }
}

struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text).typeStyle(.label).foregroundStyle(Tokens.ColorToken.slateInk)
    }
}

/// The card surface: measured nirva.life glass fill over mist, hairline stroke.
struct NirvaCard<Content: View>: View {
    var quiet = false
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .padding(Tokens.Space.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: Tokens.Radius.card, style: .continuous)
                    .fill(quiet ? Color.clear : Tokens.ColorToken.glass)
            }
            .overlay {
                RoundedRectangle(cornerRadius: Tokens.Radius.card, style: .continuous)
                    .strokeBorder(Tokens.ColorToken.hairline, lineWidth: 1)
            }
            .accessibilityElement(children: .contain)
    }
}

/// Pill button in the nirva.life shape: capsule, glass fill, deep ink, 44pt minimum.
struct PillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .typeStyle(.button)
            .foregroundStyle(Tokens.ColorToken.deep)
            .padding(.horizontal, Tokens.Space.md)
            .frame(minHeight: 44)
            .background(Capsule().fill(configuration.isPressed ? Tokens.ColorToken.glassStrong : Tokens.ColorToken.glass))
            .overlay(Capsule().strokeBorder(Tokens.ColorToken.hairline, lineWidth: 1))
            .contentShape(Capsule())
    }
}

struct QuietLinkStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .typeStyle(.caption)
            .underline(color: Tokens.ColorToken.hairline)
            .foregroundStyle(Tokens.ColorToken.slateInk)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}

/// 16:40 -> 4:40 PM
func clock(_ at: String) -> String {
    let parts = at.split(separator: ":").compactMap { Int($0) }
    guard parts.count == 2 else { return at }
    return "\((parts[0] + 11) % 12 + 1):\(String(format: "%02d", parts[1])) \(parts[0] < 12 ? "AM" : "PM")"
}
