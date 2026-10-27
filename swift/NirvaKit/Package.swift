// swift-tools-version: 6.0
import Foundation
import PackageDescription

// CI sets NIRVA_GENERABLE on a runner with the iOS 26 SDK, where the
// Foundation Models macros exist. Local builds without Xcode skip that file.
let generable = ProcessInfo.processInfo.environment["NIRVA_GENERABLE"] != nil

let package = Package(
    name: "NirvaKit",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [.library(name: "NirvaKit", targets: ["NirvaKit"])],
    targets: [
        .target(
            name: "NirvaKit",
            resources: [.copy("Resources")],
            swiftSettings: generable ? [.define("NIRVA_GENERABLE")] : []
        ),
        .testTarget(name: "NirvaKitTests", dependencies: ["NirvaKit"]),
    ]
)
