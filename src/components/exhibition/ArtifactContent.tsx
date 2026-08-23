"use client";

import type { ExhibitionArtifact } from "@/types/exhibition";
import { themes } from "@/data/themes";

type ArtifactContentProps = {
  artifact: ExhibitionArtifact;
  onContinue: () => void;
};

export function ArtifactContent({ artifact, onContinue }: ArtifactContentProps) {
  const theme = themes[artifact.theme];

  return (
    <article
      className="resolve-in safe-bottom absolute inset-x-0 bottom-0 z-20 min-h-[48dvh] rounded-t-[2.25rem] bg-[#090909]/95 px-6 pt-7 pb-5 shadow-[0_-24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      aria-labelledby="artifact-title"
    >
      <div className="mx-auto mb-8 h-px w-12 bg-white/25" aria-hidden="true" />
      <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: artifact.color }}
          aria-hidden="true"
        />
        <span style={{ color: artifact.color }}>{theme.label}</span>
        <span className="text-white/30">· Collected</span>
      </div>
      <h2
        id="artifact-title"
        className="font-display mt-5 max-w-sm text-[clamp(2.7rem,13vw,4.2rem)] leading-[0.91] tracking-[-0.055em]"
      >
        {artifact.title}
      </h2>
      <p className="mt-4 text-[10px] tracking-[0.18em] text-white/42 uppercase">
        {artifact.artist}
      </p>
      <p className="mt-7 max-w-md text-lg leading-7 text-white/76">
        {artifact.shortText}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-8 flex min-h-13 w-full items-center justify-between border-t border-white/15 pt-4 text-sm text-white transition-colors hover:text-white/70"
      >
        <span>Continue scanning</span>
        <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
