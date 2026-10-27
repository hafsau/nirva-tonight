import data from "./gen/tonight.json";
import type { Block, DayArc, Delivery, Moment, Occurrence, Pattern, People, Reflection } from "./gen/schema";
import { STREAM } from "./gen/stream";
import { apply, emptySnapshot, streamValue, type Patch, type Snapshot } from "./stream";

export type Tone = Delivery["tone"];
export type FeelingKey = "relieved" | "tired" | "focused";
export type CorrectionKey = FeelingKey | "wrongMoment" | "forget";
export const isRemoval = (k: CorrectionKey): k is "wrongMoment" | "forget" => k === "wrongMoment" || k === "forget";

interface FeelingAlternate {
  ack: string;
  headline: string;
  body: string;
  summary: string;
}
export interface Fixture {
  persona: { name: string; about: string; tonight: string };
  week: { day: string; note: string; patternHit?: boolean; correction?: string }[];
  reflection: Reflection;
  alternates: {
    patternDelivery: Record<Tone, Delivery>;
    /** She disputes the feeling. The facts (what she said) stand, so the pattern keeps its count. */
    feeling: Record<FeelingKey, FeelingAlternate>;
    feelingPatternNote: string;
    /** She removes the moment. Everything that leaned on it is rebuilt without it. */
    removal: {
      wrongMoment: { ack: string };
      forget: { ack: string };
      patternNote: string;
      patternDelivery: Record<Tone, Delivery>;
      summary: string;
      arc: DayArc;
      people: People;
    };
  };
  drafts: { summary: { text: string; why: string; shipped?: boolean }[] };
}

export const FIXTURE = data as unknown as Fixture;
export const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "straight", label: "Straight", hint: "Say it plainly" },
  { id: "gentle", label: "Gentle", hint: "Say it with care" },
  { id: "pattern", label: "Just the pattern", hint: "Only what happened" },
];
export const CORRECTIONS: { id: CorrectionKey; label: string; group: "feeling" | "other" }[] = [
  { id: "relieved", label: "Relieved", group: "feeling" },
  { id: "tired", label: "Tired", group: "feeling" },
  { id: "focused", label: "Focused", group: "feeling" },
  { id: "wrongMoment", label: "That wasn't the moment", group: "other" },
  { id: "forget", label: "Forget this", group: "other" },
];

const blocks = FIXTURE.reflection.blocks;
export const MOMENT_INDEX = blocks.findIndex((b) => b.kind === "moment");
export const PATTERN_INDEX = blocks.findIndex((b) => b.kind === "pattern");
export const ARC_INDEX = blocks.findIndex((b) => b.kind === "dayArc");
export const PEOPLE_INDEX = blocks.findIndex((b) => b.kind === "people");
const moment = blocks[MOMENT_INDEX] as Moment;

export interface Experience {
  snap: Snapshot<Reflection>;
  /** Patches waiting to be shown, in order. The view drains this on a timer. */
  queue: Patch[];
  tone: Tone;
  correction: CorrectionKey | null;
  ack: string | null;
  patternNote: string | null;
  momentRemoved: boolean;
  hunchReply: string | null;
  hiddenPeople: string[];
  /** Patches shown so far, and the most recent few, for the Under the hood view. */
  shown: number;
  recent: Patch[];
}

export function initialExperience(): Experience {
  return {
    snap: emptySnapshot<Reflection>(),
    queue: [...STREAM],
    tone: "gentle",
    correction: null,
    ack: null,
    patternNote: null,
    momentRemoved: false,
    hunchReply: null,
    hiddenPeople: [],
    shown: 0,
    recent: [],
  };
}

/** Show the next queued patch. */
export function tick(x: Experience): Experience {
  const [next, ...rest] = x.queue;
  return next ? { ...x, snap: apply(x.snap, next), queue: rest, shown: x.shown + 1, recent: [...x.recent.slice(-11), next] } : x;
}

/** Show everything queued (tests, Reduce Motion skip, "show all"). */
export function flush(x: Experience): Experience {
  return { ...x, snap: x.queue.reduce(apply, x.snap), queue: [], shown: x.shown + x.queue.length, recent: [...x.recent, ...x.queue].slice(-12) };
}

export const isStreaming = (x: Experience) => x.queue.length > 0;

function deliveryFor(tone: Tone, removed: boolean): Delivery {
  return removed ? FIXTURE.alternates.removal.patternDelivery[tone] : FIXTURE.alternates.patternDelivery[tone];
}

/** Re-stream a field: reopen it, then send its new value in chunks. */
function restream(value: unknown, type: Parameters<typeof streamValue>[1], path: Patch["p"]): Patch[] {
  const reset: Patch = { p: path, v: type === "string" ? "" : Array.isArray(value) ? [] : {} };
  const body = streamValue(value, type, path);
  // Arrays already open with an empty value; skip the duplicate.
  return Array.isArray(value) ? body : [reset, ...body];
}

/** The dial. Substance stays put; only the delivery re-streams. */
export function setTone(x: Experience, tone: Tone): Experience {
  if (tone === x.tone) return x;
  const patches = restream(deliveryFor(tone, x.momentRemoved), "Delivery", ["blocks", PATTERN_INDEX, "delivery"]);
  return { ...x, tone, queue: [...x.queue, ...patches] };
}

/**
 * "That's not how I felt." A different feeling reinterprets the moment but keeps
 * the facts: she still said sorry first, so the pattern keeps its count (agreeing
 * would be flattery). Removing the moment rebuilds everything that leaned on it.
 */
export function correct(x: Experience, k: CorrectionKey): Experience {
  if (x.correction) return x;
  const alt = FIXTURE.alternates;
  const patches: Patch[] = [];
  if (!isRemoval(k)) {
    const f = alt.feeling[k];
    patches.push(...restream(f.headline, "string", ["blocks", MOMENT_INDEX, "headline"]));
    patches.push(...restream(f.body, "string", ["blocks", MOMENT_INDEX, "body"]));
    patches.push(...restream(f.summary, "string", ["summary"]));
    return { ...x, correction: k, ack: f.ack, patternNote: alt.feelingPatternNote, queue: [...x.queue, ...patches] };
  }
  const r = alt.removal;
  const pattern = blocks[PATTERN_INDEX] as Pattern;
  const kept: Occurrence[] = pattern.occurrences.filter((o) => !(o.day === "Fri" && o.at === moment.at));
  patches.push(...restream(r.arc, "Block", ["blocks", ARC_INDEX]));
  patches.push(...restream(kept, { array: "Occurrence" }, ["blocks", PATTERN_INDEX, "occurrences"]));
  patches.push(...restream(r.patternDelivery[x.tone], "Delivery", ["blocks", PATTERN_INDEX, "delivery"]));
  patches.push(...restream(r.people, "Block", ["blocks", PEOPLE_INDEX]));
  patches.push(...restream(r.summary, "string", ["summary"]));
  return { ...x, correction: k, ack: r[k].ack, momentRemoved: true, patternNote: r.patternNote, queue: [...x.queue, ...patches] };
}

export const replyToHunch = (x: Experience, reply: string): Experience => ({ ...x, hunchReply: reply });
export const stopIncluding = (x: Experience, name: string): Experience =>
  x.hiddenPeople.includes(name) ? x : { ...x, hiddenPeople: [...x.hiddenPeople, name] };

export const isClosed = (x: Experience, ...p: Patch["p"]) => x.snap.closed.has(p.join("."));

/** Block kinds whose header can show as soon as the kind arrives. */
export function blockAt(x: Experience, i: number): Partial<Block> | undefined {
  return x.snap.doc.blocks?.[i] as Partial<Block> | undefined;
}
