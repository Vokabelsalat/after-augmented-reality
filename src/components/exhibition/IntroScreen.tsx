"use client";

import { useAppDispatch } from "@/store/hooks";
import { startJourney } from "@/store/journeySlice";
import { BiomeBackdrop } from "@/components/visualization/BiomeBackdrop";

export function IntroScreen() {
  const dispatch = useAppDispatch();

  return (
    <main className="biome-field biome-screen film-grain relative h-dvh overflow-hidden bg-[var(--abyss)] px-5 text-[var(--foam)]">
      <BiomeBackdrop progress={0.26} quiet />
      <div className="safe-top relative z-10 mx-auto flex h-dvh w-full max-w-5xl flex-col">

        <section className="grid min-h-0 flex-1 items-center gap-4 py-4 md:grid-cols-[1.1fr_.9fr] md:gap-6 md:py-8" aria-labelledby="intro-title">
          <div className="relative z-10">
            <h1 id="intro-title" className="font-display max-w-3xl text-[clamp(3.2rem,13vw,9rem)] leading-[0.73] tracking-[-0.075em]">
              The Fishbowl
              <span className="block translate-x-[8vw] italic text-[var(--phosphor)] md:translate-x-20">Leaks</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-6 text-white/74 md:mt-8 md:text-lg md:leading-7">
              This aquarium is trying to classify the exhibition. Scan the markers, gather fragments of a story, and grow a creature it cannot fully contain.
            </p>
          </div>

          <div className="porthole mx-auto aspect-square w-[min(48vw,25rem)] max-md:max-h-[28dvh] max-md:max-w-[28dvh]" aria-hidden="true">
            <div className="porthole-glass">
              <span className="radar-range radar-range-outer" />
              <span className="radar-range radar-range-middle" />
              <span className="radar-range radar-range-inner" />
              <span className="radar-axis radar-axis-horizontal" />
              <span className="radar-axis radar-axis-vertical" />
              <span className="radar-sweep" />
              <span className="radar-vessel" />
              <span className="radar-contact radar-contact-one" />
              <span className="radar-contact radar-contact-two" />
              <span className="radar-contact radar-contact-three" />
              <span className="radar-contact radar-contact-four" />
              <span className="theme-echo theme-echo-memory">Memory and afterlives</span>
              <span className="theme-echo theme-echo-systems">Synthetic systems and constructed authority</span>
              <span className="theme-echo theme-echo-language">Language across materials</span>
              <span className="theme-echo theme-echo-dreams">Dreams and simulated worlds</span>
              <span className="theme-echo theme-echo-embodiment">Embodiment, care, and resistance</span>
            </div>
          </div>
        </section>

        <div className="safe-bottom relative z-10 grid items-end gap-4 border-t border-white/20 pt-4 md:grid-cols-[1fr_auto]">
          <p className="max-w-lg text-sm align-middle text-white/58">
            Camera access is requested when you enter the tank.
          </p>
          <button
            type="button"
            onClick={() => dispatch(startJourney())}
            className="flex min-h-16 w-full items-center justify-between border border-[var(--phosphor)] bg-[var(--phosphor)] px-6 text-base text-[#031015] shadow-[0_0_2rem_rgba(184,255,69,0.2)] transition-transform active:scale-[0.99] md:w-80"
          >
            <span>Scan an artwork marker</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
