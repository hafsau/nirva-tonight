// swift-tools-version: 6.0
import PackageDescription

// macOS-only helper: renders NirvaKit's catalog without Xcode.
//   swift run --package-path swift/RenderTool nirva-render <out-dir>
// Kept out of NirvaKit so the iOS build has a single library scheme.
let package = Package(
    name: "RenderTool",
    platforms: [.macOS(.v15)],
    dependencies: [.package(path: "../NirvaKit")],
    targets: [.executableTarget(name: "nirva-render", dependencies: ["NirvaKit"])]
)
