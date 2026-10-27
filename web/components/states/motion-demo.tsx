"use client";

import { useState } from "react";

/** The same field arriving with full motion and with Reduce Motion, side by side. */
export function MotionDemo() {
  const [n, setN] = useState(0);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Default", cls: "settle" },
          { label: "Reduce Motion", cls: "fade-only" },
        ].map((v) => (
          <div key={v.label} className="glass rounded-[var(--radius-control)] border border-hairline p-3">
            <p className="type-label text-slate-ink">{v.label}</p>
            <p key={n} className={`${v.cls} type-title mt-2 text-ink`}>
              You reach for sorry first
            </p>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setN((x) => x + 1)} className="glass type-button mt-3 min-h-11 rounded-full border border-hairline px-5 text-deep">
        Play again
      </button>
      <style>{`.fade-only{animation:fade-only var(--motion-reduced) linear both}@keyframes fade-only{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
