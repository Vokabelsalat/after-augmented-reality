"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CreatureModel, creaturePiecesFromArtifactIds } from "@/components/creature/CreatureModel";
import type { CreaturePartId } from "@/types/exhibition";

export function CreatureCanvas({
  artifactIds,
  highlightedPart,
  compact = false,
  label,
}: {
  artifactIds: string[];
  highlightedPart?: CreaturePartId;
  compact?: boolean;
  label?: string;
}) {
  const pieces = creaturePiecesFromArtifactIds(artifactIds);

  return (
    <div
      className="relative size-full"
      role="img"
      aria-label={label ?? `Fish with ${pieces.length} collected ${pieces.length === 1 ? "part" : "parts"}`}
    >
      <Canvas
        camera={{ position: [0, 0.15, compact ? 5.4 : 5], fov: compact ? 48 : 44, near: 0.1, far: 30 }}
        dpr={[1, compact ? 1.25 : 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 6]} intensity={2.6} color="#FFF4DF" />
        <pointLight position={[-3, 0, 4]} intensity={2} color="#58D6FF" />
        <pointLight position={[3, -2, 3]} intensity={1.4} color="#FF7557" />
        <CreatureModel pieces={pieces} highlightedPart={highlightedPart} scale={compact ? 0.86 : 1} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
