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
    x: -6.4 + seededUnit(contribution.id * 3) * 12.8,
    y: -2.6 + seededUnit(contribution.id * 5) * 5.2,
    z: -1 + seededUnit(contribution.id * 7) * 2,
    scale: 0.31 + seededUnit(contribution.id * 11) * 0.22,
    speed: 0.3 + seededUnit(contribution.id * 13) * 0.32,
    phase: seededUnit(contribution.id * 17) * Math.PI * 2,
    direction: seededUnit(contribution.id * 19) > 0.5 ? 1 : -1,
    verticalSpeed: (seededUnit(contribution.id * 23) - 0.5) * 0.34,
  }), [contribution.id]);
  const motion = useRef({
    x: placement.x,
    y: placement.y,
    vx: placement.speed * placement.direction,
    vy: placement.verticalSpeed,
  });

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const elapsed = clock.elapsedTime;
    const state = motion.current;
    const maxX = 7.15;
    const maxY = 2.95;
    const turnZone = 0.85;

    if (state.x > maxX - turnZone && state.vx > 0) state.vx = -Math.abs(state.vx);
    if (state.x < -maxX + turnZone && state.vx < 0) state.vx = Math.abs(state.vx);
    if (state.y > maxY - turnZone && state.vy > 0) state.vy = -Math.max(0.08, Math.abs(state.vy));
    if (state.y < -maxY + turnZone && state.vy < 0) state.vy = Math.max(0.08, Math.abs(state.vy));

    state.vy += Math.sin(elapsed * 0.52 + placement.phase) * 0.045 * delta;
    state.vy = THREE.MathUtils.clamp(state.vy, -0.24, 0.24);
    state.x += state.vx * delta;
    state.y += state.vy * delta;

    ref.current.position.x = state.x;
    ref.current.position.y = state.y;
    ref.current.rotation.y = THREE.MathUtils.damp(
      ref.current.rotation.y,
      state.vx >= 0 ? 0 : Math.PI,
      3.4,
      delta,
    );
    ref.current.rotation.z = THREE.MathUtils.damp(
      ref.current.rotation.z,
      state.vy * 0.24 + Math.sin(elapsed * 0.8 + placement.phase) * 0.025,
      2.8,
      delta,
    );
  });

  return (
    <group
      ref={ref}
      position={[placement.x, placement.y, placement.z]}
      rotation={[0, placement.direction > 0 ? 0 : Math.PI, 0]}
    >
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
