import type { Metadata } from "next";
import Link from "next/link";
import {
  ParticleConstellationGallery,
  type ParticlePreviewArtifact,
} from "@/components/particles/ParticleConstellationGallery";
import { initialOrientation } from "@/components/particles/constellationPainter";
import { artifacts } from "@/data/artifacts";
import { constellationOrientations } from "@/data/constellationOrientations";
import { ScrollNotice } from "@/components/ui/ScrollNotice";

export const metadata: Metadata = {
  title: "Particle Constellations — The Fishbowl Leaks",
  description: "Preview every exhibition artifact's particle color and geometric formation.",
};

const previewArtifacts: ParticlePreviewArtifact[] = artifacts.map(
  ({ id, exhibitionId, title, color, alternativeColor, particleForm }) => ({
    id,
    exhibitionId,
    title,
    color,
    alternativeColor,
    particleForm,
    orientation: constellationOrientations[id] ?? initialOrientation,
  }),
);

export default function ParticleConstellationsPage() {
  return (
    <main className="min-h-dvh bg-[var(--abyss)] text-[var(--foam)]">
      <ScrollNotice label="All particle constellations continue below" />
      <header className="mx-auto flex max-w-[100rem] flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between lg:px-12">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl leading-none sm:text-6xl">
            Particle constellations
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
            The complete exhibition set, using the same deterministic formations and colors as the scanner reveal.
          </p>
        </div>
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-4 border border-white/40 px-5 text-base text-[var(--foam)] transition-colors hover:border-white"
        >
          Return to the exhibition
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="mx-auto max-w-[100rem] px-5 pb-12 sm:px-8 lg:px-12">
        <ParticleConstellationGallery artifacts={previewArtifacts} />
      </section>
    </main>
  );
}
