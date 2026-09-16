"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDiscoveries,
  selectDiscoveryCount,
} from "@/store/selectors";
import { setExperiencePhase } from "@/store/journeySlice";
import { CreatureCanvas } from "@/components/creature/CreatureCanvas";

export function ExhibitionNavigation() {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectDiscoveryCount);
  const discoveries = useAppSelector(selectDiscoveries);

  return (
    <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4">
      <div>
        <p className="text-lg leading-none tracking-[-0.04em]">After Augmented Reality</p>
        <p className="text-[10px] tracking-[0.2em] text-white/80" aria-live="polite">
          {count} {count === 1 ? "part" : "parts"} collected
        </p>
      </div>
      <button
        type="button"
        onClick={() => dispatch(setExperiencePhase("journey"))}
        className="pointer-events-auto flex min-h-16 items-center gap-2 rounded-full bg-black/45 py-1 pr-4 pl-1.5 text-xs text-white backdrop-blur-md transition-colors hover:bg-black/65"
        aria-label={`Open My Creature, ${count} parts collected`}
      >
        <span className="size-12 overflow-hidden rounded-full bg-white/[0.035]" aria-hidden="true">
          <CreatureCanvas artifactIds={discoveries.map((item) => item.artifactId)} compact />
        </span>
        <span>My Creature</span>
      </button>
    </header>
  );
}
