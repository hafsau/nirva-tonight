import type { ElementType, ReactNode } from "react";

/**
 * A generated field. Until the stream closes it, it holds its space with quiet
 * placeholder lines (SwiftUI: .redacted(reason: .placeholder)). When it closes,
 * the text settles in once, whole. Keyed by its text, so a re-stream re-settles.
 */
export function Field({
  ready,
  text,
  lines = 1,
  as: Tag = "p",
  className = "",
  children,
}: {
  ready: boolean;
  text?: string;
  lines?: number;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  if (!ready || text === undefined) {
    return (
      <Tag className={className} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="placeholder-line my-[0.45em]" style={{ width: i === lines - 1 && lines > 1 ? "62%" : "100%" }} />
        ))}
      </Tag>
    );
  }
  return (
    <Tag key={text} className={`settle ${className}`}>
      {children ?? text}
    </Tag>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`type-label text-slate-ink ${className}`}>{children}</p>;
}

/** 16:40 -> 4:40 PM */
export function clock(at: string): string {
  const [h, m] = at.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Last two words in the slate accent, like nirva.life's serif lines. */
export function AccentTail({ text, words = 2 }: { text: string; words?: number }) {
  const parts = text.split(" ");
  const head = parts.slice(0, -words).join(" ");
  const tail = parts.slice(-words).join(" ");
  return (
    <>
      {head} <span className="text-slate">{tail}</span>
    </>
  );
}
