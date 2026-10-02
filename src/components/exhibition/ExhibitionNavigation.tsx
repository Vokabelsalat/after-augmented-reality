"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDiscoveries,
  selectDiscoveryCount,
} from "@/store/selectors";
import { setExperiencePhase } from "@/store/journeySlice";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { activeVisualizationCopy } from "@/config/visualization";

export function ExhibitionNavigation() {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectDiscoveryCount);
  const discoveries = useAppSelector(selectDiscoveries);

  return (
    <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4">
      <div>
        <p className="text-lg leading-none tracking-[-0.04em]">The Tank Is Leaking</p>
        <p className="mt-1 text-sm text-white/65" aria-live="polite">
          {count} {count === 1 ? "encounter" : "encounters"} recorded
        </p>
      </div>
      <button
        type="button"
        onClick={() => dispatch(setExperiencePhase("journey"))}
        className="pointer-events-auto flex min-h-16 items-center gap-2 border border-white/25 bg-[var(--abyss)] py-1 pr-4 pl-1.5 text-sm text-white transition-colors hover:bg-black"
        aria-label={`Open ${activeVisualizationCopy.personalTitle}, ${count} parts collected`}
      >
        <span className="size-12 overflow-hidden rounded-full bg-white/[0.035]" aria-hidden="true">
          <PathVisualization artifactIds={discoveries.map((item) => item.artifactId)} compact />
        </span>
          <span>My specimen</span>
      </button>
    </header>
  );
}
