"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CreatureModel } from "@/components/creature/CreatureModel";
import type { ExhibitionContribution } from "@/types/contribution";

function seededUnit(seed: number) {
  const value = Math.sin(seed * 999.13) * 43758.5453;
  return value - Math.floor(value);
}

function FloatingCreature({ contribution }: { contribution: ExhibitionContribution }) {
  const ref = useRef<THREE.Group>(null);
  const placement = useMemo(() => ({
    x: -6.5 + seededUnit(contribution.id * 3) * 13,
    y: -3.15 + seededUnit(contribution.id * 5) * 6.25,
    z: -1 + seededUnit(contribution.id * 7) * 2,
    scale: 0.31 + seededUnit(contribution.id * 11) * 0.22,
    speed: 0.16 + seededUnit(contribution.id * 13) * 0.2,
    phase: seededUnit(contribution.id * 17) * Math.PI * 2,
  }), [contribution.id]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const time = clock.elapsedTime * placement.speed + placement.phase;
    ref.current.position.x = placement.x + Math.sin(time * 0.72) * 0.42;
    ref.current.position.y = placement.y + Math.cos(time) * 0.32;
    ref.current.rotation.z = Math.sin(time * 0.58) * 0.11;
  });

  return (
    <group ref={ref} position={[placement.x, placement.y, placement.z]}>
      <CreatureModel pieces={contribution.parts} scale={placement.scale} />
    </group>
  );
}

export function CollectiveCreatureField({ contributions }: { contributions: ExhibitionContribution[] }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 82, near: 0.1, far: 30 }}
      dpr={[1, 1.35]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 5, 8]} intensity={2.4} color="#FFF4DF" />
      <pointLight position={[-5, 1, 5]} intensity={2.2} color="#58D6FF" />
      <pointLight position={[5, -2, 5]} intensity={1.8} color="#FF7557" />
      {contributions.slice(-32).map((contribution) => (
        <FloatingCreature key={contribution.id} contribution={contribution} />
      ))}
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
