"use client";

import { useEffect, useState } from "react";
import { visualizationDesign } from "@/config/visualization";

export type RevealPhase =
  | "idle"
  | "assembling"
  | "attached"
  | "release"
  | "formation"
  | "content-reveal"
  | "complete";

export const revealTiming = {
  /** Particles fly in from the screen edges and settle into the constellation. */
  assembling: 2800,
  attached: 650,
  release: 1350,
  formation: 2600,
  uiReveal: 900,
} as const;

/**
 * Creature designs open a first-time reveal by assembling the artifact's
 * constellation; the constellation design has its own particle narrative.
 */
export const revealAssemblesConstellation = visualizationDesign !== "constellation";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useRevealMachine(
  artifactId: string,
  onContentReady: () => void,
  immediate = false,
  assemble = false,
) {
  const [phase, setPhase] = useState<RevealPhase>(
    immediate ? "complete" : assemble ? "assembling" : "attached",
  );

  useEffect(() => {
    if (immediate) {
      onContentReady();
      return;
    }

    const reduced = prefersReducedMotion();
    const scale = reduced ? 0.08 : 1;
    const assemblingEnd = assemble ? revealTiming.assembling * scale : 0;
    const attachedEnd = assemblingEnd + revealTiming.attached * scale;
    const releaseEnd = attachedEnd + revealTiming.release * scale;
    const formationEnd = releaseEnd + revealTiming.formation * scale;
    const completeAt = formationEnd + revealTiming.uiReveal * scale;
    const timers: number[] = [];

    if (assemble) {
      timers.push(window.setTimeout(() => setPhase("attached"), assemblingEnd));
    }

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
  }, [artifactId, assemble, immediate, onContentReady]);

  return phase;
}
