"use client";

import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { creaturePiecesFromArtifactIds } from "@/components/creature/CreatureModel";
import { AquaticCreatureModel } from "@/components/creature/AquaticCreatureModel";
import { growingTraitTag, TraitGrowthContext } from "@/components/creature/AquaticModelShared";
import { aquaticFormLabels, type AquaticForm } from "@/lib/creature/aquaticForms";
import type { CreaturePartId } from "@/types/exhibition";
import type { CreatureColorPalette } from "@/lib/creature/colorPalettes";
import type { CreaturePattern } from "@/lib/creature/patterns";
import type { CreatureProportions } from "@/lib/creature/proportions";

/** Share of the canvas a fitted creature fills before `fitScale` is applied. */
export const creatureFitMargin = 0.82;

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

    object.position.set(0, 0, 0);
    // Frame a trait that is still collapsed at its full size, so it can grow without a refit.
    const collapsed: Array<{ group: THREE.Object3D; scale: THREE.Vector3 }> = [];
    object.traverse((child) => {
      if (!child.userData[growingTraitTag]) return;
      collapsed.push({ group: child, scale: child.scale.clone() });
      child.scale.setScalar(1);
    });
    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    collapsed.forEach(({ group, scale }) => group.scale.copy(scale));
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    object.position.set(-center.x, -center.y, 0);
    object.updateWorldMatrix(true, true);

    const fittedCamera = currentCamera.clone();
    fittedCamera.position.x = 0;
    fittedCamera.position.y = 0;
    fittedCamera.lookAt(0, 0, 0);
    fittedCamera.zoom = Math.min(
      size.width / Math.max(dimensions.x, 0.001),
      size.height / Math.max(dimensions.y, 0.001),
    ) * creatureFitMargin * scale;
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
  creaturePalette,
  creaturePattern,
  creatureProportions,
  emergingArtifactId,
  emerging = false,
  label,
  interactive = false,
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
  creaturePalette?: CreatureColorPalette;
  creaturePattern?: CreaturePattern;
  creatureProportions?: CreatureProportions;
  /** A trait that stays collapsed until `emerging` turns true, then grows in. */
  emergingArtifactId?: string;
  emerging?: boolean;
  label?: string;
  interactive?: boolean;
}) {
  const pieces = creaturePiecesFromArtifactIds(artifactIds);
  const creatureRootRef = useRef<THREE.Group>(null);
  const fitKey = `${creatureForm}:${artifactIds.join("|")}`;
  const growth = useMemo(
    () => ({ artifactId: emergingArtifactId, growing: emerging }),
    [emergingArtifactId, emerging],
  );

  return (
    <div
      className={`relative size-full ${interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
      role="img"
      aria-label={`${label ?? `${aquaticFormLabels[creatureForm]} with ${pieces.length} collected ${pieces.length === 1 ? "trait" : "traits"}`}${interactive ? ". Drag to rotate the model." : ""}`}
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
          <TraitGrowthContext.Provider value={growth}>
            <AquaticCreatureModel form={creatureForm} pieces={pieces} baseSeed={creatureSeed} colorPalette={creaturePalette} pattern={creaturePattern} proportions={creatureProportions} highlightedPart={highlightedPart} scale={(compact ? 0.86 : 1) * creatureScale} />
          </TraitGrowthContext.Provider>
        </group>
        {interactive && (
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            enablePan={false}
            enableZoom={false}
            rotateSpeed={0.65}
            target={[0, 0, 0]}
          />
        )}
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
