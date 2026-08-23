"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { artifactByTargetIndex } from "@/data/artifacts";
import {
  ARScanner,
  type ARScannerHandle,
} from "@/components/ar/ARScanner";
import { ARSimulator } from "@/components/development/ARSimulator";
import { ArtifactReveal } from "@/components/exhibition/ArtifactReveal";
import { ExhibitionNavigation } from "@/components/exhibition/ExhibitionNavigation";
import { IntroScreen } from "@/components/exhibition/IntroScreen";
import { JourneyScreen } from "@/components/journey/JourneyScreen";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { artifactDetected } from "@/store/journeySlice";
import {
  selectDiscoveries,
  selectExperiencePhase,
} from "@/store/selectors";

export function ExhibitionExperience() {
  const dispatch = useAppDispatch();
  const scannerRef = useRef<ARScannerHandle>(null);
  const phase = useAppSelector(selectExperiencePhase);
  const discoveries = useAppSelector(selectDiscoveries);
  const [simulatorVisible, setSimulatorVisible] = useState(
    process.env.NODE_ENV === "development",
  );
  const [alreadyDiscovered, setAlreadyDiscovered] = useState<string | null>(null);
  const [revealPresentation, setRevealPresentation] = useState<
    "tracked-ar" | "simulated"
  >("tracked-ar");
  const discoveredIds = useMemo(
    () => new Set(discoveries.map((discovery) => discovery.artifactId)),
    [discoveries],
  );

  // useEffect(() => {
  //   if (!alreadyDiscovered) return;
  //   const timer = window.setTimeout(() => setAlreadyDiscovered(null), 1800);
  //   return () => window.clearTimeout(timer);
  // }, [alreadyDiscovered]);

  const handleArtifactDetected = useCallback(
    (artifactId: string) => {
      if (phase !== "scanning") return;
      // if (discoveredIds.has(artifactId)) {
      //   setAlreadyDiscovered(artifactId);
      //   return;
      // }
      dispatch(artifactDetected(artifactId));
    },
    [dispatch, discoveredIds, phase],
  );

  const handleTargetFound = useCallback(
    (targetIndex: number) => {
      const artifact = artifactByTargetIndex.get(targetIndex);
      if (artifact) {
        setRevealPresentation("tracked-ar");
        handleArtifactDetected(artifact.id);
      }
    },
    [handleArtifactDetected],
  );

  if (phase === "intro") return <IntroScreen />;
  if (phase === "journey") return <JourneyScreen />;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <ARScanner
        ref={scannerRef}
        onTargetFound={handleTargetFound}
        onTargetLost={() => undefined}
        onUseSimulator={() => setSimulatorVisible(true)}
        simulatorVisible={simulatorVisible}
      />
      <ExhibitionNavigation />

      {/* {alreadyDiscovered && (
        <div className="absolute top-28 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/75 px-5 py-3 text-center text-[10px] tracking-[0.16em] text-white/70 backdrop-blur-lg" role="status">
          Already part of your journey
        </div>
      )} */}

      {simulatorVisible && phase === "scanning" && (
        <ARSimulator
          onArtifactDetected={(artifactId) => {
            setRevealPresentation("simulated");
            handleArtifactDetected(artifactId);
          }}
          onClose={() => setSimulatorVisible(false)}
        />
      )}

      <ArtifactReveal
        presentation={revealPresentation}
        onContinue={(artifact) => {
          scannerRef.current?.dismissArtifact(artifact.targetIndex);
        }}
      />
    </main>
  );
}
