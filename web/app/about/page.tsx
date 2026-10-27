import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FIXTURE } from "@/lib/tonight";
import { SWIFT_MANIFEST } from "@/lib/gen/swift";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

function Part({ id, title, accent, children }: { id: string; title: string; accent?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-hairline py-10">
      <h2 id={id} className="type-display text-ink">
        {title} {accent && <span className="text-slate">{accent}</span>}
      </h2>
      <div className="prose-concept type-body mt-4 max-w-[66ch] text-ink">{children}</div>
    </section>
  );
}

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="text-deep underline underline-offset-2">
    {children}
  </a>
);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-8">
      <h1 className="type-display max-w-[24ch] text-ink">
        Honest content, <span className="text-slate">gentle delivery</span>
      </h1>
      <p className="type-body mt-4 max-w-[66ch] text-ink">
        Nirva&rsquo;s CEO has said honesty is a core principle, and that what needs designing is the delivery: some people want feedback direct, some need to feel understood first (<A href="https://hub.baai.ac.cn/view/57779">Founder Park interview</A>). This concept takes that literally, on the surface where it matters most: the evening reflection. It&rsquo;s an unofficial concept by <A href={SITE.authorUrl}>{SITE.author}</A>, made from public information, for the Founding Product Designer role.
      </p>

      <Part id="summary" title="The line that has to" accent="sound human">
        <p>
          The summary at the top is the first thing she reads and the easiest thing to get wrong. It&rsquo;s generated last, after every card exists, and it has to pass the same voice rules as everything else. These are the drafts that didn&rsquo;t ship:
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {FIXTURE.drafts.summary.map((d) => (
            <li key={d.text} className={`rounded-[var(--radius-control)] border border-hairline p-4 ${d.shipped ? "glass" : ""}`}>
              <p className={`type-title ${d.shipped ? "text-ink" : "text-slate-ink line-through decoration-hairline"}`}>{d.text}</p>
              <p className="type-caption mt-1 text-ink">
                <span className="type-label text-slate-ink">{d.shipped ? "Shipped" : "Cut"} · </span>
                {d.why}
              </p>
            </li>
          ))}
        </ul>
      </Part>

      <Part id="decisions" title="Five decisions" accent="worth arguing about">
        <ol className="flex list-decimal flex-col gap-3 pl-5">
          <li>
            <strong className="font-semibold">The dial changes delivery, never substance.</strong> Straight, Gentle and Just the pattern all state the same count from the same evidence, and even Straight keeps a floor of kindness (&ldquo;a habit, not a flaw&rdquo;). A
            test fails if a tone changes the claim. Nirva&rsquo;s CEO has said the app asks for a feedback preference at onboarding and adapts over time; a dial on the card lets her change her mind on a hard night.
          </li>
          <li>
            <strong className="font-semibold">Being corrected should visibly matter, without becoming flattery.</strong> Choosing a different feeling rewrites the read of the moment and the summary, but the pattern keeps its count and says so: she still said sorry first. &ldquo;Forget this&rdquo; is different. The moment is deleted and everything that leaned on it is rebuilt without it: the arc, the count, the people card, the summary. A correction that changes nothing teaches people not to bother; one that rewrites the facts teaches them nothing is true.
          </li>
          <li>
            <strong className="font-semibold">Uncertainty is rare and grammatical.</strong> One card in six at most, phrased as a question with its reason. Nirva&rsquo;s app shows Energy, Mood and Stress today; this concept explores whether the evening reflection can do without numbers on feelings. Hedging everything would make Nirva sound like it has no point of view.
          </li>
          <li>
            <strong className="font-semibold">People cards describe her, not them.</strong> &ldquo;You sped up early on both calls&rdquo; instead of a label on Dev. Opt-in, family hidden by default, the source of each name shown (calendar, or that she said it),
            and one tap to stop including someone.
          </li>
          <li>
            <strong className="font-semibold">Show the gap.</strong> When she pauses the pendant, the day arc breaks instead of drawing through a half hour nobody heard. It&rsquo;s the smallest piece of the design and maybe the most honest.
          </li>
        </ol>
      </Part>

      <Part id="scripted" title="Scripted," accent="assumed, unknown">
        <p>
          <strong className="font-semibold">Scripted:</strong> every line. Maya is fictional, her week is written by hand, and every dial position and correction is a pre-written alternate. There is no live model. The stream is replayed from a fixture
          so the demo behaves the same every time.
        </p>
        <p>
          <strong className="font-semibold">Assumed:</strong> how the pipeline works (what is heard and let go, what is kept), based on what Nirva has said publicly. That a model can return this structure. The thresholds (three times in nine days).
        </p>
        <p>
          <strong className="font-semibold">Unknown:</strong> Nirva&rsquo;s real app, data model, stack, and everything its team has already designed. Where this overlaps their work, theirs is better informed.
        </p>
        <p>
          <strong className="font-semibold">Not tested with users.</strong> The copy hasn&rsquo;t been put in front of anyone in Nirva&rsquo;s audience yet. That would be the first thing to do with it.
        </p>
      </Part>

      <Part id="scope" title="Where reflection" accent="stops">
        <p>
          This is a self-understanding product, not therapy, and the design keeps that line visible. Safety copy is a locked component the model can route to but never writes, reached only from explicit words in the text channel and never from tone of
          voice. Inferred mood is never written to Apple Health, where State of Mind is meant to be self-reported. Evenings end on something worth keeping and at most one small next step, with no streaks and an easy &ldquo;not tonight&rdquo;.
        </p>
      </Part>

      <Part id="built" title="How it was" accent="built">
        <p>
          {SITE.built}, under the same <code className="type-code">CLAUDE.md</code> and lint hook shown on <A href="/system">System</A>. One schema and one token file generate both the TypeScript and the Swift. The web replay and the SwiftUI package
          read the same streamed fixture. Unit tests cover stream order, dial invariants, corrections and the voice rules. Playwright and axe cover every route. {SWIFT_MANIFEST?.source === "ios-simulator"
            ? `The SwiftUI package builds, runs its tests and renders on the iOS Simulator in CI (${SWIFT_MANIFEST.device}, commit ${SWIFT_MANIFEST.sha?.slice(0, 7)}).`
            : "The SwiftUI package builds and renders on macOS with ImageRenderer; a CI workflow for the iOS Simulator is included."}{" "}
          <A href={SITE.repo}>Code on GitHub</A>.
        </p>
      </Part>

      <Part id="role" title="Next to Nirva&rsquo;s" accent="design lead">
        <p>
          This is one surface, explored deeply, to show how I&rsquo;d work: design and production SwiftUI in the same hands, with the system and the agent conventions kept up as I go. It isn&rsquo;t a redesign of Nirva&rsquo;s app or a claim about its direction. On a
          real team the design lead sets that direction, and I&rsquo;d want my work to make theirs ship faster.
        </p>
      </Part>

      <Part id="research" title="Research" accent="notes">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Honesty and feedback style, context hub, couples deferred for now: Wei Lyu in a <A href="https://hub.baai.ac.cn/view/57779">Founder Park interview</A> (Chinese). &ldquo;Selling self-understanding&rdquo;: <A href="https://siliconangle.com/?p=851521">SiliconANGLE</A>.
          </li>
          <li>
            Wearer-only listening, audio and transcripts not kept by default, tone/pitch/volume/speed: <A href="https://techcrunch.com/2026/10/22/nirva-raises-33m-for-a-pendant-that-only-listens-to-you/">TechCrunch, Oct 22 2026</A>.
          </li>
          <li>
            A CES hands-on felt one scorecard summary line sounded a bit too AI-generated, and wanted to test whether the metrics match how people feel: <A href="https://www.tomsguide.com/ai/the-oura-for-your-emotions-is-here-new-ai-jewelry-auto-journals-your-life-and-tells-you-which-people-are-draining-your-battery-the-most">Tom&rsquo;s Guide</A>. The summary drafts and the correction loop are aimed at those two questions, not at the product as a whole.
          </li>
          <li>
            Across ambient AI wearables, no app I could find shows when it&rsquo;s unsure, and correction is rare. Voice-based emotion inference is contested (pleasant vs unpleasant reads better than specific emotions), which is why this design
            leans on her own baseline and her own corrections.
          </li>
          <li>
            Generative UI guidance followed: Apple&rsquo;s <A href="https://developer.apple.com/design/human-interface-guidelines/generative-ai">HIG for generative AI</A> (refine or revert, specific progress messages), and Google PAIR on calibrated trust.
          </li>
        </ul>
      </Part>
    </div>
  );
}
