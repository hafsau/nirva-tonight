import type { DayArc as DayArcT } from "@/lib/gen/schema";
import { COPY } from "@/lib/copy";
import { clock } from "./field";

const W = 320;
const H = 104;
const PAD_X = 10;
const START = 7 * 60;
const END = 22 * 60;
const mins = (at: string) => {
  const [h, m] = at.split(":").map(Number);
  return h * 60 + m;
};
const x = (at: string) => PAD_X + ((mins(at) - START) / (END - START)) * (W - PAD_X * 2);
const y = (level: number) => H / 2 - level * (H / 2 - 14);

/** Smooth path through points (Catmull-Rom to Bezier), so the day reads as a line, not a chart. */
function path(points: { at: string; level: number }[]): string {
  const p = points.map((pt) => [x(pt.at), y(pt.level)]);
  if (p.length < 2) return "";
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const [p1, p2] = [p[i], p[i + 1]];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Pace and pitch against her own usual Friday. No axis numbers: the line is a shape to
 * recognize, not a value to argue with. The paused half hour is a gap, not a guess.
 */
export function DayArc({ arc, description }: { arc: Pick<DayArcT, "points" | "paused" | "removed" | "marks">; description: string }) {
  const gaps = [...arc.paused, ...(arc.removed ?? [])];
  const segments: (typeof arc.points)[] = [];
  let current: typeof arc.points = [];
  for (const pt of arc.points) {
    current.push(pt);
    const gap = gaps.find((g) => g.from === pt.at);
    if (gap) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H + 34}`} className="block w-full" role="img" aria-label={description}>
        <line x1={PAD_X} x2={W - PAD_X} y1={H / 2} y2={H / 2} stroke="var(--color-hairline)" strokeDasharray="2 5" />
        <text x={W - PAD_X} y={H / 2 - 6} textAnchor="end" className="type-caption" fill="var(--color-slate-ink)" style={{ fontSize: 10 }}>
          your usual
        </text>
        {arc.paused.map((g) => (
          <rect key={g.from} x={x(g.from)} y={10} width={x(g.to) - x(g.from)} height={H - 20} rx={6} fill="var(--color-hairline)" opacity={0.5} />
        ))}
        {(arc.removed ?? []).map((g) => (
          <rect key={g.from} x={x(g.from)} y={10} width={x(g.to) - x(g.from)} height={H - 20} rx={6} fill="none" stroke="var(--color-pause)" strokeDasharray="3 4" />
        ))}
        {segments.map((s, i) => (
          <path key={i} d={path(s)} fill="none" stroke="var(--color-deep)" strokeWidth={2} strokeLinecap="round" />
        ))}
        {arc.marks.map((m) => {
          const pt = arc.points.find((p) => p.at === m.at);
          return pt ? <circle key={m.at} cx={x(m.at)} cy={y(pt.level)} r={4} fill="var(--color-surface)" stroke="var(--color-deep)" strokeWidth={1.5} /> : null;
        })}
        {["07:00", "12:00", "17:00", "22:00"].map((t) => (
          <text key={t} x={x(t)} y={H + 26} textAnchor={t === "07:00" ? "start" : t === "22:00" ? "end" : "middle"} fill="var(--color-slate-ink)" style={{ fontSize: 10, fontFamily: "var(--font-sans)" }}>
            {clock(t).replace(":00", "")}
          </text>
        ))}
      </svg>
      <figcaption className="sr-only">
        {arc.marks.map((m) => `${clock(m.at)}: ${m.label}. `).join("")}
        {arc.paused.map((g) => `${COPY.arcPaused} ${clock(g.from)} to ${clock(g.to)}.`).join(" ")}
        {(arc.removed ?? []).map((g) => ` ${COPY.arcRemoved} ${clock(g.from)} to ${clock(g.to)}.`).join("")}
      </figcaption>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-caption text-slate-ink" aria-hidden="true">
        {arc.marks.map((m) => (
          <li key={m.at} className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full border-[1.5px] border-deep bg-surface" />
            {clock(m.at)} {m.label}
          </li>
        ))}
        {arc.paused.map((g) => (
          <li key={g.from} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm bg-hairline" />
            {COPY.arcPaused}
          </li>
        ))}
        {(arc.removed ?? []).map((g) => (
          <li key={g.from} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-sm border border-dashed border-deep/40" />
            {COPY.arcRemoved}
          </li>
        ))}
      </ul>
    </figure>
  );
}
