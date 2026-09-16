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
import { CreatureCanvas } from "@/components/creature/CreatureCanvas";
import dynamic from "next/dynamic";

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
    <main className="film-grain safe-top safe-bottom min-h-dvh overflow-x-hidden bg-[#050505] px-5">
      <header className="relative z-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-[-0.04em]">
          After Augmented Reality
        </Link>
        <p className="text-[9px] tracking-[0.24em] text-white/42">
          Your fish
        </p>
      </header>

      <section className="relative mx-auto mt-1 h-[46dvh] min-h-80 w-full max-w-3xl" aria-labelledby="reading-title">
        <h1 id="reading-title" className="absolute inset-x-0 top-6 z-10 text-center text-[10px] tracking-[0.32em] text-white/48">
          Your fish
        </h1>
        <CreatureCanvas artifactIds={discoveries.map((item) => item.artifactId)} label="Your finished exhibition fish" />
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
        <p className="mb-6 text-[9px] tracking-[0.24em] text-white/35">The voice it found along your path</p>
        <GeneratedNarrative lines={lines} />

        <div className="mt-14">
          <ShareContribution
            sessionId={journey.sessionId}
            completedAt={journey.completedAt}
            discoveries={discoveries}
          />
        </div>

        <div className="mt-8 border-t border-white/12 pt-6">
          <Link
            href="/"
            onClick={() => dispatch(setExperiencePhase("scanning"))}
            className="flex min-h-12 items-center justify-between text-sm text-white/72"
          >
            <span>Continue this journey</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href="/"
            onClick={() => dispatch(resetJourney())}
            className="mt-2 flex min-h-12 items-center justify-between text-sm text-white"
          >
            <span>Start again</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
