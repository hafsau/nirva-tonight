import rules from "./voice-rules.json";

const COMPILED = rules.rules.map((r) => ({ id: r.id, re: new RegExp(`\\b(?:${r.patterns.join("|")})\\b`, "i") }));

/** Rule ids (with the offending match) that this text breaks. Empty means it's in voice. */
export function lintCopy(text: string): string[] {
  return COMPILED.flatMap(({ id, re }) => {
    const m = text.match(re);
    return m ? [`${id} ("${m[0]}")`] : [];
  });
}

export const VOICE_RULES = rules.rules;
