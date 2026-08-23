"use client";

import type { ExhibitionArtifact } from "@/types/exhibition";
import { themes } from "@/data/themes";
import { useState } from "react";
import Image from "next/image";

type ArtifactContentProps = {
  artifact: ExhibitionArtifact;
  onContinue: () => void;
  mini?: boolean;
};

export function ArtifactContent({ artifact, onContinue, mini = false }: ArtifactContentProps) {
  const theme = themes[artifact.theme];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <article
      className="resolve-in safe-bottom absolute inset-x-0 bottom-0 z-20 rounded-t-[2.25rem] bg-[#090909]/95 px-6 py-4 shadow-[0_-24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl "
      aria-labelledby="artifact-title"
    >
      <div className="bg-white/25 w-16 h-1 mx-auto mb-3" onClick={() => { setCollapsed(!collapsed) }} />
      <div className={`flex flex-col gap-2 ${collapsed ? "max-h-[80vh]" : mini ? "max-h-[9vh]" : "max-h-[35vh]"} w-full overflow-y-auto overscroll-contain`}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.22em]">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: artifact.color }}
            aria-hidden="true"
          />
          <span style={{ color: artifact.color }}>{theme.label}</span>
          <span className="text-white/80">· Collected</span>
        </div>
        <h2
          id="artifact-title"
          className="max-w-sm text-[clamp(1rem,7vw,2.2rem)] leading-[0.91] tracking-[-0.055em]"
        >
          {artifact.title}
        </h2>
        <p className="text-[10px] tracking-[0.18em] text-white/80">
          {artifact.artist}
        </p>
        <p className="max-w-md text-base leading-7 text-white/80">
          {artifact.shortText}
        </p>
        <div className="w-full relative">
          <Image
            src={artifact.posterImageSrc} alt={artifact.shortText}
            layout="responsive"
            width={244}
            height={183}
            className="rounded-xl"
          />
        </div>
        {/* <div className="absolute">
          <Image src={artifact.posterImageSrc} alt={artifact.shortText} className="rounded-xl relative" fill sizes="(max-width: 768px) 100vw, 33vw" />
        </div> */}
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-5 flex min-h-13 w-full items-center justify-between border-t border-white/15 pt-4 text-sm text-white transition-colors hover:text-white/70"
      >
        <span>Continue scanning</span>
        <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
