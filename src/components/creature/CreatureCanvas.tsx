"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { creaturePiecesFromArtifactIds } from "@/components/creature/CreatureModel";
import { AquaticCreatureModel } from "@/components/creature/AquaticCreatureModel";
import { aquaticFormLabels, type AquaticForm } from "@/lib/creature/aquaticForms";
import type { CreaturePartId } from "@/types/exhibition";

function FitCreatureCamera({
  objectRef,
  fitKey,
  scale = 1,
}: {
  objectRef: RefObject<THREE.Group | null>;
  fitKey: string;
  scale?: number;
}) {
  const size = useThree((state) => state.size);
  const get = useThree((state) => state.get);
  const set = useThree((state) => state.set);

  useLayoutEffect(() => {
    const currentCamera = get().camera;
    const object = objectRef.current;
    if (!(currentCamera instanceof THREE.OrthographicCamera) || !object) return;

    object.position.x = 0;
    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    object.position.x = -center.x;
    object.updateWorldMatrix(true, true);

    const fittedCamera = currentCamera.clone();
    fittedCamera.position.x = 0;
    fittedCamera.position.y = center.y;
    fittedCamera.lookAt(0, center.y, 0);
    fittedCamera.zoom = Math.min(
      size.width / Math.max(dimensions.x, 0.001),
      size.height / Math.max(dimensions.y, 0.001),
    ) * 0.82 * scale;
    fittedCamera.updateProjectionMatrix();
    fittedCamera.updateMatrixWorld();
    set({ camera: fittedCamera });
  }, [fitKey, get, objectRef, scale, set, size.height, size.width]);

  return null;
}

export function CreatureCanvas({
  artifactIds,
  highlightedPart,
  compact = false,
  zoom,
  fitToView = false,
  fitScale = 1,
  creatureScale = 1,
  creatureForm = "fish",
  creatureSeed,
  label,
}: {
  artifactIds: string[];
  highlightedPart?: CreaturePartId;
  compact?: boolean;
  zoom?: number;
  fitToView?: boolean;
  fitScale?: number;
  creatureScale?: number;
  creatureForm?: AquaticForm;
  creatureSeed?: string;
  label?: string;
}) {
  const pieces = creaturePiecesFromArtifactIds(artifactIds);
  const creatureRootRef = useRef<THREE.Group>(null);
  const fitKey = `${creatureForm}:${artifactIds.join("|")}`;

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
        {fitToView && <FitCreatureCamera objectRef={creatureRootRef} fitKey={fitKey} scale={fitScale} />}
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 6]} intensity={2.6} color="#FFF4DF" />
        <pointLight position={[-3, 0, 4]} intensity={2} color="#58D6FF" />
        <pointLight position={[3, -2, 3]} intensity={1.4} color="#FF7557" />
        <group ref={creatureRootRef}>
          <AquaticCreatureModel form={creatureForm} pieces={pieces} baseSeed={creatureSeed} highlightedPart={highlightedPart} scale={(compact ? 0.86 : 1) * creatureScale} />
        </group>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
