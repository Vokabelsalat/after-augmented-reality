"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { AquaticCreatureModel } from "@/components/creature/AquaticCreatureModel";
import type { AquaticForm } from "@/lib/creature/aquaticForms";
import type { ExhibitionContribution } from "@/types/contribution";

function seededUnit(seed: number) {
  const value = Math.sin(seed * 999.13) * 43758.5453;
  return value - Math.floor(value);
}

const compartmentBounds = [-1, -0.64, -0.08, 0.2, 0.68, 1] as const;
const wallThresholds = [0.14, 0.32, 0.5, 0.68] as const;
const wallHolePositions = [34, 66, 43, 72] as const;
const collectiveFormScale: Record<AquaticForm, number> = {
  fish: 1,
  crab: 1.04,
  jellyfish: 1.24,
  octopus: 1.12,
  turtle: 1.08,
  ray: 1.05,
  starfish: 0.96,
  seahorse: 1.2,
  eel: 0.92,
  seal: 1.05,
  clam: 1.08,
  pufferfish: 1,
};

function wallOpening(progress: number, wallIndex: number) {
  return THREE.MathUtils.clamp(
    (progress - wallThresholds[wallIndex]) / 0.16,
    0,
    1,
  );
}

function FloatingCreature({ contribution, progress }: { contribution: ExhibitionContribution; progress: number }) {
  const swimRef = useRef<THREE.Group>(null);
  const directionRef = useRef<THREE.Group>(null);
  const placement = useMemo(() => ({
    xUnit: -0.84 + seededUnit(contribution.id * 3) * 1.68,
    yUnit: -0.84 + seededUnit(contribution.id * 5) * 1.68,
    z: -1 + seededUnit(contribution.id * 7) * 2,
    scale: 0.31 + seededUnit(contribution.id * 11) * 0.22,
    speed: 0.32 + seededUnit(contribution.id * 13) * 0.34,
    phase: seededUnit(contribution.id * 17) * Math.PI * 2,
    heading: seededUnit(contribution.id * 19) * Math.PI * 2,
  }), [contribution.id]);
  const motion = useRef({
    initialized: false,
    x: 0,
    y: 0,
    vx: Math.cos(placement.heading) * placement.speed,
    vy: Math.sin(placement.heading) * placement.speed,
  });
  const spawnCompartment = contribution.id % 5;
  const previousProgress = useRef(progress);

  useFrame(({ clock, viewport }, delta) => {
    if (!swimRef.current || !directionRef.current) return;
    const elapsed = clock.elapsedTime;
    const state = motion.current;
    const maxX = Math.max(1.6, viewport.width / 2 - 0.9);
    const maxY = Math.max(1.25, viewport.height / 2 - 0.72);
    const spawnMinX = compartmentBounds[spawnCompartment] * maxX;
    const spawnMaxX = compartmentBounds[spawnCompartment + 1] * maxX;
    const spawnCenterX = (spawnMinX + spawnMaxX) / 2;
    const turnZone = 0.48;

    if (!state.initialized || progress < previousProgress.current - 0.025) {
      state.x = spawnCenterX + placement.xUnit * (spawnMaxX - spawnMinX) * 0.34;
      state.y = placement.yUnit * maxY;
      state.initialized = true;
    }
    previousProgress.current = progress;

    if (state.x > maxX - turnZone && state.vx > 0) state.vx = -Math.abs(state.vx);
    if (state.x < -maxX + turnZone && state.vx < 0) state.vx = Math.abs(state.vx);
    if (state.y > maxY - turnZone && state.vy > 0) state.vy = -Math.max(0.12, Math.abs(state.vy));
    if (state.y < -maxY + turnZone && state.vy < 0) state.vy = Math.max(0.12, Math.abs(state.vy));

    const turn = Math.sin(elapsed * 0.34 + placement.phase) * 0.12 * delta;
    const previousVx = state.vx;
    state.vx = previousVx * Math.cos(turn) - state.vy * Math.sin(turn);
    state.vy = previousVx * Math.sin(turn) + state.vy * Math.cos(turn);
    const currentSpeed = Math.hypot(state.vx, state.vy) || placement.speed;
    state.vx = (state.vx / currentSpeed) * placement.speed;
    state.vy = (state.vy / currentSpeed) * placement.speed;

    const proposedX = state.x + state.vx * delta;
    const walls = compartmentBounds.slice(1, -1).map((boundary) => boundary * maxX);
    const currentCompartment = walls.findIndex((wallX) => state.x < wallX);
    const currentIndex = currentCompartment === -1 ? 4 : currentCompartment;
    let blocked = false;

    if (state.vx > 0 && currentIndex < 4 && proposedX >= walls[currentIndex]) {
      const opening = wallOpening(progress, currentIndex);
      const holeCenterY = (1 - (wallHolePositions[currentIndex] / 50)) * maxY;
      const holeHalfHeight = maxY * 0.62 * opening;
      blocked = opening <= 0 || Math.abs(state.y - holeCenterY) > holeHalfHeight;
      if (blocked) state.x = walls[currentIndex] - 0.04;
    } else if (state.vx < 0 && currentIndex > 0 && proposedX <= walls[currentIndex - 1]) {
      const wallIndex = currentIndex - 1;
      const opening = wallOpening(progress, wallIndex);
      const holeCenterY = (1 - (wallHolePositions[wallIndex] / 50)) * maxY;
      const holeHalfHeight = maxY * 0.62 * opening;
      blocked = opening <= 0 || Math.abs(state.y - holeCenterY) > holeHalfHeight;
      if (blocked) state.x = walls[wallIndex] + 0.04;
    }

    if (blocked) {
      state.vx *= -1;
    } else {
      state.x = proposedX;
    }
    state.y += state.vy * delta;
    state.x = THREE.MathUtils.clamp(state.x, -maxX, maxX);
    state.y = THREE.MathUtils.clamp(state.y, -maxY, maxY);

    swimRef.current.position.x = state.x;
    swimRef.current.position.y = state.y;
    directionRef.current.rotation.y = THREE.MathUtils.damp(
      directionRef.current.rotation.y,
      state.vx >= 0 ? 0 : Math.PI,
      3.4,
      delta,
    );
    const slope = Math.atan2(state.vy, Math.max(0.08, Math.abs(state.vx)));
    const directedSlope = slope * (state.vx >= 0 ? 1 : -1);
    swimRef.current.rotation.z = THREE.MathUtils.damp(
      swimRef.current.rotation.z,
      THREE.MathUtils.clamp(directedSlope, -1.08, 1.08),
      2.8,
      delta,
    );
  });

  const startsFacingLeft = Math.cos(placement.heading) < 0;
  const formScale = collectiveFormScale[contribution.creatureForm];

  return (
    <group
      ref={swimRef}
      position={[0, 0, placement.z]}
    >
      <group ref={directionRef} rotation={[0, startsFacingLeft ? Math.PI : 0, 0]}>
        <AquaticCreatureModel form={contribution.creatureForm} pieces={contribution.parts} scale={placement.scale * formScale} />
      </group>
    </group>
  );
}

export function CollectiveCreatureField({ contributions, progress = 1 }: { contributions: ExhibitionContribution[]; progress?: number }) {
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
        <FloatingCreature key={contribution.id} contribution={contribution} progress={progress} />
      ))}
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
