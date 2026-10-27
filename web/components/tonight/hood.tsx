"use client";

import { useState } from "react";
import type { Block } from "@/lib/gen/schema";
import { SWIFT_MANIFEST, SWIFT_RENDERS, SWIFT_SOURCES } from "@/lib/gen/swift";
import type { Patch } from "@/lib/stream";
import { FIXTURE, type Experience } from "@/lib/tonight";

const KINDS: { kind: Block["kind"]; label: string; struct: string }[] = [
  { kind: "dayArc", label: "Day", struct: "DayArcCard" },
  { kind: "moment", label: "Moment", struct: "MomentCard" },
  { kind: "pattern", label: "Pattern", struct: "PatternCard" },
  { kind: "people", label: "People", struct: "PeopleCard" },
  { kind: "hunch", label: "Hunch", struct: "HunchCard" },
  { kind: "savor", label: "Savor", struct: "SavorCard" },
];

/** Pull one `struct Name: View { ... }` out of Blocks.swift for display. */
function swiftStruct(name: string): string {
  const src = SWIFT_SOURCES["Views/Blocks.swift"];
  const start = src.indexOf(`struct ${name}: View`);
  if (start < 0) return "";
  const lineStart = src.lastIndexOf("\n", start) + 1;
  const end = src.indexOf("\n}\n", start);
  return src.slice(lineStart, end + 2);
}

function fmt(p: Patch): string {
  const path = p.p.map((k) => (typeof k === "number" ? `[${k}]` : `.${k}`)).join("").replace(/^\./, "");
  if (!("v" in p)) return `${path}  ✓ closed`;
  const v = typeof p.v === "string" ? `"${p.v.length > 38 ? "…" + p.v.slice(-37) : p.v}"` : JSON.stringify(p.v);
  return `${path} = ${v}${p.done ? "  ✓" : ""}`;
}

export function UnderHood({ x, speed, onSpeed }: { x: Experience; speed: number; onSpeed: (s: number) => void }) {
  const [tab, setTab] = useState<"stream" | "swift" | "snapshot">("stream");
  const [kind, setKind] = useState<Block["kind"]>("pattern");
  const total = x.shown + x.queue.length;
  const index = FIXTURE.reflection.blocks.findIndex((b) => b.kind === kind);
  // The render that matches what the web is showing right now. If the catalog has no
  // render for this exact state, say so rather than show a near miss.
  const render =
    kind === "pattern"
      ? x.momentRemoved
        ? x.tone === "gentle" ? "pattern-removed" : null
        : x.correction
          ? x.tone === "gentle" ? "pattern-corrected" : null
          : `pattern-${x.tone}`
      : kind === "dayArc" && x.momentRemoved
        ? "arc-removed"
        : kind === "moment" && x.correction
          ? x.correction === "relieved" ? "moment-corrected" : null
          : `card-${kind}`;
  const hasRender = render !== null && SWIFT_RENDERS.includes(render);
  const fromSim = SWIFT_MANIFEST?.source === "ios-simulator";

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Under the hood views" className="flex gap-1 rounded-full bg-hairline/60 p-1">
        {(
          [
            ["stream", "Stream"],
            ["swift", "SwiftUI"],
            ["snapshot", "Snapshot"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`type-caption min-h-11 flex-1 rounded-full font-semibold text-deep ${tab === id ? "bg-surface shadow-sm" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stream" && (
        <div>
          <p className="type-caption text-slate-ink">
            Patch {x.shown} of {total}. Each one sets a field or closes it. The view shows a field only once it closes, so nothing types itself out.
          </p>
          <ol className="mt-2 h-[260px] overflow-hidden rounded-[var(--radius-control)] bg-deep p-3 type-code text-mist" aria-label="Most recent patches">
            {x.recent.map((p, i) => (
              <li key={`${x.shown}-${i}`} className={`truncate ${i === x.recent.length - 1 ? "opacity-100" : "opacity-70"}`}>
                {fmt(p)}
              </li>
            ))}
          </ol>
          <fieldset className="mt-3 flex items-center gap-2">
            <legend className="sr-only">Stream speed</legend>
            <span className="type-caption text-slate-ink" aria-hidden="true">
              Speed
            </span>
            {[0.25, 1, 3].map((s) => (
              <label key={s} className="relative">
                <input type="radio" name="speed" className="peer sr-only" checked={speed === s} onChange={() => onSpeed(s)} />
                <span className="type-caption flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-hairline px-3 font-semibold text-deep peer-checked:bg-surface peer-focus-visible:outline-2 peer-focus-visible:outline-deep">
                  {s}×
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {tab !== "stream" && (
        <div className="flex flex-wrap gap-1">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              aria-pressed={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={`type-caption min-h-11 rounded-full border border-hairline px-3 font-semibold text-deep ${kind === k.kind ? "bg-surface" : ""}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {tab === "swift" && (
        <div>
          {hasRender ? (
            <figure className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- static render, sized by CSS */}
              <img src={`/swiftui/${render}.png`} alt={`SwiftUI render of the ${kind} card${kind === "pattern" ? `, ${x.correction ? "after the correction" : x.tone + " delivery"}` : ""}.`} className="w-full rounded-[var(--radius-card)]" />
              <figcaption className="type-caption mt-1.5 text-slate-ink">
                {fromSim
                  ? `Rendered by SwiftUI on the iOS Simulator (${SWIFT_MANIFEST?.device ?? "iPhone"}, ${SWIFT_MANIFEST?.os ?? "iOS"}) in CI, commit ${SWIFT_MANIFEST?.sha?.slice(0, 7)}.`
                  : "Rendered on macOS by SwiftUI's ImageRenderer from the NirvaKit package, same fixture as this page."}
                {kind === "pattern" && " Move the dial: this render follows it."}
              </figcaption>
            </figure>
          ) : (
            <p className="type-caption mt-3 text-slate-ink">No SwiftUI render of this exact state in the catalog. The source below is what would draw it.</p>
          )}
          <pre className="mt-3 max-h-[320px] overflow-auto rounded-[var(--radius-control)] bg-deep p-3 type-code text-mist" tabIndex={0} aria-label={`Swift source for ${kind}`}>
            <code>{swiftStruct(KINDS.find((k) => k.kind === kind)!.struct)}</code>
          </pre>
        </div>
      )}

      {tab === "snapshot" && (
        <div>
          <p className="type-caption text-slate-ink">
            The {KINDS.find((k) => k.kind === kind)?.label.toLowerCase()} block as the view sees it right now: a partial object, fields missing until they arrive. SwiftUI decodes the same thing into{" "}
            <code className="type-code">{KINDS.find((k) => k.kind === kind)?.struct.replace("Card", "")}.Partial</code>.
          </p>
          <pre className="mt-2 max-h-[360px] overflow-auto rounded-[var(--radius-control)] bg-deep p-3 type-code text-mist" tabIndex={0} aria-label="Current snapshot">
            <code>{JSON.stringify(x.snap.doc.blocks?.[index] ?? {}, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
