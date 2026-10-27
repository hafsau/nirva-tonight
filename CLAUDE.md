# Tonight, Rendered: conventions for agents

You're working on a generative-UI concept: an evening reflection for an AI wearable, in SwiftUI (`swift/NirvaKit`) and on the web (`web/`). Both render the same schema and the same fixture. Follow these rules for any UI you write; the PostToolUse hook (`scripts/lint-ui.mjs`) checks them on every edit and will tell you what to fix.

## Tokens, never raw values
- Colors, spacing, radii, type and motion come from `tokens/tokens.json`. Run `npm --prefix web run gen` after changing it.
- SwiftUI: `Tokens.ColorToken.*`, `Tokens.Space.*`, `Tokens.Radius.*`, `.typeStyle(.body)`, `Tokens.Motion.*`. No `Color(red:…)`, `Color("…")`, `.font(.system…)`, `.font(.custom…)` or numeric `.padding(…)` in views.
- Web: `bg-mist`, `text-ink`, `type-body`, `var(--space-md)`, etc. No hex, `rgb()`, or Tailwind palette colors (`bg-gray-*`, `text-blue-*`) in components.
- `slate` (#627B82) is for the accent word in serif display text only (3.4:1). Secondary text uses `slateInk`.

## Generative UI
- The schema (`schema/reflection.schema.json`) is the contract. Field order is generation order: basis and confidence come before any claim, the summary comes last. Don't reorder fields to suit a layout.
- Views render from partial snapshots (`Block.Partial` in Swift, `Partial<Block>` on the web). A field shows only when its stream closes. Until then, hold its space with a placeholder (`.redacted(reason: .placeholder)`); never type text out character by character.
- Switch exhaustively over `Block.Partial`. No `default:` and no `AnyView` in product views.
- Re-streams (the dial, corrections) reopen a field and stream it again. Only the delivery changes on the dial; the claim and the evidence never do.

## Voice (also enforced by `web/lib/voice-rules.json`)
- Honest, not flattering. Short and specific. About her state, never a verdict on her or anyone else.
- No scores, numbers or percentages on feelings. Use evidence counts ("4 times in 9 days") and her own baseline ("faster than your usual Friday").
- Banned: track, monitor, record(ing), transcript, meeting, productivity, always, everyone, diagnostic words, "draining", cheerleading ("you've got this", "journey", "amazing").
- Low confidence is a question with its reason, at most one card in six.
- Safety copy is fixed in `web/lib/copy.ts` (web only in this concept; Swift UI strings live in `enum Copy` in `Design/Primitives.swift`). Never generate it, never trigger it from tone.

## Accessibility
- Every interactive element is at least 44pt and has a text label. Icon-only controls need `accessibilityLabel` / `aria-label`.
- Type styles use `relativeTo:` so Dynamic Type works up to AX5. Wrap rows in `ViewThatFits(in: .horizontal)` with a vertical fallback.
- Read `accessibilityReduceMotion` / `prefers-reduced-motion`: crossfade only.
- Announce finished blocks, not tokens.

## Checks
- `npm --prefix web test` (replay, dial invariants, corrections, voice lint), `npm --prefix web run e2e` (flows + axe).
- `swift build` in `swift/NirvaKit`; `swift run --package-path swift/RenderTool nirva-render <dir>` renders the catalog on macOS without Xcode. `.github/workflows/swiftui.yml` tests and renders on the iOS Simulator.
