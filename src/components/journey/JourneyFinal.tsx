"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { artifacts, artifactById } from "@/data/artifacts";
import { generateJourneyNarrative } from "@/lib/narrative/generateJourneyNarrative";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { finishJourney, resetJourney, setExperiencePhase } from "@/store/journeySlice";
import { selectDiscoveries } from "@/store/selectors";
import { selectJourney } from "@/store/selectors";
import { ShareContribution } from "@/components/journey/ShareContribution";
import { themes } from "@/data/themes";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { activeVisualizationCopy } from "@/config/visualization";
import dynamic from "next/dynamic";
import { BiomeBackdrop } from "@/components/visualization/BiomeBackdrop";

const GeneratedNarrative = dynamic(() =>
  import("@/components/journey/GeneratedNarrative").then(
    (module) => module.GeneratedNarrative,
  ),
);

export function JourneyFinal() {
  const dispatch = useAppDispatch();
  const discoveries = useAppSelector(selectDiscoveries);
  const journey = useAppSelector(selectJourney);
  const lines = useMemo(
    () => generateJourneyNarrative(discoveries, artifacts),
    [discoveries],
  );
  const themesInOrder = discoveries.flatMap((discovery) => {
    const artifact = artifactById.get(discovery.artifactId);
    return artifact ? [artifact] : [];
  });

  useEffect(() => {
    if (!journey.completedAt) {
      dispatch(finishJourney());
    }
  }, [dispatch, journey.completedAt]);

  return (
    <main className="biome-field biome-screen film-grain safe-top safe-bottom relative min-h-dvh overflow-x-hidden bg-[var(--abyss)] px-5">
      <BiomeBackdrop progress={0.88} />
      <header className="relative z-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-[-0.04em]">
          The Fishbowl Leaks
        </Link>
        <p className="text-[9px] tracking-[0.24em] text-white/42">
          Release chamber
        </p>
      </header>

      <section className="relative left-1/2 mt-1 h-[46dvh] min-h-80 w-screen -translate-x-1/2 overflow-visible" aria-labelledby="reading-title">
        <h1 id="reading-title" className="absolute inset-x-0 top-6 z-10 text-center text-[10px] tracking-[0.32em] text-white/48">
          Specimen pending release
        </h1>
        <PathVisualization
          artifactIds={discoveries.map((item) => item.artifactId)}
          creatureForm={journey.creatureForm}
          creatureSeed={journey.sessionId ?? undefined}
          fitToView
          label={`Your finished exhibition ${activeVisualizationCopy.singular}`}
        />
        <div className="absolute inset-x-0 bottom-5 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {themesInOrder.map((artifact, index) => (
            <span key={`${artifact.id}-${index}`} className="flex items-center gap-1.5 text-[9px] tracking-[0.14em] text-white/48">
              <span className="size-1 rounded-full" style={{ backgroundColor: artifact.color }} aria-hidden="true" />
              {themes[artifact.theme].label}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-xl pb-8">
        <p className="mb-6 text-sm text-white/45">The aquarium, remembered from inside</p>
        <GeneratedNarrative lines={lines} />

        <div className="mt-14">
          <ShareContribution
            sessionId={journey.sessionId}
            completedAt={journey.completedAt}
            discoveries={discoveries}
            creatureForm={journey.creatureForm}
          />
        </div>

        <div className="mt-8 border-t border-white/12 pt-6">
          <Link
            href="/"
            onClick={() => dispatch(setExperiencePhase("scanning"))}
            className="flex min-h-12 items-center justify-between text-sm text-white/72"
          >
            <span>Continue this journey</span>
          </Link>
          <Link
            href="/"
            onClick={() => dispatch(resetJourney())}
            className="mt-2 flex min-h-12 items-center justify-between text-sm text-white"
          >
            <span>Start again</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
