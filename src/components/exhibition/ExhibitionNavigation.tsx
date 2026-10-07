"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDiscoveries,
  selectDiscoveryCount,
  selectCreatureForm,
  selectCreatureSeed,
  selectCreaturePalette,
  selectCreaturePattern,
  selectCreatureProportions,
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
  const creaturePalette = useAppSelector(selectCreaturePalette);
  const creaturePattern = useAppSelector(selectCreaturePattern);
  const creatureProportions = useAppSelector(selectCreatureProportions);
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
        className="pointer-events-auto flex items-center gap-2 border border-white/45 bg-[var(--abyss)] pr-3 text-sm text-white shadow-[0_0_1.5rem_rgba(0,0,0,0.35)] transition-colors hover:border-white"
        aria-label={`Open ${activeVisualizationCopy.personalTitle}, ${count} parts collected`}
      >
        <div key={previewKey} className="specimen-preview-update size-14 overflow-hidden bg-white/[0.035]" aria-hidden="true">
          <PathVisualization artifactIds={previewDiscoveries.map((item) => item.artifactId)} creatureForm={creatureForm} creatureSeed={creatureSeed} creaturePalette={creaturePalette ?? undefined} creaturePattern={creaturePattern ?? undefined} creatureProportions={creatureProportions ?? undefined} compact />
        </div>
        <span>My Creature</span>
      </button>
    </header>
  );
}
