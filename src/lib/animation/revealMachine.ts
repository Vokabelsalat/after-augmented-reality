"use client";

import { useEffect, useState } from "react";

export type RevealPhase =
  | "idle"
  | "attached"
  | "release"
  | "formation"
  | "content-reveal"
  | "complete";

export const revealTiming = {
  attached: 500,
  release: 1200,
  formation: 1000,
  uiReveal: 500,
} as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useRevealMachine(
  artifactId: string,
  onContentReady: () => void,
) {
  const [phase, setPhase] = useState<RevealPhase>("attached");

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const scale = reduced ? 0.08 : 1;
    const attachedEnd = revealTiming.attached * scale;
    const releaseEnd = attachedEnd + revealTiming.release * scale;
    const formationEnd = releaseEnd + revealTiming.formation * scale;
    const completeAt = formationEnd + revealTiming.uiReveal * scale;
    const timers: number[] = [];

    timers.push(window.setTimeout(() => setPhase("release"), attachedEnd));
    timers.push(window.setTimeout(() => setPhase("formation"), releaseEnd));
    timers.push(
      window.setTimeout(() => {
        setPhase("content-reveal");
        onContentReady();
      }, formationEnd),
    );
    timers.push(window.setTimeout(() => setPhase("complete"), completeAt));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [artifactId, onContentReady]);

  return phase;
}
