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

type RevealPresentation = "tracked-ar" | "simulated";

function ArtifactRevealSequence({
  artifact,
  onContinue,
}: {
  artifact: ExhibitionArtifact;
  onContinue?: (artifact: ExhibitionArtifact) => void;
}) {
  const dispatch = useAppDispatch();
  const handleContentReady = useCallback(() => {
    dispatch(artifactCollected(artifact.id));
  }, [artifact.id, dispatch]);
  const phase = useRevealMachine(artifact.id, handleContentReady);

  const contentVisible = phase === "content-reveal" || phase === "complete";

  return (
    <section className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-live="polite">
      {phase !== "complete" && (
        <ParticleNarrative
          artifact={artifact}
          phase={phase}
          mode="ar-release"
          quality="high"
        />
      )}
      {!contentVisible && (
        <p className="absolute inset-x-0 bottom-[12vh] text-center text-[10px] tracking-[0.28em] text-white/65">
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
              onContinue?.(artifact);
              dispatch(setActiveArtifact(null));
              dispatch(setExperiencePhase("scanning"));
            }}
          />
        </div>
      )}
    </section>
  );
}

export function ArtifactReveal({
  presentation,
  onContinue,
}: {
  presentation: RevealPresentation;
  onContinue?: (artifact: ExhibitionArtifact) => void;
}) {
  const activeArtifactId = useAppSelector(selectActiveArtifactId);
  const artifact = activeArtifactId
    ? artifactById.get(activeArtifactId) ?? null
    : null;

  if (!artifact) return null;
  return (
    <ArtifactRevealSequence
      key={artifact.id}
      artifact={artifact}
      onContinue={presentation === "tracked-ar" ? onContinue : undefined}
    />
  );
}
