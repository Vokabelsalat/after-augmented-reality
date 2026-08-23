"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { artifactById } from "@/data/artifacts";
import { useRevealMachine } from "@/lib/animation/revealMachine";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  artifactCollected,
  setActiveArtifact,
  setExperiencePhase,
} from "@/store/journeySlice";
import { selectActiveArtifactId } from "@/store/selectors";
import { ArtifactContent } from "@/components/exhibition/ArtifactContent";
import type { ExhibitionArtifact } from "@/types/exhibition";

const ParticleNarrative = dynamic(
  () =>
    import("@/components/particles/ParticleNarrative").then(
      (module) => module.ParticleNarrative,
    ),
  { ssr: false },
);

function ArtifactRevealSequence({ artifact }: { artifact: ExhibitionArtifact }) {
  const dispatch = useAppDispatch();
  const handleContentReady = useCallback(() => {
    dispatch(artifactCollected(artifact.id));
  }, [artifact.id, dispatch]);
  const phase = useRevealMachine(artifact.id, handleContentReady);

  const contentVisible = phase === "content-reveal" || phase === "complete";

  return (
    <section className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-live="polite">
      <div className="absolute inset-0 bg-black/20 transition-colors duration-700" />
      <ParticleNarrative
        artifact={artifact}
        phase={phase}
        mode="ar-release"
        quality="medium"
      />
      {!contentVisible && (
        <p className="absolute inset-x-0 bottom-[12vh] text-center text-[10px] tracking-[0.28em] text-white/65 uppercase">
          {phase === "attached" && "Fragment located"}
          {phase === "release" && "Releasing narrative"}
          {phase === "formation" && "Resolving language"}
        </p>
      )}
      {contentVisible && (
        <div className="pointer-events-auto">
          <ArtifactContent
            artifact={artifact}
            onContinue={() => {
              dispatch(setActiveArtifact(null));
              dispatch(setExperiencePhase("scanning"));
            }}
          />
        </div>
      )}
    </section>
  );
}

export function ArtifactReveal() {
  const activeArtifactId = useAppSelector(selectActiveArtifactId);
  const artifact = activeArtifactId
    ? artifactById.get(activeArtifactId) ?? null
    : null;

  if (!artifact) return null;
  return <ArtifactRevealSequence key={artifact.id} artifact={artifact} />;
}
