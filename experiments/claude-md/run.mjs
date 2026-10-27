#!/usr/bin/env node
// Does CLAUDE.md keep agent-written SwiftUI on-brand? Same prompt, same repo,
// two arms: with and without CLAUDE.md. Each run is a fresh headless `claude -p`
// in a scratch copy of the Swift package, allowed to read files but not to run
// anything. Each output is linted by scripts/lint-ui.mjs and must `swift build`.
//
//   node experiments/claude-md/run.mjs [runsPerArm=10] [model=sonnet]
//
// Writes experiments/claude-md/results.json and raw outputs to out/<arm>-<n>.swift.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lintSource } from "../../scripts/lint-ui.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const N = Number(process.argv[2] ?? 10);
const MODEL = process.argv[3] ?? "sonnet";

const PROMPT = `In swift/NirvaKit, add a SwiftUI card for the evening reflection called TomorrowCard.
It shows: a small label ("Tomorrow"), a serif headline ("Site walk at 8"), one sentence of body copy you write
that gently connects to tonight's pattern (she apologizes first when plans change), and two buttons:
"Remind me at 7:30" and "Not now". It should fit with the existing cards in Views/Blocks.swift.
Reply with ONLY the complete contents of Sources/NirvaKit/Views/TomorrowCard.swift in one swift code block.`;

function workspace(withConventions) {
  const dir = mkdtempSync(join(tmpdir(), "nirva-exp-"));
  cpSync(join(root, "swift/NirvaKit"), join(dir, "swift/NirvaKit"), { recursive: true, filter: (p) => !p.includes(".build") });
  if (withConventions) cpSync(join(root, "CLAUDE.md"), join(dir, "CLAUDE.md"));
  return dir;
}

function extractSwift(text) {
  const m = text.match(/```swift\n([\s\S]*?)```/);
  return m ? m[1] : null;
}

function builds(dir, swift) {
  writeFileSync(join(dir, "swift/NirvaKit/Sources/NirvaKit/Views/TomorrowCard.swift"), swift);
  const r = spawnSync("swift", ["build", "--package-path", join(dir, "swift/NirvaKit")], { encoding: "utf8", timeout: 600_000 });
  return r.status === 0;
}

const out = join(here, "out");
mkdirSync(out, { recursive: true });
const runs = [];
for (const arm of ["without", "with"]) {
  for (let i = 1; i <= N; i++) {
    const dir = workspace(arm === "with");
    const started = Date.now();
    const res = spawnSync(
      "claude",
      ["-p", PROMPT, "--model", MODEL, "--output-format", "json", "--allowedTools", "Read,Glob,Grep", "--setting-sources", "project"],
      { cwd: dir, encoding: "utf8", timeout: 600_000, maxBuffer: 20_000_000 },
    );
    let text = "",
      cost = null;
    try {
      const j = JSON.parse(res.stdout);
      text = j.result ?? "";
      cost = j.total_cost_usd ?? null;
    } catch {
      text = res.stdout ?? "";
    }
    const swift = extractSwift(text);
    // An auth error or refusal isn't a data point. Stop rather than record it.
    if (!swift || !/struct\s+TomorrowCard/.test(swift)) {
      console.error(`${arm} ${i}: no TomorrowCard in the reply, stopping. First 300 chars:\n${(text || res.stderr || "").slice(0, 300)}`);
      rmSync(dir, { recursive: true, force: true });
      process.exit(1);
    }
    const findings = lintSource(swift, "TomorrowCard.swift");
    const ok = builds(dir, swift);
    writeFileSync(join(out, `${arm}-${i}.swift`), swift);
    runs.push({ arm, i, findings: findings.map((f) => f.rule), offBrand: findings.length, builds: ok, cost, seconds: Math.round((Date.now() - started) / 1000) });
    console.log(arm, i, `${findings.length} findings`, ok ? "builds" : "BUILD FAILS", cost ? `$${cost.toFixed(3)}` : "");
    rmSync(dir, { recursive: true, force: true });
  }
}

const summarize = (arm) => {
  const r = runs.filter((x) => x.arm === arm);
  const byRule = {};
  for (const x of r) for (const f of x.findings) byRule[f] = (byRule[f] ?? 0) + 1;
  return {
    runs: r.length,
    clean: r.filter((x) => x.offBrand === 0).length,
    builds: r.filter((x) => x.builds).length,
    medianFindings: [...r.map((x) => x.offBrand)].sort((a, b) => a - b)[Math.floor(r.length / 2)],
    byRule,
  };
};
const results = {
  date: new Date().toISOString().slice(0, 10),
  model: MODEL,
  claudeVersion: execFileSync("claude", ["--version"], { encoding: "utf8" }).trim(),
  prompt: PROMPT,
  arms: { without: summarize("without"), with: summarize("with") },
  totalCostUsd: runs.reduce((s, r) => s + (r.cost ?? 0), 0),
  runs,
};
writeFileSync(join(here, "results.json"), JSON.stringify(results, null, 2));
if (existsSync(join(root, "web/lib/gen"))) writeFileSync(join(root, "web/lib/gen/experiment.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.arms, null, 2));
