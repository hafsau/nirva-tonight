# Tonight, Rendered

An evening reflection for an AI wearable, built as generative UI: honest content, gentle delivery, and a UI that says when it's guessing. Every card exists twice, as a React component and as a SwiftUI view, generated from one schema and one token file and replaying the same stream.

**Live:** https://web-black-eight-87.vercel.app · **Case study:** `/about` · **For engineers:** `/system`

> **Not affiliated with Nirva Labs.** An unofficial concept by [Hafsa Usmani](https://hafsausmani.com), made from public information for the Founding Product Designer role. Maya is fictional and every line is mock data. No Nirva logo, product images, or code. Typefaces are Libre Baskerville, Nunito Sans and Nunito (SIL OFL), the faces nirva.life uses.

## What to look at

- **The delivery dial**: Straight, Gentle, or Just the pattern. Only the delivery re-streams; the claim and the evidence can't change (a test enforces it).
- **"That's not how I felt"**: the moment rewrites itself, the pattern above it recounts from four to three, and the summary updates.
- **Rare, grammatical uncertainty**: at most one card in six, phrased as a question with its reason. No numbers on feelings.
- **Under the hood**: the raw patch stream, the partial snapshot each card renders from, and each card's SwiftUI source next to its render.

## How it fits together

```
tokens/tokens.json              → web/app/tokens.css              + NirvaKit/Gen/Tokens.swift
schema/reflection.schema.json   → web/lib/gen/schema.ts           + Reflection.swift (+ .Partial, @Generable mirror)
fixtures/tonight.json           → fixtures/tonight.stream.jsonl   → web replay + SwiftUI replay, tests and renders
web/lib/voice-rules.json        → Vitest copy lint                + Claude Code PostToolUse hook (scripts/lint-ui.mjs)
```

Field order in the schema is generation order: each card states its basis and confidence before any claim, and the summary is written last. Views show a field only once its stream closes (SwiftUI: `.redacted(reason: .placeholder)` until then). This mirrors Foundation Models' snapshot streaming of `PartiallyGenerated` types. That's the native pattern, not a claim about Nirva's stack.

## Run it

```bash
npm --prefix web ci && npm --prefix web run gen && npm --prefix web run dev
```

```bash
npm --prefix web test && npm --prefix web run e2e
```

```bash
swift build --package-path swift/NirvaKit
```

```bash
swift run --package-path swift/RenderTool nirva-render renders
```

The last one renders every SwiftUI state on a Mac without Xcode. `.github/workflows/swiftui.yml` builds the package for iOS, runs its tests, and renders the same states on the iOS Simulator; `node scripts/sync-swift.mjs <renders-dir>` brings the PNGs into the web app, and /system says which renderer produced them.

## Built with Claude Code

Written with Claude Code under [`CLAUDE.md`](CLAUDE.md), with every edit checked by the hook in [`.claude/settings.json`](.claude/settings.json), and reviewed by me. [`experiments/claude-md`](experiments/claude-md) runs the same SwiftUI prompt with and without those conventions and lints and compiles each result.
## License

MIT for the code (see LICENSE). Fonts are SIL OFL 1.1. Not affiliated with Nirva Labs.
