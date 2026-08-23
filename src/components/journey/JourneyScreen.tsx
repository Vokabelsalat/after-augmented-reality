"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { themes } from "@/data/themes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setExperiencePhase } from "@/store/journeySlice";
import {
  selectDiscoveries,
  selectDiscoveredArtifacts,
} from "@/store/selectors";

const JourneyConstellation = dynamic(
  () =>
    import("@/components/particles/JourneyConstellation").then(
      (module) => module.JourneyConstellation,
    ),
  { ssr: false },
);

export function JourneyScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const discoveries = useAppSelector(selectDiscoveries);
  const discoveredArtifacts = useAppSelector(selectDiscoveredArtifacts);

  return (
    <main className="film-grain safe-top safe-bottom flex min-h-dvh flex-col overflow-hidden bg-[#050505] px-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.24em] text-white/42 uppercase">Personal trace</p>
          <h1 className="font-display mt-2 text-4xl tracking-[-0.045em]">My Journey</h1>
        </div>
        <button
          type="button"
          onClick={() => dispatch(setExperiencePhase("scanning"))}
          className="min-h-11 rounded-full bg-white/[0.07] px-5 text-xs text-white/75"
        >
          Return
        </button>
      </header>

      <div className="mx-auto h-[44dvh] w-full max-w-xl" aria-label="Your evolving journey visualization">
        <JourneyConstellation discoveries={discoveries} />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1">
        <p className="text-[10px] tracking-[0.22em] text-white/35 uppercase">
          In the order you found them
        </p>
        <ol className="mt-4 space-y-3">
          {discoveredArtifacts.length === 0 ? (
            <li className="text-sm leading-6 text-white/42">
              Return to the scanner. Each discovered work will leave a new particle cluster here.
            </li>
          ) : (
            discoveredArtifacts.map(({ artifact, sequence }) => (
              <li key={artifact.id} className="flex items-baseline gap-4">
                <span className="text-[10px] text-white/30">0{sequence}</span>
                <span className="font-display text-xl">{artifact.title}</span>
                <span className="ml-auto text-[9px] tracking-[0.14em] uppercase" style={{ color: artifact.color }}>
                  {themes[artifact.theme].label}
                </span>
              </li>
            ))
          )}
        </ol>
      </div>

      <button
        type="button"
        onClick={() => {
          dispatch(setExperiencePhase("ending"));
          router.push("/journey");
        }}
        className="mx-auto mt-7 flex min-h-14 w-full max-w-xl items-center justify-between rounded-full bg-[#F3F0E8] px-6 text-sm text-black disabled:cursor-not-allowed disabled:opacity-35"
        disabled={discoveries.length === 0}
      >
        <span>Finish my reading</span>
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}
