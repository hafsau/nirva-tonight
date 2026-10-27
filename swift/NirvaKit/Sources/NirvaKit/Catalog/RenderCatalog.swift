import ImageIO
import SwiftUI
import UniformTypeIdentifiers

/// Every state worth a picture, in one list. CI renders it on the iOS Simulator
/// (RenderTests); `swift run --package-path swift/RenderTool nirva-render` renders it on a Mac without Xcode.
/// AnyView is fine here: this is a test harness, not product UI.
@MainActor
public enum RenderCatalog {
    public struct Entry {
        public let name: String
        public let view: AnyView
        public var size: DynamicTypeSize = .large
    }

    public static func entries() throws -> [Entry] {
        let fixture = try Fixture.load()
        let stream = try Fixture.stream()
        func replay(_ setup: (ReflectionReplay) -> Void = { _ in }) -> ReflectionReplay {
            let r = ReflectionReplay(fixture: fixture, stream: stream)
            r.flush()
            setup(r)
            r.flush()
            return r
        }
        func card(_ r: ReflectionReplay, _ kind: String) -> AnyView {
            let i = fixture.reflection.blocks.firstIndex { $0.kindName == kind }!
            return AnyView(BlockView(block: r.reflection.blocks![i], index: i, replay: r).padding(Tokens.Space.md))
        }
        let mid = ReflectionReplay(fixture: fixture, stream: stream)
        mid.advance(150)

        var out = [
            Entry(name: "screen-final", view: AnyView(ReflectionContent(replay: replay()))),
            Entry(name: "screen-streaming", view: AnyView(ReflectionContent(replay: mid))),
        ]
        for kind in ["dayArc", "moment", "pattern", "people", "hunch", "savor"] {
            out.append(Entry(name: "card-\(kind)", view: card(replay(), kind)))
        }
        for tone in Delivery.Tone.allCases {
            out.append(Entry(name: "pattern-\(tone.rawValue)", view: card(replay { $0.setTone(tone) }, "pattern")))
        }
        let corrected = replay { $0.correct("relieved") }
        out.append(Entry(name: "moment-corrected", view: card(corrected, "moment")))
        out.append(Entry(name: "pattern-corrected", view: card(corrected, "pattern")))
        let forgotten = replay { $0.correct("forget") }
        out.append(Entry(name: "pattern-removed", view: card(forgotten, "pattern")))
        out.append(Entry(name: "arc-removed", view: card(forgotten, "dayArc")))
        out.append(Entry(name: "screen-removed", view: AnyView(ReflectionContent(replay: forgotten))))
        out.append(Entry(name: "pattern-ax5", view: card(replay(), "pattern"), size: .accessibility5))
        out.append(Entry(name: "moment-ax5", view: card(replay(), "moment"), size: .accessibility5))
        return out
    }

    /// Render one entry at 3x, 390pt wide (iPhone). Returns nil if SwiftUI couldn't draw it.
    public static func render(_ entry: Entry, width: CGFloat = 390) -> CGImage? {
        NirvaFonts.register()
        let renderer = ImageRenderer(content: entry.view.frame(width: width).background(Tokens.ColorToken.mist).environment(\.dynamicTypeSize, entry.size))
        renderer.scale = 3
        return renderer.cgImage
    }

    public static func writePNG(_ image: CGImage, to url: URL) -> Bool {
        guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { return false }
        CGImageDestinationAddImage(dest, image, nil)
        return CGImageDestinationFinalize(dest)
    }
}

extension Block {
    var kindName: String {
        switch self {
        case .dayArc: "dayArc"
        case .moment: "moment"
        case .pattern: "pattern"
        case .people: "people"
        case .hunch: "hunch"
        case .savor: "savor"
        }
    }
}
