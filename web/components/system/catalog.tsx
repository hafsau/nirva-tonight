"use client";

import { BlockView } from "@/components/tonight/blocks";
import { SWIFT_MANIFEST, SWIFT_RENDERS } from "@/lib/gen/swift";
import { FIXTURE, flush, initialExperience } from "@/lib/tonight";

const DONE = flush(initialExperience());
const noop = () => {};
const LABEL: Record<string, string> = { dayArc: "Day arc", moment: "Moment", pattern: "Pattern", people: "Who you were with", hunch: "Hunch (low confidence)", savor: "Worth keeping" };

/** Each block twice: the live web component, and SwiftUI's own render of the same fixture. */
export function Catalog() {
  const sim = SWIFT_MANIFEST?.source === "ios-simulator";
  return (
    <div className="flex flex-col gap-10">
      {FIXTURE.reflection.blocks.map((b, i) => (
        <figure key={b.id} className="m-0">
          <figcaption className="type-label text-slate-ink">{LABEL[b.kind]}</figcaption>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="type-caption mb-2 text-slate-ink">Web (React, live)</p>
              <div className="max-w-[390px]" inert>
                <BlockView x={DONE} index={i} h={{ coach: null, onWhy: noop, onNotHow: noop, onTone: noop, onReply: noop, onStop: noop }} />
              </div>
            </div>
            <div>
              <p className="type-caption mb-2 text-slate-ink">SwiftUI ({sim ? `iOS Simulator, ${SWIFT_MANIFEST?.device ?? "iPhone"}` : "ImageRenderer on macOS"})</p>
              {SWIFT_RENDERS.includes(`card-${b.kind}`) ? (
                // eslint-disable-next-line @next/next/no-img-element -- static render at a fixed width
                <img src={`/swiftui/card-${b.kind}.png`} alt={`SwiftUI render of the ${LABEL[b.kind].toLowerCase()} card`} className="w-full max-w-[390px]" loading="lazy" />
              ) : (
                <p className="type-caption text-slate-ink">Render pending.</p>
              )}
            </div>
          </div>
        </figure>
      ))}
    </div>
  );
}
