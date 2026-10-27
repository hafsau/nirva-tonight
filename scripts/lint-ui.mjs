#!/usr/bin/env node
// On-brand lint for UI code, written for agents. Used three ways:
//   1. Claude Code PostToolUse hook (.claude/settings.json): reads the hook JSON on
//      stdin, lints the edited file, exits 2 with findings so the agent fixes them.
//   2. CLI: node scripts/lint-ui.mjs <file...>   (prints findings, exit 1 if any)
//   3. Module: import { lintSource } for the CLAUDE.md experiment.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const voice = JSON.parse(readFileSync(join(root, "web/lib/voice-rules.json"), "utf8")).rules;

const SWIFT_RULES = [
  { id: "raw-color", why: "Use Tokens.ColorToken.*", re: /Color\s*\(\s*(red:|\.sRGB|hue:|white:|"|#)|Color\.(red|blue|green|gray|grey|orange|yellow|purple|pink|black|white|primary|secondary)\b|UIColor\(/ },
  { id: "raw-font", why: "Use .typeStyle(...) from the token type scale", re: /\.font\(\s*\.(system|title|body|headline|caption|footnote|largeTitle|callout|subheadline)|\.font\(\s*Font\.(system|custom)|Font\.custom\(/ },
  { id: "raw-spacing", why: "Use Tokens.Space.* for padding and spacing", re: /\.padding\(\s*(\.\w+\s*,\s*)?\d+(\.\d+)?\s*\)|spacing:\s*\d{2,}/ },
  { id: "raw-radius", why: "Use Tokens.Radius.*", re: /cornerRadius:\s*\d{2,}/ },
  { id: "anyview", why: "No AnyView in product views; switch exhaustively", re: /\bAnyView\b/ },
  { id: "reduce-motion", why: "Read @Environment(\\.accessibilityReduceMotion), don't hard-code it", re: /reduceMotion:\s*(false|true)\b/ },
  { id: "default-case", why: "Switch exhaustively over Block.Partial (no default:)", re: /switch\s+block[\s\S]{0,400}?default:/ },
  { id: "icon-no-label", why: "Icon-only buttons need .accessibilityLabel", re: /Button\s*\{[^}]*\}\s*label:\s*\{\s*Image\([^)]*\)\s*\}(?![\s\S]{0,120}accessibilityLabel)/ },
  { id: "small-target", why: "Tap targets are at least 44pt", re: /\.frame\(\s*(width|height):\s*([1-3]\d|[1-9])\s*,\s*(width|height):\s*([1-3]\d|[1-9])\s*\)\s*\n?\s*\.onTapGesture/ },
];
const WEB_RULES = [
  { id: "raw-color", why: "Use token classes (bg-mist, text-ink) or var(--color-*)", re: /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d|\b(bg|text|border|fill|stroke)-(gray|slate|zinc|neutral|stone|red|blue|green|yellow|indigo|purple|pink|sky|teal|emerald|amber)-\d{2,3}\b/ },
  { id: "raw-font", why: "Use type-* classes from the token scale", re: /font-family:\s*['"]?(Inter|Arial|Helvetica|Roboto)|\bfont-(serif|mono)\b(?!-)|\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/ },
  { id: "img-no-alt", why: "Images need alt text", re: /<img(?![^>]*\balt=)[^>]*>/ },
];

/** Strings in source that a user will read: Swift/TS string literals and JSX text. */
function userStrings(src) {
  const out = [];
  const isClassList = (s) => {
    const words = s.trim().split(/\s+/);
    return words.filter((w) => /[-:[\]]/.test(w)).length >= words.length / 2;
  };
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.){6,})"/g)) if (/\s/.test(m[1]) && !isClassList(m[1])) out.push(m[1]);
  for (const m of src.matchAll(/>\s*([A-Z][^<>{}]{8,})\s*</g)) out.push(m[1]);
  return out;
}

export function lintSource(src, file = "x.swift") {
  const isSwift = file.endsWith(".swift");
  const isWeb = /\.(tsx|jsx|css)$/.test(file);
  // Generated token files are the one place raw values belong.
  if (/Gen\/Tokens\.swift$|tokens\.css$|globals\.css$/.test(file)) return [];
  const rules = isSwift ? SWIFT_RULES : isWeb ? WEB_RULES : [];
  const findings = [];
  const lines = src.split("\n");
  for (const r of rules) {
    const re = new RegExp(r.re.source, r.re.flags.includes("g") ? r.re.flags : r.re.flags + "g");
    for (const m of src.matchAll(re)) {
      const line = src.slice(0, m.index).split("\n").length;
      if (/lint-ui:\s*ignore/.test(lines[line - 1] ?? "")) continue;
      findings.push({ rule: r.id, line, text: m[0].slice(0, 60), why: r.why });
    }
  }
  // Voice rules are for product UI (what Maya reads), not case-study pages about it.
  const isProduct = isSwift || /components\/tonight\//.test(file);
  if (isProduct) {
    for (const s of userStrings(src)) {
      for (const v of voice) {
        const m = s.match(new RegExp(`\\b(?:${v.patterns.join("|")})\\b`, "i"));
        if (m) findings.push({ rule: `voice:${v.id}`, line: src.split("\n").findIndex((l) => l.includes(s.slice(0, 20))) + 1, text: m[0], why: v.why });
      }
    }
  }
  return findings;
}

const format = (file, f) => `${file}:${f.line}  ${f.rule}  "${f.text}"  -> ${f.why}`;

async function main() {
  if (process.argv.length > 2) {
    let n = 0;
    for (const file of process.argv.slice(2)) {
      for (const f of lintSource(readFileSync(file, "utf8"), file)) {
        console.log(format(file, f));
        n++;
      }
    }
    process.exit(n ? 1 : 0);
  }
  // Hook mode: { tool_input: { file_path } } on stdin.
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const file = JSON.parse(input || "{}").tool_input?.file_path;
  if (!file || !/\.(swift|tsx|jsx)$/.test(file)) process.exit(0);
  const findings = lintSource(readFileSync(file, "utf8"), file);
  if (!findings.length) process.exit(0);
  console.error(`Off-brand UI in ${file}. Fix these (see CLAUDE.md):\n` + findings.map((f) => format(file, f)).join("\n"));
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
