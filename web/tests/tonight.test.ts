import { describe, expect, it } from "vitest";
import type { Pattern, Reflection } from "@/lib/gen/schema";
import { FIELD_ORDER } from "@/lib/gen/schema";
import { STREAM } from "@/lib/gen/stream";
import { replayAll, streamValue } from "@/lib/stream";
import {
  correct,
  FIXTURE,
  flush,
  initialExperience,
  PATTERN_INDEX,
  MOMENT_INDEX,
  setTone,
  TONES,
  type Experience,
} from "@/lib/tonight";

const done = (): Experience => flush(initialExperience());
const pattern = (x: Experience) => x.snap.doc.blocks![PATTERN_INDEX] as Pattern;
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

describe("stream", () => {
  it("the web walker produces exactly the shared fixture stream (no drift from scripts/snapshots.mjs)", () => {
    expect(streamValue(FIXTURE.reflection, "Reflection", [])).toEqual(STREAM);
  });

  it("replaying the whole stream rebuilds the reflection", () => {
    expect(replayAll<Reflection>(STREAM).doc).toEqual(FIXTURE.reflection);
  });

  it("fills fields in declared order: basis and confidence close before any headline", () => {
    for (const [i, block] of FIXTURE.reflection.blocks.entries()) {
      const order = STREAM.filter((p) => p.done && p.p[0] === "blocks" && p.p[1] === i && p.p.length === 3).map((p) => p.p[2]);
      const declared = FIELD_ORDER[({ dayArc: "DayArc", moment: "Moment", pattern: "Pattern", people: "People", hunch: "Hunch", savor: "Savor" } as const)[block.kind]];
      expect(order).toEqual(["kind", ...declared.filter((f) => f in block)]);
    }
  });

  it("the summary is generated last", () => {
    const lastField = STREAM.filter((p) => p.done && p.p.length === 1).at(-1);
    expect(lastField?.p).toEqual(["summary"]);
  });
});

describe("delivery dial", () => {
  for (const { id } of TONES) {
    it(`${id}: re-streams only the delivery; substance and every other block stay identical`, () => {
      const before = done();
      const after = flush(setTone(before, id));
      const p = pattern(after);
      expect(p.delivery).toEqual(FIXTURE.alternates.patternDelivery[id]);
      expect({ ...p, delivery: null }).toEqual({ ...pattern(before), delivery: null });
      after.snap.doc.blocks!.forEach((b, i) => i !== PATTERN_INDEX && expect(b).toEqual(before.snap.doc.blocks![i]));
    });
  }

  it("every tone states the same count the evidence shows, before and after a removal", () => {
    const p = FIXTURE.reflection.blocks[PATTERN_INDEX] as Pattern;
    for (const [deliveries, n] of [
      [FIXTURE.alternates.patternDelivery, p.occurrences.length],
      [FIXTURE.alternates.removal.patternDelivery, p.occurrences.length - 1],
    ] as const) {
      for (const d of Object.values(deliveries)) expect(d.body.toLowerCase()).toContain(`${COUNT_WORDS[n]} times in nine days`);
    }
  });

  it("Straight keeps a self-compassion floor; Just the pattern is the shortest", () => {
    expect(FIXTURE.alternates.patternDelivery.straight.body).toMatch(/not a flaw/);
    const len = (t: keyof typeof FIXTURE.alternates.patternDelivery) => FIXTURE.alternates.patternDelivery[t].body.length;
    expect(len("pattern")).toBeLessThan(len("straight"));
    expect(len("straight")).toBeLessThan(len("gentle"));
  });

  it("the evening offers at most one next step, whatever the tone", () => {
    for (const tone of TONES.map((t) => t.id)) {
      const x = flush(setTone(done(), tone));
      const steps = x.snap.doc.blocks!.filter((b) => "step" in b && b.step).length + (pattern(x).delivery.step ? 1 : 0);
      expect(steps).toBeLessThanOrEqual(1);
    }
  });
});

describe("correction", () => {
  for (const id of ["relieved", "tired", "focused"] as const) {
    it(`${id}: reinterprets the moment but keeps the facts (no flattery): pattern still counts four`, () => {
      const x = flush(correct(done(), id));
      const p = pattern(x);
      expect(p.occurrences).toHaveLength(4);
      expect(p.delivery.body).toMatch(/Four times/);
      expect(x.patternNote).toBe(FIXTURE.alternates.feelingPatternNote);
      expect((x.snap.doc.blocks![MOMENT_INDEX] as { body: string }).body).toBe(FIXTURE.alternates.feeling[id].body);
      expect(x.snap.doc.summary).toBe(FIXTURE.alternates.feeling[id].summary);
      expect(x.momentRemoved).toBe(false);
    });
  }

  for (const id of ["wrongMoment", "forget"] as const) {
    it(`${id}: removes 4:40 everywhere it was used: moment, arc, pattern count, people, summary`, () => {
      const x = flush(correct(done(), id));
      expect(x.momentRemoved).toBe(true);
      const p = pattern(x);
      expect(p.occurrences.map((o) => o.day)).toEqual(["Last Thu", "Tue", "Wed"]);
      expect(p.occurrences.length).toBeGreaterThanOrEqual(p.threshold);
      expect(p.delivery.body).toMatch(/Three times/);
      expect(x.snap.doc.summary).toBe(FIXTURE.alternates.removal.summary);
      // Nothing left on screen still leans on the 4:40 call.
      const visible = JSON.stringify({ ...x.snap.doc, blocks: x.snap.doc.blocks!.filter((_, i) => i !== MOMENT_INDEX) });
      expect(visible).not.toMatch(/16:40|both calls|Call with Dev|four minutes/);
      expect(x.snap.closed.has("summary")).toBe(true);
    });
  }

  it("the dial after a removal uses the recounted evidence", () => {
    const x = flush(setTone(flush(correct(done(), "forget")), "pattern"));
    expect(pattern(x).delivery.body).toBe("Last Thu, Tue, Wed. Three times in nine days.");
  });

  it("the moment states its read, so a feeling correction has something to correct", () => {
    expect((FIXTURE.reflection.blocks[MOMENT_INDEX] as { body: string }).body).toMatch(/strain/);
  });

  it("a field being re-streamed is open (hidden) until its last chunk lands", () => {
    const queued = correct(done(), "relieved");
    const x = { ...queued, snap: replayAll([queued.queue[0]], queued.snap) };
    expect(x.snap.closed.has(`blocks.${MOMENT_INDEX}.headline`)).toBe(false);
  });
});

describe("restraint", () => {
  it("at most one block in six is low-confidence, and it is phrased as a question with a reason", () => {
    const blocks = FIXTURE.reflection.blocks;
    const low = blocks.filter((b) => b.kind === "hunch" || ("confidence" in b && (b.confidence as string) === "tentative"));
    expect(low.length).toBeLessThanOrEqual(Math.floor(blocks.length / 6));
    for (const b of low) {
      expect(b.kind).toBe("hunch");
      if (b.kind === "hunch") {
        expect(b.question.trim().endsWith("?")).toBe(true);
        expect(b.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it("people are only shown when opted in, by first name, with a non-voice source", () => {
    const people = FIXTURE.reflection.blocks.find((b) => b.kind === "people");
    expect(people && people.kind === "people" && people.optedIn).toBe(true);
    if (people?.kind !== "people") return;
    for (const p of people.people) {
      expect(p.name).toMatch(/^[A-Z][a-z]+$/);
      expect(["calendar", "location", "youSaid"]).toContain(p.source);
    }
  });

  it("the paused half hour is drawn as a gap: no arc point falls strictly inside it", () => {
    const arc = FIXTURE.reflection.blocks.find((b) => b.kind === "dayArc");
    if (arc?.kind !== "dayArc") throw new Error("no arc");
    for (const gap of arc.paused) {
      expect(arc.points.filter((pt) => pt.at > gap.from && pt.at < gap.to)).toEqual([]);
    }
  });
});
