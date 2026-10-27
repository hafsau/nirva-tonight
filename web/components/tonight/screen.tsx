"use client";

import { useEffect, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import type { Basis, Block } from "@/lib/gen/schema";
import { CORRECTIONS, FIXTURE, MOMENT_INDEX, PATTERN_INDEX, type CorrectionKey } from "@/lib/tonight";
import { STREAM } from "@/lib/gen/stream";
import { BlockView } from "./blocks";
import { AccentTail, clock, Field } from "./field";
import { Sheet } from "./sheet";
import type { ExperienceApi } from "./use-experience";

const SIGNAL_LABEL: Record<Basis["signal"], string> = {
  pace: "Pace",
  pitch: "Pitch",
  volume: "Volume",
  tone: "Tone of voice",
  words: "What you said",
  calendar: "Calendar",
  location: "Place",
  checkIn: "Your check-in",
  correction: "Something you told me",
};

/** The phone's content: tonight's reflection as it streams in. */
export function ReflectionScreen({ api, framed, onCoachDone }: { api: ExperienceApi; framed: boolean; onCoachDone?: (step: "dial" | "correct" | "why") => void }) {
  const { x } = api;
  const doc = x.snap.doc;
  const count = FIXTURE.reflection.blocks.length;
  const [why, setWhy] = useState<{ index: number; el: HTMLElement } | null>(null);
  const [notHow, setNotHow] = useState<HTMLElement | null>(null);
  const [notTonight, setNotTonight] = useState(false);
  const [usedDial, setUsedDial] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  // Once she scrolls the phone herself, stop moving it for her.
  const userScrolled = useRef(false);
  const [stopped, setStopped] = useState<string | null>(null);

  // Sticky: re-streams after a correction or the dial never count as the first play again.
  const initialDone = x.shown >= STREAM.length;
  const streamingIndex = (doc.blocks ?? []).findIndex((_, i) => !x.snap.closed.has(`blocks.${i}`));
  const progress = !x.snap.closed.has("summary")
    ? streamingIndex >= 0
      ? COPY.progress[(doc.blocks![streamingIndex] as Block).kind]
      : (doc.blocks?.length ?? 0) === count
        ? COPY.progress.summary
        : COPY.progress.dayArc
    : null;

  // In the frame, keep the newest card in view while the first stream plays.
  const shownBlocks = doc.blocks?.length ?? 0;
  useEffect(() => {
    if (!framed || initialDone || shownBlocks === 0 || userScrolled.current) return;
    const sc = scroller.current;
    const el = sc?.querySelector<HTMLElement>(`section:nth-of-type(${shownBlocks})`);
    if (!sc || !el) return;
    // Keep the newest card in view by scrolling the phone only, never the page.
    const bottom = el.offsetTop + el.offsetHeight - sc.clientHeight + 24;
    if (bottom > sc.scrollTop) sc.scrollTo({ top: bottom, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [framed, initialDone, shownBlocks]);

  // The summary is written last but lives at the top: when it lands, go back up to it.
  const summaryDone = x.snap.closed.has("summary");
  useEffect(() => {
    if (!framed || !summaryDone || x.correction || userScrolled.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => scroller.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }), 400);
    return () => clearTimeout(t);
  }, [framed, summaryDone, x.correction]);

  const coach = !initialDone ? null : !usedDial ? "dial" : !x.correction ? "correct" : null;

  // The current block, so the receipt reflects corrections (e.g. the arc after a removal).
  const whyBlock = why ? ((doc.blocks?.[why.index] as Block | undefined) ?? (FIXTURE.reflection.blocks[why.index] as Block)) : null;
  const whyBasis: Basis[] =
    whyBlock?.kind === "pattern"
      ? (doc.blocks?.[PATTERN_INDEX] as { occurrences?: { day: string; at: string; note: string }[] })?.occurrences?.map((o) => ({
          signal: "words" as const,
          at: o.at,
          note: `${o.day}: ${o.note}`,
        })) ?? []
      : whyBlock && "basis" in whyBlock
        ? whyBlock.basis
        : [];

  // One polite live region for everything worth hearing: acknowledgements, thanks, and the finished reflection.
  const announcement = stopped ?? x.ack ?? (x.hunchReply ? COPY.hunchReplies[x.hunchReply as keyof typeof COPY.hunchReplies] : null) ?? (summaryDone ? COPY.ready : "");

  // Frame vs full-bleed is CSS (sm:), so the first paint is right on any screen; `framed` only drives behavior.
  return (
    <div className="relative flex flex-col sm:h-full sm:overflow-hidden">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div
        ref={scroller}
        data-scroller
        onWheel={() => (userScrolled.current = true)}
        onTouchStart={() => (userScrolled.current = true)}
        className="relative flex-1 px-[var(--space-md)] pb-[var(--space-xxl)] pt-[var(--space-md)] sm:overflow-y-auto sm:pt-[54px]"
      >
        <p className="type-caption rounded-full border border-hairline px-3 py-1 text-center text-slate-ink">{COPY.frameLabel}</p>

        <header className="mt-[var(--space-xl)] px-1">
          <div className="flex items-center justify-between">
            <p className="type-label text-slate-ink">
              {COPY.eyebrow} · {FIXTURE.reflection.day}
            </p>
            {!notTonight && (
              <button
                type="button"
                onClick={() => {
                  setNotTonight(true);
                  setTimeout(() => document.getElementById("not-tonight")?.focus(), 30);
                }}
                className="type-caption -mx-1 min-h-11 px-1 text-slate-ink underline decoration-hairline underline-offset-4">
                {COPY.notTonight}
              </button>
            )}
          </div>
          <h2 id="summary-heading" tabIndex={-1} className="mt-2 min-h-[66px] outline-none" aria-busy={!summaryDone}>
            <Field ready={summaryDone} text={doc.summary} lines={2} as="span" className="type-display block text-ink">
              <AccentTail text={doc.summary ?? ""} />
            </Field>
          </h2>
          <div className="mt-[var(--space-md)] flex flex-wrap items-center gap-2">
            <span className="type-caption text-slate-ink">{COPY.checkInQuestion}</span>
            <span className="glass type-caption rounded-full border border-hairline px-3 py-1 font-semibold text-deep">
              {COPY.checkInAnswered}: {FIXTURE.reflection.checkIn}
            </span>
          </div>
        </header>

        {notTonight ? (
          <div className="settle mt-[var(--space-xxl)] px-1">
            <p id="not-tonight" tabIndex={-1} className="type-aside text-deep outline-none">
              {COPY.notTonightDone}
            </p>
            <button
              type="button"
              onClick={() => {
                setNotTonight(false);
                setTimeout(() => document.getElementById("summary-heading")?.focus(), 30);
              }}
              className="glass type-button mt-[var(--space-md)] min-h-11 rounded-full border border-hairline px-5 text-deep hover:bg-glass-strong"
            >
              {COPY.showNow}
            </button>
          </div>
        ) : (
          <>
            <p className={`type-caption mt-[var(--space-lg)] min-h-[18px] px-1 text-slate-ink ${progress ? "breathe" : ""}`}>
              {progress ?? ""}
            </p>
            <div className="mt-[var(--space-sm)] flex flex-col gap-[var(--space-sm)]">
              {Array.from({ length: shownBlocks }, (_, i) => (
                <BlockView
                  key={FIXTURE.reflection.blocks[i].id}
                  x={x}
                  index={i}
                  h={{
                    coach,
                    onWhy: (index, el) => {
                      onCoachDone?.("why");
                      setWhy({ index, el });
                    },
                    onNotHow: (el) => setNotHow(el),
                    onTone: (t) => {
                      setUsedDial(true);
                      onCoachDone?.("dial");
                      api.setTone(t);
                    },
                    onReply: api.reply,
                    onStop: (name) => {
                      setStopped(COPY.stopped(name));
                      api.stop(name);
                    },
                  }}
                />
              ))}
            </div>
            {x.snap.closed.has("summary") && (
              <div className="settle mt-[var(--space-xl)] flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    userScrolled.current = false;
                    setStopped(null);
                    setUsedDial(false);
                    api.replay();
                    scroller.current?.scrollTo({ top: 0 });
                  }}
                  className="glass type-button min-h-11 rounded-full border border-hairline px-5 text-deep hover:bg-glass-strong">
                  {COPY.replay}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={why !== null} title={COPY.receipt.title} onClose={() => setWhy(null)} returnFocus={why?.el ?? null}>
        <ul className="flex flex-col gap-2">
          {whyBasis.map((b, i) => (
            <li key={i} className="glass rounded-[var(--radius-control)] border border-hairline px-3 py-2">
              <p className="type-label text-slate-ink">
                {SIGNAL_LABEL[b.signal]}
                {b.at ? ` · ${clock(b.at)}` : ""}
              </p>
              <p className="type-callout mt-0.5 text-ink">{b.note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-[var(--space-lg)] grid grid-cols-2 gap-3">
          <div>
            <p className="type-label text-slate-ink">{COPY.receipt.discarded}</p>
            <ul className="type-caption mt-1.5 list-disc pl-4 text-ink">
              {COPY.receipt.discardedItems.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="type-label text-slate-ink">{COPY.receipt.kept}</p>
            <ul className="type-caption mt-1.5 list-disc pl-4 text-ink">
              {COPY.receipt.keptItems.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="type-caption mt-[var(--space-md)] italic text-slate-ink">{COPY.receipt.assumption}</p>
        <button type="button" onClick={() => setWhy(null)} className="glass type-button mt-[var(--space-lg)] min-h-11 w-full rounded-full border border-hairline text-deep">
          {COPY.receipt.close}
        </button>
      </Sheet>

      <Sheet open={notHow !== null} title={COPY.correctionTitle} onClose={() => setNotHow(null)} returnFocus={notHow}>
        <p className="type-caption text-slate-ink">
          At {clock((FIXTURE.reflection.blocks[MOMENT_INDEX] as { at: string }).at)}, {COPY.correctionFeelings}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CORRECTIONS.filter((c) => c.group === "feeling").map((c) => (
            <CorrectionButton key={c.id} id={c.id} label={c.label} onPick={(k) => pick(k)} />
          ))}
        </div>
        <div className="mt-[var(--space-md)] flex flex-col gap-2">
          {CORRECTIONS.filter((c) => c.group === "other").map((c) => (
            <CorrectionButton key={c.id} id={c.id} label={c.label} onPick={(k) => pick(k)} wide />
          ))}
        </div>
        <button type="button" onClick={() => setNotHow(null)} className="type-button mt-[var(--space-md)] min-h-11 w-full text-slate-ink">
          {COPY.correctionCancel}
        </button>
      </Sheet>
    </div>
  );

  function pick(k: CorrectionKey) {
    setNotHow(null);
    onCoachDone?.("correct");
    api.correct(k);
    // The trigger is gone after a correction; land on the card that changed.
    setTimeout(() => {
      const el = document.getElementById("card-moment");
      el?.focus({ preventScroll: true });
      // Scroll the phone, not the page. On a real phone the page is the scroller.
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (el && framed) scroller.current?.scrollTo({ top: el.offsetTop - 16, behavior });
      else el?.scrollIntoView({ block: "start", behavior });
    }, 60);
  }
}

function CorrectionButton({ id, label, onPick, wide }: { id: CorrectionKey; label: string; onPick: (k: CorrectionKey) => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      className={`glass type-button min-h-11 rounded-full border border-hairline px-4 text-deep hover:bg-glass-strong ${wide ? "w-full" : ""}`}
    >
      {label}
    </button>
  );
}
