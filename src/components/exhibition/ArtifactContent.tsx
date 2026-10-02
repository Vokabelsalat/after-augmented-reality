"use client";

import { useState } from "react";
import type { ExhibitionArtifact } from "@/types/exhibition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { choiceMade } from "@/store/journeySlice";
import { selectDiscoveries } from "@/store/selectors";

type ArtifactContentProps = {
  artifact: ExhibitionArtifact;
  onContinue: () => void;
  mini?: boolean;
};

export function ArtifactContent({ artifact, onContinue, mini = false }: ArtifactContentProps) {
  const dispatch = useAppDispatch();
  const discoveries = useAppSelector(selectDiscoveries);
  const existingChoice = discoveries.find((item) => item.artifactId === artifact.id)?.choiceId;
  const [selectedChoice, setSelectedChoice] = useState(existingChoice ?? "");
  const [expanded, setExpanded] = useState(false);

  function choose(option: ExhibitionArtifact["choice"]["options"][number]) {
    if (existingChoice) return;
    setSelectedChoice(option.id);
    const effects = { ...artifact.stateEffects };
    (Object.keys(option.effects) as Array<keyof typeof option.effects>).forEach((axis) => {
      effects[axis] = (effects[axis] ?? 0) + (option.effects[axis] ?? 0);
    });
    dispatch(choiceMade({ artifactId: artifact.id, choiceId: option.id, effects }));
  }

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
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-white/65">
          <span>Specimen {String(artifact.targetIndex + 1).padStart(3, "0")}</span>
          <span>{artifact.marineType}</span>
        </div>

        <h2 id="artifact-title" className="font-display max-w-lg text-[clamp(2rem,9vw,3.3rem)] leading-[0.94] tracking-[-0.055em]">
          {artifact.title}
        </h2>
        <p className="mt-2 text-sm text-white/58">{artifact.artist}</p>

        <p className="mt-5 font-display text-xl italic leading-7 text-[var(--phosphor)]">
          {artifact.storylet}
        </p>

        {!mini && !existingChoice && (
          <fieldset className="mt-6">
            <legend className="text-base leading-6 text-white/88">{artifact.choice.prompt}</legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {artifact.choice.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => choose(option)}
                  aria-pressed={selectedChoice === option.id}
                  className={`min-h-14 border px-4 text-left text-sm transition-colors ${selectedChoice === option.id ? "border-[var(--phosphor)] bg-[var(--phosphor)] text-[#031015]" : "border-white/25 bg-black/20 text-white hover:bg-white/10"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-white/48">There is no correct current.</p>
          </fieldset>
        )}

        {(mini || existingChoice) && (
          <p className="mt-5 border-t border-white/15 pt-4 text-sm text-white/58">
            The tank logged your response. It may not understand it.
          </p>
        )}

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
        disabled={!mini && !existingChoice && !selectedChoice}
        className="mx-auto mt-5 flex min-h-14 w-full max-w-xl items-center justify-between border-t border-white/20 pt-4 text-base text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span>{mini ? "Return to the tank" : "Continue through the exhibition"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
