"use client";

import { useState } from "react";
import { activeVisualizationCopy } from "@/config/visualization";
import type { Discovery } from "@/store/journeySlice";

type ShareState = "idle" | "sharing" | "shared" | "error";

export function ShareContribution({
  sessionId,
  completedAt,
  discoveries,
}: {
  sessionId: string | null;
  completedAt: number | null;
  discoveries: Discovery[];
}) {
  const [state, setState] = useState<ShareState>("idle");

  async function share() {
    if (!sessionId || !completedAt || discoveries.length === 0 || state === "sharing") return;
    setState("sharing");
    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, completedAt, discoveries }),
      });
      if (!response.ok) throw new Error("Share failed");
      setState("shared");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="border-t border-white/12 pt-6">
      <button
        type="button"
        onClick={share}
        disabled={!sessionId || !completedAt || discoveries.length === 0 || state === "sharing" || state === "shared"}
        className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#F3F0E8] px-6 text-sm text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>
          {state === "sharing" && `Releasing your ${activeVisualizationCopy.singular}…`}
          {state === "shared" && `Your ${activeVisualizationCopy.singular} has joined`}
          {state === "error" && "Try sharing again"}
          {state === "idle" && "Release to the collective"}
        </span>
        <span aria-hidden="true">{state === "shared" ? "✓" : "↗"}</span>
      </button>
      <p className="mt-3 px-3 text-center text-[10px] leading-4 tracking-[0.08em] text-white/35" role="status" aria-live="polite">
        {state === "shared"
          ? `Your ${activeVisualizationCopy.singular} has joined the collective ${activeVisualizationCopy.collectivePlace}.`
          : state === "error"
            ? "The screen could not be reached. Your story is still safe on this device."
            : `Your ${activeVisualizationCopy.singular} and its voice will appear anonymously in the collective ${activeVisualizationCopy.collectivePlace}.`}
      </p>
    </div>
  );
}
