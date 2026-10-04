"use client";

import { useAppDispatch } from "@/store/hooks";
import { startJourney } from "@/store/journeySlice";
import { BiomeBackdrop } from "@/components/visualization/BiomeBackdrop";

export function IntroScreen() {
  const dispatch = useAppDispatch();

  return (
    <main className="biome-field biome-screen film-grain relative min-h-dvh overflow-hidden bg-[var(--abyss)] px-5 text-[var(--foam)]">
      <BiomeBackdrop progress={0.26} quiet />
      <div className="safe-top relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        <header className="flex items-start justify-between border-b border-white/20 pb-3 text-sm">
          <span>After Augmented Reality</span>
          <span className="text-right text-white/55">Tank cycle 01<br />containment nominal</span>
        </header>

        <section className="grid flex-1 items-center gap-6 py-8 md:grid-cols-[1.1fr_.9fr]" aria-labelledby="intro-title">
          <div className="relative z-10">
            <h1 id="intro-title" className="font-display max-w-3xl text-[clamp(4.2rem,14vw,9rem)] leading-[0.73] tracking-[-0.075em]">
              The Tank
              <span className="block translate-x-[8vw] italic text-[var(--phosphor)] md:translate-x-20">Is Leaking</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-7 text-white/74">
              This aquarium is trying to classify the exhibition. Scan the markers, gather fragments of a story, and grow a creature it cannot fully contain.
            </p>
          </div>

          <div className="porthole mx-auto aspect-square w-[min(72vw,25rem)]" aria-hidden="true">
            <div className="porthole-glass">
              <span className="specimen-word specimen-word-one">memory</span>
              <span className="specimen-word specimen-word-two">voice</span>
              <span className="specimen-word specimen-word-three">unclassified</span>
              <span className="leak-line leak-line-one" />
              <span className="leak-line leak-line-two" />
              <span className="marine-snow marine-snow-one">title_004</span>
              <span className="marine-snow marine-snow-two">open_sea?</span>
            </div>
          </div>
        </section>

        <div className="safe-bottom relative z-10 grid items-end gap-4 border-t border-white/20 pt-4 md:grid-cols-[1fr_auto]">
          <p className="max-w-lg text-sm leading-6 text-white/58">
            One QR code. No download or login. Camera access is requested when you enter the tank.
          </p>
          <button
            type="button"
            onClick={() => dispatch(startJourney())}
            className="flex min-h-16 w-full items-center justify-between bg-[var(--phosphor)] px-6 text-base text-[#031015] transition-transform active:scale-[0.99] md:w-80"
          >
            <span>Scan an artwork marker</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
