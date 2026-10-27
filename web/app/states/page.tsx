import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MotionDemo } from "@/components/states/motion-demo";
import { COPY } from "@/lib/copy";
import { FIXTURE } from "@/lib/tonight";
import type { Hunch } from "@/lib/gen/schema";

export const metadata: Metadata = { title: "States" };

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[390px] rounded-[36px] border border-hairline bg-mist p-4 shadow-[0_20px_60px_var(--color-hairline)]">
      <p className="type-caption mb-4 rounded-full border border-hairline px-3 py-1 text-center text-slate-ink">{COPY.frameLabel}</p>
      {children}
    </div>
  );
}

function State({ id, title, rules, children }: { id: string; title: string; rules: string[]; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid items-start gap-6 border-t border-hairline py-10 md:grid-cols-[390px_1fr]">
      <Phone>{children}</Phone>
      <div className="max-w-[56ch]">
        <h2 id={id} className="type-title text-ink">
          {title}
        </h2>
        <ul className="type-body mt-3 flex list-disc flex-col gap-2 pl-5 text-ink">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const hunch = FIXTURE.reflection.blocks.find((b) => b.kind === "hunch") as Hunch;

export default function StatesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-8">
      <h1 className="type-display text-ink">
        States <span className="text-slate">off the main path</span>
      </h1>
      <p className="type-body mt-3 max-w-[62ch] text-slate-ink">
        The story on the first page is a good night with a week of context. These are the nights it has to handle too. Each one is a fixed design decision, not something the model improvises.
      </p>

      <State
        id="low-context"
        title="Day two: not enough context yet"
        rules={[
          "No pattern card until a pattern clears its threshold (3 times in the window). Two days can't.",
          "Say what happened, and say plainly that what's usual for her isn't known yet.",
          "No placeholder insights to fill the space. A short reflection is an honest one.",
        ]}
      >
        <p className="type-label text-slate-ink">Tonight · Tuesday</p>
        <p className="type-display mt-2 text-ink">
          A long Tuesday, <span className="text-slate">mostly outside.</span>
        </p>
        <div className="glass mt-4 rounded-[var(--radius-card)] border border-hairline p-5">
          <p className="type-label text-slate-ink">Getting to know you</p>
          <p className="type-title mt-2 text-ink">{COPY.lowContext.title}</p>
          <p className="type-body mt-2 text-ink">{COPY.lowContext.body}</p>
        </div>
      </State>

      <State
        id="low-confidence"
        title="Low confidence changes the grammar"
        rules={[
          "A hunch is asked, never stated. The question carries its reason.",
          "No percentages, no yellow or red badges. Lower contrast and an italic serif aside do the work.",
          "At most one in six cards. If every card hedges, none of them can be trusted. A unit test enforces the ratio.",
          "Her answer changes how tomorrow is read. It is never scored.",
        ]}
      >
        <div className="rounded-[var(--radius-card)] border border-hairline p-5">
          <p className="type-label text-slate-ink">{COPY.hunchLabel}</p>
          <p className="type-aside mt-2 text-deep">{hunch.question}</p>
          <p className="type-caption mt-1 text-slate-ink">{hunch.reason}</p>
          <div className="mt-3 flex gap-2">
            {hunch.replies.map((r) => (
              <span key={r} className="type-button inline-flex min-h-11 items-center rounded-full border border-hairline px-4 text-deep">
                {r}
              </span>
            ))}
          </div>
        </div>
      </State>

      <State
        id="unavailable"
        title="The model is slow or offline"
        rules={[
          "Say it calmly, in one line, and say what's safe: today's notes stay on the phone.",
          "No spinner that never ends, no retry button to babysit. It shows up next time she opens the app.",
          "Never fill the gap with a generic reflection.",
        ]}
      >
        <div className="glass rounded-[var(--radius-card)] border border-hairline p-5">
          <p className="type-title text-ink">{COPY.unavailable.title}</p>
          <p className="type-body mt-2 text-ink">{COPY.unavailable.body}</p>
        </div>
      </State>

      <State
        id="reduce-motion"
        title="Reduce Motion"
        rules={[
          "Fields cross-fade in 200ms. No blur, no rise, no spring.",
          "The stream still plays, because order carries meaning (evidence before claim). Auto-scroll jumps instead of gliding.",
          "Coach-mark pulses stop. In SwiftUI, the same switch reads accessibilityReduceMotion.",
        ]}
      >
        <MotionDemo />
      </State>

      <State
        id="safety"
        title="When she says something that needs a person"
        rules={[
          "Locked component: fixed copy. The model can route to it but never writes it.",
          "Reached only from explicit words: typed to Nirva, or spoken to it directly. Never from tone of voice, which is too weak a signal to act on.",
          "988 (call or text) and 911, an easy “I'm okay” exit, no coaching, and nothing logged as a mood.",
          "Wording follows safe-messaging guidance. This concept has not been reviewed by a clinician; the real one should be.",
        ]}
      >
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5">
          <p className="type-title text-ink">{COPY.safety.title}</p>
          <p className="type-body mt-2 text-ink">{COPY.safety.body}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="tel:988" className="type-button flex min-h-11 items-center justify-center rounded-full bg-deep text-mist no-underline">
              {COPY.safety.call}
            </a>
            <a href="sms:988" className="type-button flex min-h-11 items-center justify-center rounded-full bg-deep text-mist no-underline">
              {COPY.safety.text}
            </a>
          </div>
          <p className="type-caption mt-1.5 text-center text-slate-ink">{COPY.safety.callNote}</p>
          <p className="type-callout mt-3 text-center text-ink">{COPY.safety.emergency}</p>
          <span className="type-button mt-3 flex min-h-11 items-center justify-center rounded-full border border-hairline text-deep">{COPY.safety.okay}</span>
        </div>
      </State>
    </div>
  );
}
