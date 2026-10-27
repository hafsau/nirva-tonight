"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A bottom sheet inside the phone (SwiftUI: .sheet with .presentationDetents).
 * Modal for assistive tech, Escape closes, focus moves in and returns to the trigger.
 */
export function Sheet({
  open,
  title,
  onClose,
  returnFocus,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  returnFocus: HTMLElement | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Latest callbacks without re-running the open/close effect (which moves focus).
  const latest = useRef({ onClose, returnFocus });
  useEffect(() => {
    latest.current = { onClose, returnFocus };
  });

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const trigger = latest.current.returnFocus;
    el?.querySelector<HTMLElement>("#sheet-title")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current.onClose();
      if (e.key === "Tab" && el) {
        const items = [...el.querySelectorAll<HTMLElement>("button, [href], input")];
        const [first, last] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end sm:absolute">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-deep/20" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="settle relative max-h-[85%] overflow-y-auto rounded-t-[var(--radius-sheet)] bg-mist px-[var(--space-lg)] pb-[var(--space-xxl)] pt-[var(--space-sm)] shadow-[0_-8px_40px_var(--color-hairline)]"
      >
        <div aria-hidden="true" className="mx-auto mb-[var(--space-md)] h-1.5 w-10 rounded-full bg-hairline" />
        <h2 id="sheet-title" tabIndex={-1} className="type-title text-ink outline-none">
          {title}
        </h2>
        <div className="mt-[var(--space-md)]">{children}</div>
      </div>
    </div>
  );
}
