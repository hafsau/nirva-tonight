import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/copy";
import { FIXTURE } from "@/lib/tonight";
import { lintCopy } from "@/lib/voice";

function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe("voice rules", () => {
  // Rejected drafts are kept on /about on purpose, so they're the one exemption.
  const userFacing = [
    ...strings(FIXTURE.reflection, "reflection"),
    ...strings(FIXTURE.alternates, "alternates"),
    ...strings(COPY, "copy"),
  ];

  it("no user-facing line breaks the voice rules", () => {
    const problems = userFacing.flatMap(([path, text]) => lintCopy(text).map((p) => `${path}: ${p}`));
    expect(problems).toEqual([]);
  });

  it("the linter catches what it should", () => {
    expect(lintCopy("Your stress score was 73%")).not.toEqual([]);
    expect(lintCopy("I was tracking your meeting transcript")).not.toEqual([]);
    expect(lintCopy("You always do this")).not.toEqual([]);
    expect(lintCopy("You seem anxious")).not.toEqual([]);
    expect(lintCopy("You've got this, queen!")).not.toEqual([]);
    expect(lintCopy("Dev is draining you")).not.toEqual([]);
    expect(lintCopy("A steady Friday, one fast call, and a walk worth keeping.")).toEqual([]);
  });

  it("every rejected summary draft fails at least one rule or is the shipped one", () => {
    for (const d of FIXTURE.drafts.summary) {
      if (d.shipped) expect(lintCopy(d.text)).toEqual([]);
      else expect(d.why.length).toBeGreaterThan(20);
    }
  });
});
