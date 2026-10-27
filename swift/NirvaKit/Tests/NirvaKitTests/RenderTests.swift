import Foundation
import Testing
@testable import NirvaKit

/// Renders the whole catalog with ImageRenderer. On CI this runs on the iOS
/// Simulator and writes PNGs to $RENDER_DIR (xcodebuild passes TEST_RUNNER_RENDER_DIR).
/// Without RENDER_DIR it still renders, so a view that can't draw fails the build.
@MainActor
struct RenderTests {
    @Test func everyCatalogEntryRenders() throws {
        let dir = ProcessInfo.processInfo.environment["RENDER_DIR"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        for entry in try RenderCatalog.entries() {
            let image = try #require(RenderCatalog.render(entry), "\(entry.name) did not render")
            #expect(image.width == 390 * 3, "\(entry.name)")
            if let dir { #expect(RenderCatalog.writePNG(image, to: dir.appendingPathComponent("\(entry.name).png"))) }
        }
    }
}
