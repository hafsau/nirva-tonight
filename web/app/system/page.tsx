import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Catalog } from "@/components/system/catalog";
import experiment from "@/lib/gen/experiment.json";
import schema from "@/lib/gen/reflection.schema.json";
import { SWIFT_MANIFEST, SWIFT_RENDERS } from "@/lib/gen/swift";
import { CONTRAST_ON_MIST, TOKENS } from "@/lib/gen/tokens";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "System" };

const REPO = SITE.repo;

function Section({ id, title, accent, intro, children }: { id: string; title: string; accent?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-hairline py-12">
      <h2 id={id} className="type-display text-ink">
        {title} {accent && <span className="text-slate">{accent}</span>}
      </h2>
      {intro && <div className="type-body mt-3 max-w-[66ch] text-ink">{intro}</div>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

const PIPES = [
  { src: "tokens/tokens.json", outs: ["web/app/tokens.css", "NirvaKit/Gen/Tokens.swift"], what: "Color, space, radius, type, motion" },
  { src: "schema/reflection.schema.json", outs: ["web/lib/gen/schema.ts", "Reflection.swift + .Partial + @Generable"], what: "What the model returns, in generation order" },
  { src: "fixtures/tonight.json", outs: ["tonight.stream.jsonl (273 patches)", "web replay · SwiftUI replay + renders"], what: "Maya's Friday, and every dial and correction alternate" },
  { src: "web/lib/voice-rules.json", outs: ["Vitest copy lint", "Claude Code PostToolUse hook"], what: "Voice rules as patterns" },
];

type Arm = { runs: number; clean: number; builds: number; medianFindings: number; byRule: Record<string, number> };
type Experiment = { pending?: boolean; date?: string; model?: string; arms?: { without: Arm; with: Arm }; totalCostUsd?: number };

export default function SystemPage() {
  const exp = experiment as Experiment;
  const moment = (schema as unknown as { types: Record<string, { fields: [string, unknown, string?][] }> }).types.Moment.fields;
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-8">
      <h1 className="type-display text-ink">
        One source, <span className="text-slate">two platforms</span>
      </h1>
      <p className="type-body mt-3 max-w-[66ch] text-ink">
        For the engineers. Everything on the first page comes from four files. Each one generates both the web code and the Swift code, so SwiftUI and the web can&rsquo;t drift apart quietly. The SwiftUI is real: a Swift package that builds,
        renders itself, with tests and a CI workflow for the iOS Simulator. <a className="text-deep underline underline-offset-2" href={REPO}>Source on GitHub</a>.
      </p>

      <ol className="mt-8 grid gap-3 md:grid-cols-2">
        {PIPES.map((p) => (
          <li key={p.src} className="glass rounded-[var(--radius-card)] border border-hairline p-5">
            <p className="type-code text-deep">{p.src}</p>
            <p className="type-caption mt-1 text-slate-ink">{p.what}</p>
            <ul className="mt-3 flex flex-col gap-1">
              {p.outs.map((o) => (
                <li key={o} className="type-code flex gap-2 text-ink">
                  <span aria-hidden="true">→</span>
                  {o}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <Section
        id="order"
        title="Field order is a"
        accent="UX decision"
        intro={
          <p>
            A streamed snapshot fills fields top to bottom. So the schema makes each card say what it rests on and how sure it is before it is allowed to make a claim, and the one-line summary is written last, after every card exists. The view shows a
            field only once it closes, so nothing types itself out and nothing is shown that the model might still walk back. In SwiftUI this is the Foundation Models pattern: snapshots of a <code className="type-code">PartiallyGenerated</code> type
            whose fields fill in declared order. That&rsquo;s the native pattern, not a claim about Nirva&rsquo;s stack: any backend that yields partial snapshots fits.
          </p>
        }
      >
        <ol className="flex max-w-[640px] flex-col gap-2">
          {moment.map(([field, , doc], i) => (
            <li key={field} className="flex gap-4 rounded-[var(--radius-control)] border border-hairline px-4 py-3">
              <span className="type-label w-6 text-slate-ink">{i + 1}</span>
              <div>
                <p className="type-code text-deep">Moment.{field}</p>
                <p className="type-caption text-ink">
                  {doc ??
                    {
                      id: "Stable identity, so a re-stream updates the card in place.",
                      basis: "What it heard: pace, pitch, notes about her words, calendar. Written first.",
                      confidence: "Clear or tentative. Tentative turns the card into a question.",
                      at: "When.",
                      headline: "Only now, the claim.",
                      body: "And its explanation.",
                    }[field]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="catalog"
        title="Every card,"
        accent="twice"
        intro={
          <p>
            Left: the React component you saw on the first page. Right: the NirvaKit SwiftUI view rendering the same fixture.{" "}
            {SWIFT_MANIFEST?.source === "ios-simulator"
              ? `Rendered on the iOS Simulator (${SWIFT_MANIFEST.device}, ${SWIFT_MANIFEST.os}) by GitHub Actions at commit ${SWIFT_MANIFEST.sha?.slice(0, 7)}.`
              : "Rendered on macOS by SwiftUI's ImageRenderer from the package; CI replaces these with iOS Simulator renders."}{" "}
            {SWIFT_RENDERS.length} renders in total, including each dial position, the corrected state, and AX5 Dynamic Type.
          </p>
        }
      >
        <Catalog />
      </Section>

      <Section id="tokens" title="Tokens," accent="measured" intro={<p>Inferred from nirva.life&rsquo;s computed styles on October 27, 2026. A starting point to replace with the real system, not a claim to know it.</p>}>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Color tokens, scrolls sideways">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Color tokens with contrast against mist</caption>
            <thead>
              <tr className="type-label text-slate-ink">
                <th scope="col" className="py-2 pr-4 font-bold">
                  Token
                </th>
                <th scope="col" className="py-2 pr-4 font-bold">
                  Value
                </th>
                <th scope="col" className="py-2 pr-4 font-bold">
                  On mist
                </th>
                <th scope="col" className="py-2 font-bold">
                  Use
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TOKENS.color).map(([k, v]) => (
                <tr key={k} className="border-t border-hairline align-top">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="inline-block size-5 rounded-full border border-hairline" style={{ background: `var(--color-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())})` }} />
                      <span className="type-code text-deep">{k}</span>
                    </span>
                  </th>
                  <td className="type-code py-3 pr-4 text-ink">{v.value}</td>
                  <td className="type-caption py-3 pr-4 text-ink">{CONTRAST_ON_MIST[k] ? `${CONTRAST_ON_MIST[k]}:1` : "—"}</td>
                  <td className="type-caption py-3 text-ink">{v.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-8 flex flex-col gap-3">
          {Object.entries(TOKENS.type)
            .filter(([k]) => k !== "code")
            .map(([k, v]) => (
              <li key={k} className="flex flex-wrap items-baseline gap-x-6 border-t border-hairline pt-3">
                <span className="type-code w-40 text-slate-ink">
                  {k} · {v.size}/{v.line}
                </span>
                <span className={`type-${k} text-ink`}>The walk with Priya</span>
              </li>
            ))}
        </ul>
      </Section>

      <Section
        id="agents"
        title="Keeping agents"
        accent="on-brand"
        intro={
          <p>
            Most of this was written with Claude Code. Two files keep its output on-brand: <code className="type-code">CLAUDE.md</code> (tokens only, field order, exhaustive switches, the voice rules, accessibility) and a PostToolUse hook that
            lints every file an agent writes and hands the findings back to it. The same linter runs in CI.
          </p>
        }
      >
        {exp.pending || !exp.arms ? (
          <p className="type-body text-slate-ink">The experiment runs the same SwiftUI prompt with and without CLAUDE.md and lints and compiles each output; see experiments/claude-md in the repo.</p>
        ) : (
          <div>
            <p className="type-body max-w-[66ch] text-ink">
              Same prompt (&ldquo;add a TomorrowCard that fits the existing cards&rdquo;), {exp.arms.with.runs} fresh headless runs per arm, {exp.model}, {exp.date}. Each output is linted and compiled.{" "}
              <a className="text-deep underline underline-offset-2" href={`${REPO}/tree/main/experiments/claude-md`}>
                Raw outputs
              </a>
              .
            </p>
            <table className="mt-4 w-full max-w-[640px] border-collapse text-left">
              <caption className="sr-only">CLAUDE.md experiment results</caption>
              <thead>
                <tr className="type-label text-slate-ink">
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Arm
                  </th>
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Clean
                  </th>
                  <th scope="col" className="py-2 pr-4 font-bold">
                    Builds
                  </th>
                  <th scope="col" className="py-2 font-bold">
                    Median findings
                  </th>
                </tr>
              </thead>
              <tbody>
                {(["without", "with"] as const).map((a) => (
                  <tr key={a} className="type-body border-t border-hairline text-ink">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      {a === "with" ? "With CLAUDE.md" : "Without"}
                    </th>
                    <td className="py-3 pr-4">
                      {exp.arms![a].clean} of {exp.arms![a].runs}
                    </td>
                    <td className="py-3 pr-4">
                      {exp.arms![a].builds} of {exp.arms![a].runs}
                    </td>
                    <td className="py-3">{exp.arms![a].medianFindings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
