import type { Metadata } from "next";
import Link from "next/link";
import { PaletteGallery } from "@/components/palettes/PaletteGallery";
import { ScrollNotice } from "@/components/ui/ScrollNotice";

export const metadata: Metadata = {
  title: "Creature Palettes — The Fishbowl Leaks",
  description: "Preview every color palette a visitor's creature can be drawn in.",
};

export default function PalettesPage() {
  return (
    <main className="min-h-dvh bg-[var(--abyss)] text-[var(--foam)]">
      <ScrollNotice label="All palettes continue below" />
      <header className="mx-auto flex max-w-[100rem] flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between lg:px-12">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl leading-none sm:text-6xl">
            Creature palettes
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
            Every visitor&apos;s creature is drawn in one of these palettes. Choose a creature and a pattern to see them in place.
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
        <PaletteGallery />
      </section>
    </main>
  );
}
