"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDiscoveries,
  selectDiscoveryCount,
  selectCreatureForm,
  selectCreatureSeed,
  selectExperiencePhase,
  selectActiveArtifactId,
} from "@/store/selectors";
import { setExperiencePhase } from "@/store/journeySlice";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { activeVisualizationCopy } from "@/config/visualization";

export function ExhibitionNavigation() {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectDiscoveryCount);
  const discoveries = useAppSelector(selectDiscoveries);
  const creatureForm = useAppSelector(selectCreatureForm);
  const creatureSeed = useAppSelector(selectCreatureSeed);
  const phase = useAppSelector(selectExperiencePhase);
  const activeArtifactId = useAppSelector(selectActiveArtifactId);
  const previewDiscoveries = phase === "revealing"
    ? discoveries.filter((item) => item.artifactId !== activeArtifactId)
    : discoveries;
  const previewKey = previewDiscoveries.map((item) => item.artifactId).join(":") || "base";

  return (
    <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4">
      <div>
        <p className="text-lg leading-none tracking-[-0.04em]">The Fishbowl Leaks</p>
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
        <span key={previewKey} className="specimen-preview-update size-12 overflow-hidden rounded-full bg-white/[0.035]" aria-hidden="true">
          <PathVisualization artifactIds={previewDiscoveries.map((item) => item.artifactId)} creatureForm={creatureForm} creatureSeed={creatureSeed} compact />
        </span>
        <span>My specimen</span>
      </button>
    </header>
  );
}
