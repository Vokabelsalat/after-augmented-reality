"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { creaturePiecesFromArtifactIds } from "@/components/creature/CreatureModel";
import { AquaticCreatureModel } from "@/components/creature/AquaticCreatureModel";
import { aquaticFormLabels, type AquaticForm } from "@/lib/creature/aquaticForms";
import type { CreaturePartId } from "@/types/exhibition";

const fittedBounds: Record<AquaticForm, { width: number; height: number }> = {
  fish: { width: 6.2, height: 4.1 },
  crab: { width: 4.4, height: 3.4 },
  jellyfish: { width: 3.6, height: 4.5 },
  octopus: { width: 4.2, height: 4.5 },
  turtle: { width: 5.3, height: 3.5 },
  ray: { width: 6.5, height: 4.2 },
  starfish: { width: 4.4, height: 4.4 },
  seahorse: { width: 3.5, height: 4.8 },
  seal: { width: 5.6, height: 3.7 },
  clam: { width: 4.2, height: 3.8 },
  pufferfish: { width: 5.1, height: 4.1 },
};

function FitCreatureCamera({ creatureForm, scale = 1 }: { creatureForm: AquaticForm; scale?: number }) {
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);
  const set = useThree((state) => state.set);

  useLayoutEffect(() => {
    const currentCamera = get().camera;
    if (!(currentCamera instanceof THREE.OrthographicCamera)) return;
    const bounds = fittedBounds[creatureForm];
    const fittedCamera = currentCamera.clone();
    fittedCamera.zoom = Math.min(size.width / bounds.width, size.height / bounds.height) * 0.82 * scale;
    fittedCamera.updateProjectionMatrix();
    set({ camera: fittedCamera });
  }, [creatureForm, get, scale, set, size.height, size.width]);

  return null;
}

export function CreatureCanvas({
  artifactIds,
  highlightedPart,
  compact = false,
  zoom,
  fitToView = false,
  fitScale = 1,
  creatureForm = "fish",
  label,
}: {
  artifactIds: string[];
  highlightedPart?: CreaturePartId;
  compact?: boolean;
  zoom?: number;
  fitToView?: boolean;
  fitScale?: number;
  creatureForm?: AquaticForm;
  label?: string;
}) {
  const pieces = creaturePiecesFromArtifactIds(artifactIds);

  return (
    <div
      className="relative size-full"
      role="img"
      aria-label={label ?? `${aquaticFormLabels[creatureForm]} with ${pieces.length} collected ${pieces.length === 1 ? "trait" : "traits"}`}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0.1, 10], zoom: zoom ?? (compact ? 18 : 100), near: 0.1, far: 30 }}
        dpr={[1, compact ? 1.25 : 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        {fitToView && <FitCreatureCamera creatureForm={creatureForm} scale={fitScale} />}
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 6]} intensity={2.6} color="#FFF4DF" />
        <pointLight position={[-3, 0, 4]} intensity={2} color="#58D6FF" />
        <pointLight position={[3, -2, 3]} intensity={1.4} color="#FF7557" />
        <AquaticCreatureModel form={creatureForm} pieces={pieces} highlightedPart={highlightedPart} scale={compact ? 0.86 : 1} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
