"use client";

import type { ReactNode } from "react";
import { COPY } from "@/lib/copy";
import type { Block, DayArc as DayArcT, Hunch, Moment, Pattern, People, Savor } from "@/lib/gen/schema";
import { STREAM } from "@/lib/gen/stream";
import { TONES, type Experience, type Tone } from "@/lib/tonight";
import { DayArc } from "./day-arc";
import { clock, Field, Label } from "./field";

export interface BlockHandlers {
  onWhy: (index: number, trigger: HTMLElement) => void;
  onNotHow: (trigger: HTMLElement) => void;
  onTone: (t: Tone) => void;
  onReply: (r: string) => void;
  onStop: (name: string) => void;
  coach: "dial" | "correct" | null;
}

type Partial2<T> = { [K in keyof T]?: T[K] };

export function Card({ id, children, tone = "glass", label }: { id: string; children: ReactNode; tone?: "glass" | "quiet"; label?: string }) {
  return (
    <section
      id={`card-${id}`}
      tabIndex={-1}
      aria-labelledby={label ? undefined : `card-${id}-title`}
      aria-label={label}
      className={`settle scroll-mt-4 outline-none rounded-[var(--radius-card)] border border-hairline p-[var(--space-lg)] ${tone === "glass" ? "glass" : "bg-transparent"}`}
    >
      {children}
    </section>
  );
}

function WhyLink({ onClick }: { onClick: (el: HTMLElement) => void }) {
  return (
    <button type="button" onClick={(e) => onClick(e.currentTarget)} className="type-caption -mx-1 min-h-11 px-1 text-slate-ink underline decoration-hairline underline-offset-4 hover:text-deep">
      {COPY.why}
    </button>
  );
}

export function BlockView({ x, index, h }: { x: Experience; index: number; h: BlockHandlers }) {
  const b = x.snap.doc.blocks?.[index] as Partial2<Block> | undefined;
  if (!b?.kind) return null;
  const at = (...f: (string | number)[]) => x.snap.closed.has(["blocks", index, ...f].join("."));
  switch (b.kind) {
    case "dayArc":
      return <ArcCard b={b as Partial2<DayArcT>} at={at} />;
    case "moment":
      return <MomentCard b={b as Partial2<Moment>} at={at} x={x} index={index} h={h} />;
    case "pattern":
      return <PatternCard b={b as Partial2<Pattern>} at={at} x={x} index={index} h={h} />;
    case "people":
      return <PeopleCard b={b as Partial2<People>} at={at} x={x} h={h} />;
    case "hunch":
      return <HunchCard b={b as Partial2<Hunch>} at={at} x={x} index={index} h={h} />;
    case "savor":
      return <SavorCard b={b as Partial2<Savor>} at={at} />;
  }
}

type At = (...f: (string | number)[]) => boolean;

function ArcCard({ b, at }: { b: Partial2<DayArcT>; at: At }) {
  const ready = at("points") && at("paused") && at("removed") && at("marks");
  return (
    <Card id="arc">
      <Label>
        <span id="card-arc-title">Your day</span>
      </Label>
      <div className="mt-3 min-h-[150px]">
        {ready ? (
          <div className="settle">
            <DayArc arc={b as DayArcT} description="A line of your pace and pitch through the day, against your usual Friday." />
          </div>
        ) : (
          <div aria-hidden="true" className="h-[150px] rounded-[var(--radius-control)] bg-hairline/40" />
        )}
      </div>
      <Field ready={at("caption")} text={b.caption} lines={2} className="type-aside mt-3 text-deep" />
    </Card>
  );
}

function MomentCard({ b, at, x, index, h }: { b: Partial2<Moment>; at: At; x: Experience; index: number; h: BlockHandlers }) {
  if (x.momentRemoved) {
    return (
      <section id="card-moment" tabIndex={-1} className="settle outline-none rounded-[var(--radius-card)] border border-dashed border-hairline p-[var(--space-lg)]" aria-label="Moment removed">
        <p className="type-aside text-deep">{x.ack}</p>
      </section>
    );
  }
  return (
    <Card id="moment" label={b.at ? `${clock(b.at)} moment` : "Moment"}>
      <Field ready={at("at")} text={b.at && clock(b.at)} as="div" className="type-label text-slate-ink" />
      <Field ready={at("headline")} text={b.headline} as="h3" className="type-title mt-2 text-ink">
        {b.headline}
      </Field>
      <Field ready={at("body")} text={b.body} lines={3} className="type-body mt-2 text-ink" />
      {x.ack && (
        <p key={x.ack} className="settle type-aside mt-3 text-deep">
          {x.ack}
        </p>
      )}
      {at("body") && (
        <div className="settle mt-3 flex flex-wrap items-center justify-between gap-2">
          <WhyLink onClick={(el) => h.onWhy(index, el)} />
          {!x.correction && (
            <button
              type="button"
              onClick={(e) => h.onNotHow(e.currentTarget)}
              className={`glass type-button min-h-11 rounded-full border border-hairline px-4 text-deep hover:bg-glass-strong ${h.coach === "correct" ? "coach" : ""}`}
            >
              {COPY.notHow}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function PatternCard({ b, at, x, index, h }: { b: Partial2<Pattern>; at: At; x: Experience; index: number; h: BlockHandlers }) {
  const occ = b.occurrences ?? [];
  const occReady = at("occurrences");
  const window = b.windowDays ?? 9;
  // Once the dial has appeared it stays put while a delivery re-streams, so focus and arrow keys keep working.
  const dialReady = at("delivery") || x.shown >= STREAM.length;
  return (
    <Card id="pattern">
      <Label>
        <span id="card-pattern-title">Pattern</span>
        {occReady && <span className="settle inline-block normal-case tracking-normal">&nbsp;· {COPY.occurrences(occ.length, window)}</span>}
      </Label>
      {x.patternNote && occReady && (
        <p key={occ.length} className="settle type-caption mt-1 text-slate-ink">
          {x.patternNote}
        </p>
      )}
      <div className="mt-3 flex gap-1.5" role="img" aria-label={occReady ? `Days it happened: ${occ.map((o) => (o.day === "Fri" ? "today" : o.day)).join(", ")}` : "Counting days"}>
        {Array.from({ length: window }, (_, i) => {
          const hit = occReady && occ.some((o) => dayIndex(o.day) === i);
          return <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${hit ? "bg-deep" : "bg-hairline"}`} />;
        })}
      </div>
      <div aria-busy={!at("delivery")}>
        <Field ready={at("delivery", "headline")} text={b.delivery?.headline} as="h3" className="type-title mt-4 text-ink" />
        <Field ready={at("delivery", "body")} text={b.delivery?.body} lines={3} className="type-body mt-2 text-ink" />
        {b.delivery?.step && <Field ready={at("delivery", "step")} text={b.delivery.step} className="type-callout mt-3 border-l-2 border-hairline pl-3 text-slate-ink" />}
      </div>
      {dialReady && (
        <fieldset className={`settle mt-4 rounded-[var(--radius-control)] ${h.coach === "dial" ? "coach" : ""}`}>
          <legend className="type-caption text-slate-ink">{COPY.dial.label}</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-full bg-hairline/60 p-1">
            {TONES.map((t) => (
              <label key={t.id} className="relative">
                <input type="radio" name="tone" value={t.id} checked={x.tone === t.id} onChange={() => h.onTone(t.id)} className="peer sr-only" />
                <span className="type-caption flex min-h-11 cursor-pointer items-center justify-center rounded-full px-1 text-center font-semibold text-deep transition-colors peer-checked:bg-surface peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-deep">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          <p className="type-caption mt-1.5 text-slate-ink">{COPY.dial.hint}</p>
        </fieldset>
      )}
      {dialReady && (
        <div className="mt-1">
          <WhyLink onClick={(el) => h.onWhy(index, el)} />
        </div>
      )}
    </Card>
  );
}

const DAYS = ["Last Thu", "Last Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const dayIndex = (d: string) => DAYS.indexOf(d);

function PeopleCard({ b, at, x, h }: { b: Partial2<People>; at: At; x: Experience; h: BlockHandlers }) {
  // Never shown unless she opted in.
  if (at("optedIn") && b.optedIn === false) return null;
  const people = b.people ?? [];
  return (
    <Card id="people">
      <h3 id="card-people-title" className="type-title text-ink">
        {COPY.peopleTitle}
      </h3>
      <ul className="mt-3 divide-y divide-hairline">
        {people.map((p, i) =>
          x.hiddenPeople.includes(p.name) ? (
            <li key={p.name} className="settle type-caption py-3 text-slate-ink">
              {COPY.stopped(p.name)}
            </li>
          ) : (
            <li key={p.name} className="py-3">
              {at("people", i) ? (
                <div className="settle">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="type-body font-semibold text-ink">{p.name}</p>
                    <p className="type-caption text-slate-ink">{COPY.peopleSource[p.source]}</p>
                  </div>
                  <p className="type-callout mt-1 text-ink">{p.observation}</p>
                  {p.updatedFrom && <p className="type-caption mt-1 text-slate-ink">{p.updatedFrom}</p>}
                  <button
                    type="button"
                    onClick={() => h.onStop(p.name)}
                    className="type-caption -mx-1 mt-1 min-h-11 px-1 text-slate-ink underline decoration-hairline underline-offset-4 hover:text-deep"
                  >
                    {COPY.stopIncluding} {p.name}
                  </button>
                </div>
              ) : (
                <Field ready={false} lines={2} />
              )}
            </li>
          ),
        )}
      </ul>
      <Field ready={at("note")} text={b.note} lines={2} className="type-caption mt-2 text-slate-ink" />
    </Card>
  );
}

function HunchCard({ b, at, x, index, h }: { b: Partial2<Hunch>; at: At; x: Experience; index: number; h: BlockHandlers }) {
  return (
    <Card id="hunch" tone="quiet">
      <Label>
        <span id="card-hunch-title">{COPY.hunchLabel}</span>
      </Label>
      <Field ready={at("question")} text={b.question} as="p" className="type-aside mt-2 text-deep" />
      <Field ready={at("reason")} text={b.reason} className="type-caption mt-1 text-slate-ink" />
      {at("replies") &&
        (x.hunchReply ? (
          <p className="settle type-caption mt-3 text-slate-ink">
            {COPY.hunchReplies[x.hunchReply as keyof typeof COPY.hunchReplies]}
          </p>
        ) : (
          <div className="settle mt-3 flex flex-wrap items-center gap-2">
            {(b.replies ?? []).map((r) => (
              <button key={r} type="button" onClick={() => h.onReply(r)} className="type-button min-h-11 rounded-full border border-hairline px-4 text-deep hover:bg-glass">
                {r}
              </button>
            ))}
            <span className="ml-auto">
              <WhyLink onClick={(el) => h.onWhy(index, el)} />
            </span>
          </div>
        ))}
    </Card>
  );
}

function SavorCard({ b, at }: { b: Partial2<Savor>; at: At }) {
  return (
    <Card id="savor">
      <Label>{COPY.savorLabel}</Label>
      <Field ready={at("headline")} text={b.headline} as="h3" className="type-title mt-2 text-ink">
        <span id="card-savor-title">{b.headline}</span>
      </Field>
      <Field ready={at("body")} text={b.body} lines={2} className="type-body mt-2 text-ink" />
      {b.step && <Field ready={at("step")} text={b.step} className="type-callout mt-3 border-l-2 border-hairline pl-3 text-slate-ink" />}
    </Card>
  );
}
