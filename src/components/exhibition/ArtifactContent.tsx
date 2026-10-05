"use client";

import { useState } from "react";
import type { ExhibitionArtifact } from "@/types/exhibition";

type ArtifactContentProps = {
  artifact: ExhibitionArtifact;
  onContinue: () => void;
  mini?: boolean;
};

export function ArtifactContent({ artifact, onContinue, mini = false }: ArtifactContentProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="resolve-in tank-panel safe-bottom absolute inset-x-0 bottom-0 z-20 px-5 pb-4 pt-3"
      aria-labelledby="artifact-title"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mx-auto mb-4 block min-h-6 w-20"
        aria-label={expanded ? "Collapse artwork details" : "Expand artwork details"}
      >
        <span className="mx-auto block h-px w-14 bg-white/45" />
      </button>

      <div className={`mx-auto w-full max-w-xl overflow-y-auto overscroll-contain ${expanded ? "max-h-[70dvh]" : mini ? "max-h-[42dvh]" : "max-h-[56dvh]"}`}>
        <h2 id="artifact-title" className="font-display max-w-lg text-[clamp(2rem,9vw,3.3rem)] leading-[0.94] tracking-[-0.055em]">
          {artifact.title}
        </h2>
        <p className="mt-2 text-sm text-white/58">{artifact.artist}</p>

        <p className="mt-5 max-w-lg font-display text-xl italic leading-7 text-[var(--phosphor)]">
          {artifact.storylet}
          <span className="mt-2 block text-white/88">{artifact.choice.prompt}</span>
        </p>

        {expanded && (
          <div className="mt-6 border-t border-white/15 pt-5">
            <p className="text-sm text-white/50">Tank classification: {artifact.classification}</p>
            <p className="mt-4 text-base leading-7 text-white/78">{artifact.shortText}</p>
            <p className="mt-4 text-sm text-white/50">Traits carried forward: {artifact.visualTraits.join(" · ")}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mx-auto mt-5 flex min-h-14 w-full max-w-xl items-center justify-between border-t border-white/20 pt-4 text-base text-white"
      >
        <span>{mini ? "Return to the tank" : "Continue through the exhibition"}</span>
      </button>
    </article>
  );
}
