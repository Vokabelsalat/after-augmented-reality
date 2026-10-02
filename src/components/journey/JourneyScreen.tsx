"use client";

import { useRouter } from "next/navigation";
import { themes } from "@/data/themes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { finishJourney, setExperiencePhase } from "@/store/journeySlice";
import {
  selectDiscoveries,
  selectDiscoveredArtifacts,
  selectNarrativeState,
} from "@/store/selectors";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { activeVisualizationCopy, visualizationDesign } from "@/config/visualization";

export function JourneyScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const discoveries = useAppSelector(selectDiscoveries);
  const discoveredArtifacts = useAppSelector(selectDiscoveredArtifacts);
  const narrativeState = useAppSelector(selectNarrativeState);
  const readyToRelease = discoveries.length >= 3;

  return (
    <main className="tank-grid film-grain safe-top safe-bottom flex min-h-dvh flex-col overflow-x-hidden bg-[var(--abyss)] px-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">Provisional specimen record</p>
          <h1 className="font-display mt-1 text-4xl tracking-[-0.045em]">Your unclassified fish</h1>
        </div>
        <button
          type="button"
          onClick={() => dispatch(setExperiencePhase("scanning"))}
          className="min-h-11 border border-white/25 px-5 text-sm text-white/75"
        >
          Return
        </button>
      </header>

      <div className="mx-auto h-[38dvh] min-h-72 w-full max-w-xl">
        <PathVisualization artifactIds={discoveries.map((item) => item.artifactId)} label={`Your evolving exhibition ${activeVisualizationCopy.singular}`} />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1">
        <div className="mb-6 grid grid-cols-5 gap-2 border-y border-white/15 py-4" aria-label="Narrative state">
          {Object.entries(narrativeState).map(([axis, value]) => (
            <div key={axis} className="min-w-0">
              <span className="block truncate text-xs text-white/45">{axis}</span>
              <span className="mt-2 block h-1 bg-white/10">
                <span className="block h-full bg-[var(--phosphor)] transition-all" style={{ width: `${Math.max(8, ((value + 8) / 16) * 100)}%` }} />
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/45">
          {visualizationDesign === "constellation" ? "Signals, in encounter order" : "Traits crossing the glass"}
        </p>
        <ol className="mt-4 space-y-3">
          {discoveredArtifacts.length === 0 ? (
            <li className="text-sm leading-6 text-white/42">
              {visualizationDesign === "constellation"
                ? "Return to the scanner. Each discovered work will leave a new particle cluster here."
                : `Return to the scanner. Each discovered work will give your ${activeVisualizationCopy.singular} a new trait.`}
            </li>
          ) : (
            discoveredArtifacts.map(({ artifact, sequence }) => (
              <li key={artifact.id} className="flex items-baseline gap-4">
                <span className="text-sm text-white/30">{String(sequence).padStart(2, "0")}</span>
                {visualizationDesign === "constellation" ? (
                  <span className="font-display text-xl">{artifact.title}</span>
                ) : (
                  <span>
                    <span className="font-display block text-xl">{artifact.creaturePart.label}</span>
                    <span className="mt-0.5 block text-sm text-white/45">{artifact.marineType} · from {artifact.title}</span>
                  </span>
                )}
                <span className="ml-auto text-xs" style={{ color: artifact.color }}>
                  {themes[artifact.theme].label.toLowerCase()}
                </span>
              </li>
            ))
          )}
        </ol>
      </div>

      <button
        type="button"
        onClick={() => {
          dispatch(finishJourney());
          router.push("/journey");
        }}
        className="mx-auto mt-7 flex min-h-14 w-full max-w-xl items-center justify-between bg-[var(--phosphor)] px-6 text-base text-[#031015] disabled:cursor-not-allowed disabled:opacity-35"
        disabled={!readyToRelease}
      >
        <span>{readyToRelease ? "Generate my ending" : `${3 - discoveries.length} more ${3 - discoveries.length === 1 ? "encounter" : "encounters"} before release`}</span>
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}
