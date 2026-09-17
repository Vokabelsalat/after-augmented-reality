"use client";

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
import { ParticleNarrative } from "@/components/particles/ParticleNarrative";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { activeVisualizationCopy, visualizationDesign } from "@/config/visualization";
import { selectDiscoveries } from "@/store/selectors";

type RevealPresentation = "tracked-ar" | "simulated";

function ArtifactRevealSequence({
  artifact,
  isRevisit,
  onContinue,
}: {
  artifact: ExhibitionArtifact;
  isRevisit: boolean;
  onContinue?: (artifact: ExhibitionArtifact) => void;
}) {
  const dispatch = useAppDispatch();
  const discoveries = useAppSelector(selectDiscoveries);
  const handleContentReady = useCallback(() => {
    dispatch(artifactCollected(artifact.id));
  }, [artifact.id, dispatch]);
  const phase = useRevealMachine(
    artifact.id,
    handleContentReady,
    isRevisit,
  );

  const contentVisible = phase === "content-reveal" || phase === "complete";

  return (
    <section className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-live="polite">
      {!isRevisit && phase !== "complete" && (
        visualizationDesign === "constellation" ? (
          <ParticleNarrative artifact={artifact} phase={phase} mode="ar-release" quality="high" />
        ) : (
          <div className="absolute inset-x-0 top-[12vh] h-[52vh]">
            <PathVisualization
              artifactIds={discoveries.map((item) => item.artifactId)}
              highlightedPart={artifact.creaturePart.id}
              label={`${artifact.creaturePart.label} joining your ${activeVisualizationCopy.singular}`}
            />
          </div>
        )
      )}
      {!contentVisible && (
        <p className="absolute inset-x-0 bottom-[12vh] text-center text-[10px] tracking-[0.28em] text-white/65">
          {phase === "attached" && (visualizationDesign === "constellation" ? "Fragment located" : "New trait found")}
          {phase === "release" && (visualizationDesign === "constellation" ? "Releasing narrative" : `${artifact.creaturePart.label} is waking up`)}
          {phase === "formation" && (visualizationDesign === "constellation" ? "Resolving language" : `Joining your ${activeVisualizationCopy.singular}`)}
        </p>
      )}
      {contentVisible && (
        <div className="pointer-events-auto">
          <ArtifactContent
            mini={isRevisit}
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
  isRevisit,
  onContinue,
}: {
  presentation: RevealPresentation;
  isRevisit: boolean;
  onContinue?: (artifact: ExhibitionArtifact) => void;
}) {
  const activeArtifactId = useAppSelector(selectActiveArtifactId);
  const artifact = activeArtifactId
    ? artifactById.get(activeArtifactId) ?? null
    : null;

  if (!artifact) return null;
  return (
    <ArtifactRevealSequence
      key={`${artifact.id}:${isRevisit ? "revisit" : "reveal"}`}
      artifact={artifact}
      isRevisit={isRevisit}
      onContinue={presentation === "tracked-ar" ? onContinue : undefined}
    />
  );
}
