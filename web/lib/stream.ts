import schemaJson from "./gen/reflection.schema.json";
import type { Patch } from "./stream-types";

export type { Patch };
type FieldType = string | { enum?: string[]; array?: FieldType; ref?: string; optional?: FieldType };
interface SchemaShape {
  types: Record<string, { fields: [string, FieldType, string?][] }>;
  unions: Record<string, { tag: string; cases: Record<string, string> }>;
}
const schema = schemaJson as unknown as SchemaShape;

/** Word chunks, cumulative. Mirrors scripts/snapshots.mjs; a test keeps them identical. */
export function chunks(text: string): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  for (let i = 0; i < words.length; i += 3) out.push(words.slice(0, i + 3).join(" "));
  return out;
}

/** Serialize a value of a schema type into patches, in declared field order. */
export function streamValue(value: unknown, type: FieldType, path: Patch["p"]): Patch[] {
  const out: Patch[] = [];
  walk(value, type, path, out);
  return out;
}

function walk(value: unknown, type: FieldType, path: Patch["p"], out: Patch[]): void {
  if (type === "string") {
    const parts = chunks(value as string);
    parts.forEach((v, i) => out.push(i === parts.length - 1 ? { p: path, v, done: true } : { p: path, v }));
    return;
  }
  if (typeof type === "string" && schema.types[type]) return walkStruct(value as Record<string, unknown>, type, path, out);
  if (typeof type === "string" && schema.unions[type]) {
    const u = schema.unions[type];
    const tag = (value as Record<string, string>)[u.tag];
    out.push({ p: [...path, u.tag], v: tag, done: true });
    return walkStruct(value as Record<string, unknown>, u.cases[tag], path, out);
  }
  if (typeof type === "string" || type.enum) {
    out.push({ p: path, v: value, done: true });
    return;
  }
  if (type.optional) {
    if (value !== undefined) walk(value, type.optional, path, out);
    return;
  }
  if (type.ref) return walk(value, type.ref, path, out);
  if (type.array) {
    out.push({ p: path, v: [] });
    (value as unknown[]).forEach((item, i) => walk(item, type.array!, [...path, i], out));
    out.push({ p: path, done: true });
    return;
  }
}

function walkStruct(value: Record<string, unknown>, typeName: string, path: Patch["p"], out: Patch[]) {
  for (const [field, type] of schema.types[typeName].fields) {
    if (value[field] === undefined) continue;
    walk(value[field], type, [...path, field], out);
  }
  if (path.length) out.push({ p: path, done: true });
}

export const key = (p: Patch["p"]) => p.join(".");

/** A partial document plus the set of closed paths. Snapshot n = patches 0..n applied in order. */
export interface Snapshot<T> {
  doc: Partial<T>;
  closed: ReadonlySet<string>;
}

export function emptySnapshot<T>(): Snapshot<T> {
  return { doc: {}, closed: new Set() };
}

/** Apply one patch, copying only along its path so React sees fresh references where data changed. */
export function apply<T>(snap: Snapshot<T>, patch: Patch): Snapshot<T> {
  let doc = snap.doc;
  if ("v" in patch) doc = setIn(doc, patch.p, patch.v) as Partial<T>;
  const k = key(patch.p);
  let closed = snap.closed;
  if (patch.done && !closed.has(k)) {
    closed = new Set(closed).add(k);
  } else if (!patch.done && "v" in patch && closed.has(k)) {
    // Re-opening a field to re-stream it: it and everything under it are open again.
    const next = new Set<string>();
    for (const c of closed) if (c !== k && !c.startsWith(k + ".")) next.add(c);
    closed = next;
  }
  return { doc, closed };
}

function setIn(obj: unknown, path: Patch["p"], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const base = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string | number, unknown>;
  base[head] = setIn(base[head] ?? (typeof rest[0] === "number" ? [] : {}), rest, value);
  return base;
}

export function replayAll<T>(patches: Patch[], from: Snapshot<T> = emptySnapshot<T>()): Snapshot<T> {
  return patches.reduce((s, p) => apply(s, p), from);
}

/** Milliseconds to wait before showing each patch. Strings arrive at reading pace; a new block takes a breath. */
export function delayFor(patch: Patch, speed = 1): number {
  const last = patch.p[patch.p.length - 1];
  if (last === "kind") return 260 / speed;
  if (typeof patch.v === "string") return 34 / speed;
  return 8 / speed;
}
