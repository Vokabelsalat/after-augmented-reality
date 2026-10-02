"use client";

import { useRouter } from "next/navigation";
import { artifacts } from "@/data/artifacts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { finishJourney, resetJourney } from "@/store/journeySlice";
import { selectDiscoveryCount } from "@/store/selectors";

type ARSimulatorProps = {
  onArtifactDetected: (artifactId: string) => void;
  onClose?: () => void;
};

export function ARSimulator({
  onArtifactDetected,
  onClose,
}: ARSimulatorProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const discoveryCount = useAppSelector(selectDiscoveryCount);

  return (
    <aside className="safe-bottom absolute inset-x-3 bottom-3 z-30 rounded-[1.5rem] bg-[#101010]/92 p-3 text-white shadow-2xl backdrop-blur-xl" aria-label="AR simulator controls">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[9px] tracking-[0.22em] text-white/40">
          AR simulator · same event path
        </p>
        {onClose && (
          <button type="button" onClick={onClose} className="min-h-8 px-2 text-xs text-white/55">
            Hide
          </button>
        )}
      </div>
      <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto overscroll-contain pr-1">
        {artifacts.map((artifact, index) => (
          <button
            key={artifact.id}
            type="button"
            onClick={() => onArtifactDetected(artifact.id)}
            className="min-h-11 rounded-full bg-white/[0.08] px-2 text-[11px] transition-colors hover:bg-white/[0.14]"
          >
            {index + 1}. {artifact.title}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => dispatch(resetJourney())}
          className="min-h-10 rounded-full px-3 text-[11px] text-white/50 transition-colors hover:text-white"
        >
          Reset journey
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch(finishJourney());
            router.push("/journey");
          }}
          disabled={discoveryCount < 3}
          className="min-h-10 rounded-full bg-white px-3 text-[11px] text-black transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {discoveryCount < 3 ? `${3 - discoveryCount} more needed` : "Finish journey"}
        </button>
      </div>
    </aside>
  );
}
