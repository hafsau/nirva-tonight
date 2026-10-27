"use client";

import { useCallback, useEffect, useState } from "react";
import { delayFor } from "@/lib/stream";
import {
  correct as correctX,
  flush,
  initialExperience,
  replyToHunch,
  setTone as setToneX,
  stopIncluding,
  tick,
  type CorrectionKey,
  type Experience,
  type Tone,
} from "@/lib/tonight";

/**
 * Drains the patch queue on a timer, one patch at a time, the way a model
 * stream arrives. `startDelay` keeps the first frame calm before anything moves.
 */
export function useExperience({ autoplay = true, startDelay = 700 }: { autoplay?: boolean; startDelay?: number } = {}) {
  const [x, setX] = useState<Experience>(initialExperience);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [autoplay, startDelay]);

  useEffect(() => {
    if (!started || x.queue.length === 0) return;
    const t = setTimeout(() => setX(tick), delayFor(x.queue[0], speed));
    return () => clearTimeout(t);
  }, [started, x, speed]);

  return {
    x,
    started,
    speed,
    setSpeed,
    start: useCallback(() => setStarted(true), []),
    setTone: useCallback((t: Tone) => setX((s) => setToneX(s, t)), []),
    correct: useCallback((k: CorrectionKey) => setX((s) => correctX(s, k)), []),
    reply: useCallback((r: string) => setX((s) => replyToHunch(s, r)), []),
    stop: useCallback((name: string) => setX((s) => stopIncluding(s, name)), []),
    showAll: useCallback(() => {
      setStarted(true);
      setX(flush);
    }, []),
    replay: useCallback(() => {
      setX(initialExperience());
      setStarted(true);
    }, []),
  };
}

export type ExperienceApi = ReturnType<typeof useExperience>;
