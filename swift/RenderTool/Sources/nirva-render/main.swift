import Foundation
import NirvaKit

// swift run nirva-render <out-dir>: render the catalog on macOS, no Xcode needed.
let dir = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "renders")
try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
MainActor.assumeIsolated {
    do {
        for entry in try RenderCatalog.entries() {
            guard let image = RenderCatalog.render(entry) else { print("FAILED", entry.name); exit(1) }
            _ = RenderCatalog.writePNG(image, to: dir.appendingPathComponent("\(entry.name).png"))
            print("rendered", entry.name, image.width, "x", image.height)
        }
    } catch {
        print("error", error)
        exit(1)
    }
}
