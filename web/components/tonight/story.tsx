"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { COPY } from "@/lib/copy";
import { ReflectionScreen } from "./screen";
import { UnderHood } from "./hood";
import { useExperience } from "./use-experience";

const STEPS = [
  { id: "settle", title: "Tonight settles in", body: "Each card fills in the order the model writes it: what it heard first, the claim after, the one-line summary last." },
  { id: "dial", title: "Try the dial", body: "Straight, Gentle, or Just the pattern. The observation and the count stay put. Only the delivery changes." },
  { id: "correct", title: "Tell it it's wrong", body: "Tap “That's not how I felt” on the 4:40 call. A different feeling changes the read but not the facts. “Forget this” removes it everywhere." },
  { id: "why", title: "See what it kept", body: "“Why am I seeing this?” shows what the card rests on, and what was heard then let go." },
] as const;

const query = "(min-width: 640px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function Story() {
  const framed = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
  // In the frame it plays on load. On a phone it waits until the reflection is on screen.
  const api = useExperience({ autoplay: framed });
  const region = useRef<HTMLDivElement>(null);
  const { start, started } = api;
  useEffect(() => {
    if (framed || started || !region.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { threshold: 0.25 });
    io.observe(region.current);
    return () => io.disconnect();
  }, [framed, started, start]);

  const [done, setDone] = useState<Set<string>>(new Set());
  const [hood, setHood] = useState(false);
  const mark = (id: string) => setDone((d) => new Set(d).add(id));
  const settled = api.x.snap.closed.has("summary");
  const status = (id: string) => (id === "settle" ? settled : done.has(id));

  const steps = (
    <ol className="mt-6 flex flex-col gap-3">
      {STEPS.map((s, i) => (
        <li key={s.id} className={`rounded-[var(--radius-control)] border border-hairline p-3 ${status(s.id) ? "bg-transparent" : "glass"}`}>
          <p className="type-label flex items-center gap-2 text-slate-ink">
            <span aria-hidden="true" className={`inline-flex size-5 items-center justify-center rounded-full border border-deep text-[10px] ${status(s.id) ? "bg-deep text-mist" : ""}`}>
              {status(s.id) ? "✓" : i + 1}
            </span>
            {s.title}
            {status(s.id) && <span className="sr-only">(done)</span>}
          </p>
          <p className="type-caption mt-1 text-ink">{s.body}</p>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="ripple-bg">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-6 pt-8 sm:px-8 lg:grid-cols-[minmax(220px,280px)_390px_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="story-title" className="lg:sticky lg:top-8">
          <h1 id="story-title" className="type-display text-ink">
            An evening reflection that says <span className="text-slate">when it&rsquo;s guessing</span>
          </h1>
          <p className="type-body mt-3 text-slate-ink">
            A concept for Nirva&rsquo;s companion app: honest content, gentle delivery, built as generative UI. Every card also exists in SwiftUI.
          </p>
          <div className="hidden sm:block">{steps}</div>
        </section>

        {/* Frame vs full-bleed is pure CSS, so the first paint is right before hydration. */}
        <div className="-mx-4 sm:mx-auto">
          <div className="sm:relative sm:h-[min(844px,calc(100vh-120px))] sm:min-h-[640px] sm:w-[390px] sm:rounded-[56px] sm:bg-[linear-gradient(145deg,var(--color-surface),var(--color-slate)_45%,var(--color-surface)_70%,var(--color-slate-ink))] sm:p-[9px] sm:shadow-[0_30px_80px_var(--color-hairline)]">
            <div ref={region} className="min-h-[100svh] sm:min-h-0 sm:relative sm:h-full sm:overflow-hidden sm:rounded-[47px] sm:bg-mist" role="region" aria-label="Tonight's reflection">
              <ReflectionScreen api={api} framed={framed} onCoachDone={mark} />
            </div>
          </div>
          <div className="px-4 sm:hidden">{steps}</div>
        </div>

        <aside aria-label="Under the hood" className="lg:sticky lg:top-8">
          <button
            type="button"
            aria-expanded={hood}
            aria-controls="hood"
            onClick={() => setHood((h) => !h)}
            className="glass type-button flex min-h-11 w-full items-center justify-between rounded-full border border-hairline px-5 text-deep hover:bg-glass-strong"
          >
            {hood ? COPY.underHood.close : COPY.underHood.open}
            <span aria-hidden="true">{hood ? "−" : "+"}</span>
          </button>
          {!hood && (
            <p className="type-caption mt-2 px-2 text-slate-ink">
              The raw stream, the partial snapshot each card renders from, and each card&rsquo;s SwiftUI source and render.
            </p>
          )}
          <div id="hood" hidden={!hood} className="mt-3">
            {hood && <UnderHood x={api.x} speed={api.speed} onSpeed={api.setSpeed} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
