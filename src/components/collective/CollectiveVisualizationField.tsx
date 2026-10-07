"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { CollectiveCreatureField, type CreatureArrival } from "@/components/collective/CollectiveCreatureField";
import { AbstractCreatureModel } from "@/components/visualization/AbstractCreatureCanvas";
import { NetworkGlyph } from "@/components/visualization/NetworkGlyph";
import { RenderStats, type RenderStatsReport } from "@/components/development/RenderStats";
import { collectiveCapacity, visualizationDesign } from "@/config/visualization";
import type { ExhibitionContribution } from "@/types/contribution";

function seededUnit(seed: number) {
  const value = Math.sin(seed * 999.13) * 43758.5453;
  return value - Math.floor(value);
}

const compartmentCenters = [
  [-0.82, 0],
  [-0.36, 0],
  [0.06, 0],
  [0.44, 0],
  [0.84, 0],
] as const;

function FloatingAbstractCreature({ contribution, progress }: { contribution: ExhibitionContribution; progress: number }) {
  const ref = useRef<THREE.Group>(null);
  const placement = useMemo(() => ({
    x: -6.5 + seededUnit(contribution.id * 3) * 13,
    y: -3.15 + seededUnit(contribution.id * 5) * 6.25,
    z: -1 + seededUnit(contribution.id * 7) * 2,
    scale: 0.31 + seededUnit(contribution.id * 11) * 0.22,
    speed: 0.16 + seededUnit(contribution.id * 13) * 0.2,
    phase: seededUnit(contribution.id * 17) * Math.PI * 2,
  }), [contribution.id]);
  const compartment = compartmentCenters[contribution.id % compartmentCenters.length];
  const containment = Math.max(0, 1 - progress * 1.35);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const time = clock.elapsedTime * placement.speed + placement.phase;
    ref.current.position.x = placement.x * (1 - containment) + compartment[0] * 5.8 * containment + Math.sin(time * 0.72) * (0.24 + progress * 0.3);
    ref.current.position.y = placement.y * (1 - containment) + compartment[1] * 3.9 * containment + Math.cos(time) * (0.18 + progress * 0.25);
    ref.current.rotation.z = Math.sin(time * 0.58) * 0.11;
  });

  return (
    <group ref={ref} position={[placement.x, placement.y, placement.z]}>
      <AbstractCreatureModel pieces={contribution.parts} scale={placement.scale} />
    </group>
  );
}

function CollectiveAbstractField({
  contributions,
  progress,
  onRenderStats,
}: {
  contributions: ExhibitionContribution[];
  progress: number;
  onRenderStats?: (report: RenderStatsReport) => void;
}) {
  return (
    <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 82, near: 0.1, far: 30 }} dpr={[1, 1.35]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      {onRenderStats && <RenderStats onReport={onRenderStats} />}
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 5, 8]} intensity={2.4} color="#FFF4DF" />
      <pointLight position={[-5, 1, 5]} intensity={2.2} color="#58D6FF" />
      <pointLight position={[5, -2, 5]} intensity={1.8} color="#FF7557" />
      {contributions.slice(-collectiveCapacity).map((contribution) => (
        <FloatingAbstractCreature key={contribution.id} contribution={contribution} progress={progress} />
      ))}
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

function CollectiveNetworkField({ contributions, progress }: { contributions: ExhibitionContribution[]; progress: number }) {
  return (
    <div className="relative size-full">
      {contributions.slice(-collectiveCapacity).map((contribution) => {
        const size = 110 + seededUnit(contribution.id * 7) * 150;
        const compartment = compartmentCenters[contribution.id % compartmentCenters.length];
        const containment = Math.max(0, 1 - progress * 1.35);
        const openLeft = 7 + seededUnit(contribution.id * 3) * 86;
        const openTop = 12 + seededUnit(contribution.id * 5) * 76;
        const containedLeft = 50 + compartment[0] * 43;
        const containedTop = 50 - compartment[1] * 42;
        const style = {
          left: `${openLeft * (1 - containment) + containedLeft * containment}%`,
          top: `${openTop * (1 - containment) + containedTop * containment}%`,
          width: `${size}px`,
          height: `${size}px`,
          "--float-delay": `${seededUnit(contribution.id * 11) * -18}s`,
          "--float-duration": `${17 + seededUnit(contribution.id * 13) * 14}s`,
        } as CSSProperties;
        return (
          <div
            key={contribution.id}
            className="collective-fragment absolute -translate-x-1/2 -translate-y-1/2 opacity-55"
            style={style}
            aria-hidden="true"
          >
            <NetworkGlyph contribution={contribution} />
          </div>
        );
      })}
    </div>
  );
}

export function CollectiveVisualizationField({
  contributions,
  progress = 1,
  arrival,
  onSelectContribution,
  onRenderStats,
  mergeStaticMeshes = false,
}: {
  contributions: ExhibitionContribution[];
  progress?: number;
  arrival?: CreatureArrival | null;
  onSelectContribution?: (contribution: ExhibitionContribution) => void;
  /** Merges each creature's still parts into a few meshes in the 3D aquarium. */
  mergeStaticMeshes?: boolean;
  /** When set, the 3D aquarium reports its frame rate and mesh counts twice a second. */
  onRenderStats?: (report: RenderStatsReport) => void;
}) {
  if (visualizationDesign === "constellation") {
    return <CollectiveNetworkField contributions={contributions} progress={progress} />;
  }
  if (visualizationDesign === "creature") {
    return <CollectiveAbstractField contributions={contributions} progress={progress} onRenderStats={onRenderStats} />;
  }
  return (
    <CollectiveCreatureField
      contributions={contributions}
      progress={progress}
      arrival={arrival}
      onSelectContribution={onSelectContribution}
      onRenderStats={onRenderStats}
      mergeStaticMeshes={mergeStaticMeshes}
    />
  );
}
