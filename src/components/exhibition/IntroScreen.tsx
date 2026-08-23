"use client";

import { useAppDispatch } from "@/store/hooks";
import { startJourney } from "@/store/journeySlice";

export function IntroScreen() {
  const dispatch = useAppDispatch();

  return (
    <main className="film-grain relative flex min-h-dvh flex-col overflow-hidden bg-[#050505] px-6 text-[#F3F0E8]">
      <div className="safe-top flex items-center justify-between text-[10px] tracking-[0.24em] text-white/45">
        <span>Exhibition reading</span>
        <span>01—03</span>
      </div>

      <div className="pointer-events-none absolute top-[15%] left-1/2 h-[38vh] w-px -translate-x-1/2 bg-white/10" />
      <div className="animate-breathe pointer-events-none absolute top-[29%] left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_8px_rgba(255,255,255,0.34)]" />

      <div className="flex flex-1 flex-col justify-center pb-[10vh]">
        <p className="mb-4 text-xs tracking-[0.26em] text-white/50">
          Extend the narrative
        </p>
        <h1 className="font-display -ml-1 text-[clamp(5.4rem,29vw,10rem)] leading-[0.72] font-normal tracking-[-0.085em]">
          Say
          <br />
          <span className="ml-[15vw] italic">Hi</span>
        </h1>
      </div>

      <div className="safe-bottom relative z-10 pb-6">
        <p className="max-w-sm text-lg leading-7 text-white/72">
          Scan fragments throughout the exhibition and build your own reading.
        </p>
        <button
          type="button"
          onClick={() => dispatch(startJourney())}
          className="mt-8 flex min-h-14 w-full items-center justify-between rounded-full bg-[#F3F0E8] px-6 text-sm font-medium text-black transition-transform active:scale-[0.98]"
        >
          <span>Start experience</span>
          <span aria-hidden="true">→</span>
        </button>
        <p className="mt-4 text-center text-[10px] leading-4 tracking-[0.12em] text-white/35">
          Camera access is requested on the next screen
        </p>
      </div>
    </main>
  );
}
