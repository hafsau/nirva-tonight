import CoreText
import Foundation
import SwiftUI

/// Registers the bundled faces (OFL, Google Fonts latin subsets) once per process.
public enum NirvaFonts {
    @MainActor private static var registered = false

    @MainActor public static func register() {
        guard !registered else { return }
        registered = true
        let urls = Bundle.module.urls(forResourcesWithExtension: "ttf", subdirectory: "Bundled/Fonts") ?? []
        for url in urls {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

extension View {
    /// Apply a token type style: face, Dynamic Type scaling, line spacing, tracking, case.
    public func typeStyle(_ style: TypeStyle) -> some View {
        font(style.font)
            .lineSpacing(style.lineSpacing)
            .tracking(style.tracking)
            .textCase(style.uppercased ? .uppercase : nil)
    }
}
