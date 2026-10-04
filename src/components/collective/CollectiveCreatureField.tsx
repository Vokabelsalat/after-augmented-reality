"use client";

import { AdaptiveDpr } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { AquaticCreatureModel } from "@/components/creature/AquaticCreatureModel";
import { AquariumDioramaPlants } from "@/components/collective/AquariumDioramaPlants";
import { creatureSizeScale, type AquaticForm } from "@/lib/creature/aquaticForms";
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
  seal: 1.05,
  clam: 1.08,
  pufferfish: 1,
};

const collectiveFormSpeed: Record<AquaticForm, number> = {
  fish: 1.18,
  crab: 0.62,
  jellyfish: 0.68,
  octopus: 0.82,
  turtle: 0.58,
  ray: 1.05,
  starfish: 0.48,
  seahorse: 0.72,
  seal: 1.12,
  clam: 0.42,
  pufferfish: 1.08,
};

const depthHazeLayers = [
  { z: 1.18, color: "#123a3d", opacity: 0.045 },
  { z: 0.48, color: "#0d3038", opacity: 0.06 },
  { z: -0.22, color: "#092731", opacity: 0.075 },
  { z: -0.92, color: "#061f2b", opacity: 0.1 },
] as const;

function DepthHazeLayers() {
  const viewport = useThree((state) => state.viewport);

  return (
    <group>
      {depthHazeLayers.map((layer) => (
        <mesh key={layer.z} position={[0, 0, layer.z]}>
          <planeGeometry args={[viewport.width + 2, viewport.height + 2]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function wallOpening(progress: number, wallIndex: number) {
  return THREE.MathUtils.clamp(
    (progress - wallThresholds[wallIndex]) / 0.16,
    0,
    1,
  );
}

type CreatureMotion = {
  initialized: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

type PairingEvent = {
  parents: [ExhibitionContribution, ExhibitionContribution];
  startedAt: number;
  midpoint: [number, number, number];
  sequence: number;
  babyCreated: boolean;
};

type BabyCreature = {
  contribution: ExhibitionContribution;
  spawnPosition: [number, number, number];
};

type FloatingCreatureProps = {
  contribution: ExhibitionContribution;
  progress: number;
  actorRegistry?: MutableRefObject<Map<number, MutableRefObject<CreatureMotion>>>;
  pairingRef?: MutableRefObject<PairingEvent | null>;
  juvenile?: boolean;
  spawnPosition?: [number, number, number];
};

function FloatingCreature({
  contribution,
  progress,
  actorRegistry,
  pairingRef,
  juvenile = false,
  spawnPosition,
}: FloatingCreatureProps) {
  const swimRef = useRef<THREE.Group>(null);
  const directionRef = useRef<THREE.Group>(null);
  const floorOffsetRef = useRef<number | null>(null);
  const isBottomDweller = contribution.creatureForm === "crab" || contribution.creatureForm === "clam";
  const formSpeed = collectiveFormSpeed[contribution.creatureForm];
  const placement = useMemo(() => ({
    xUnit: -0.84 + seededUnit(contribution.id * 3) * 1.68,
    yUnit: -0.84 + seededUnit(contribution.id * 5) * 1.68,
    z: -1 + seededUnit(contribution.id * 7) * 2,
    depthSpeed: (0.07 + seededUnit(contribution.id * 11) * 0.17) * formSpeed,
    depthDirection: seededUnit(contribution.id * 23) > 0.5 ? 1 : -1,
    scale: 0.4,
    speed: (0.24 + seededUnit(contribution.id * 13) * 0.5) * formSpeed,
    phase: seededUnit(contribution.id * 17) * Math.PI * 2,
    heading: seededUnit(contribution.id * 19) * Math.PI * 2,
  }), [contribution.id, formSpeed]);
  const motion = useRef<CreatureMotion>({
    initialized: false,
    x: 0,
    y: 0,
    z: placement.z,
    vx: Math.cos(placement.heading) * placement.speed,
    vy: isBottomDweller ? 0 : Math.sin(placement.heading) * placement.speed,
    vz: placement.depthDirection * placement.depthSpeed,
  });
  const spawnCompartment = Math.abs(contribution.id) % 5;
  const previousProgress = useRef(progress);

  useEffect(() => {
    if (juvenile || !actorRegistry) return;
    actorRegistry.current.set(contribution.id, motion);
    return () => {
      actorRegistry.current.delete(contribution.id);
    };
  }, [actorRegistry, contribution.id, juvenile]);

  useFrame(({ clock, viewport }, delta) => {
    if (!swimRef.current || !directionRef.current) return;
    const elapsed = clock.elapsedTime;
    const state = motion.current;
    const maxX = Math.max(1.6, viewport.width / 2 - 0.9);
    const maxY = Math.max(1.25, viewport.height / 2 - 0.72);
    const aquariumFloorY = -viewport.height / 2;
    const backDepth = -1.45;
    const frontDepth = 1.65;
    if (isBottomDweller && floorOffsetRef.current === null) {
      const bounds = new THREE.Box3().setFromObject(directionRef.current);
      floorOffsetRef.current = Number.isFinite(bounds.min.y) ? -bounds.min.y + 0.04 : 0.42;
    }
    const floorY = aquariumFloorY + (floorOffsetRef.current ?? 0.42);
    const spawnMinX = compartmentBounds[spawnCompartment] * maxX;
    const spawnMaxX = compartmentBounds[spawnCompartment + 1] * maxX;
    const spawnCenterX = (spawnMinX + spawnMaxX) / 2;
    const turnZone = 0.48;

    if (!state.initialized || progress < previousProgress.current - 0.025) {
      state.x = spawnPosition?.[0] ?? spawnCenterX + placement.xUnit * (spawnMaxX - spawnMinX) * 0.34;
      state.y = isBottomDweller ? floorY : spawnPosition?.[1] ?? placement.yUnit * maxY;
      state.z = spawnPosition?.[2] ?? placement.z;
      state.initialized = true;
    }
    previousProgress.current = progress;

    if (state.x > maxX - turnZone && state.vx > 0) state.vx = -Math.abs(state.vx);
    if (state.x < -maxX + turnZone && state.vx < 0) state.vx = Math.abs(state.vx);
    if (!isBottomDweller) {
      if (state.y > maxY - turnZone && state.vy > 0) state.vy = -Math.max(0.12, Math.abs(state.vy));
      if (state.y < -maxY + turnZone && state.vy < 0) state.vy = Math.max(0.12, Math.abs(state.vy));
    }

    const turn = isBottomDweller ? 0 : Math.sin(elapsed * 0.34 + placement.phase) * 0.12 * delta;
    const previousVx = state.vx;
    state.vx = previousVx * Math.cos(turn) - state.vy * Math.sin(turn);
    state.vy = isBottomDweller ? 0 : previousVx * Math.sin(turn) + state.vy * Math.cos(turn);
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
    state.y = isBottomDweller ? floorY : state.y + state.vy * delta;
    state.z += state.vz * delta;
    if (state.z >= frontDepth) {
      state.z = frontDepth;
      state.vz = -Math.abs(state.vz);
    } else if (state.z <= backDepth) {
      state.z = backDepth;
      state.vz = Math.abs(state.vz);
    }
    state.x = THREE.MathUtils.clamp(state.x, -maxX, maxX);
    state.y = THREE.MathUtils.clamp(state.y, -maxY, maxY);

    const pairing = pairingRef?.current;
    const participantIndex = pairing?.parents.findIndex((parent) => parent.id === contribution.id) ?? -1;
    if (pairing && participantIndex >= 0) {
      const age = elapsed - pairing.startedAt;
      const side = participantIndex === 0 ? -1 : 1;
      let targetX = pairing.midpoint[0] + side * 0.34;
      let targetY = pairing.midpoint[1];
      let targetZ = pairing.midpoint[2];

      if (age >= 4) {
        const orbitAge = age - 4;
        const radius = age < 7 ? 0.34 : 0.34 + (age - 7) * 0.24;
        const angle = orbitAge * 1.75 + (participantIndex === 0 ? 0 : Math.PI);
        targetX = pairing.midpoint[0] + Math.cos(angle) * radius;
        targetZ = pairing.midpoint[2] + Math.sin(angle) * radius * 0.72;
        if (!isBottomDweller) targetY = pairing.midpoint[1] + Math.sin(angle * 0.7) * 0.16;
      }

      const previousX = state.x;
      const previousY = state.y;
      const previousZ = state.z;
      const follow = 1 - Math.exp(-(age < 4 ? 1.35 : 3.2) * delta);
      state.x = THREE.MathUtils.lerp(state.x, targetX, follow);
      state.y = isBottomDweller ? floorY : THREE.MathUtils.lerp(state.y, targetY, follow);
      state.z = THREE.MathUtils.lerp(state.z, targetZ, follow);
      state.vx = (state.x - previousX) / Math.max(delta, 0.001);
      state.vy = isBottomDweller ? 0 : (state.y - previousY) / Math.max(delta, 0.001);
      state.vz = (state.z - previousZ) / Math.max(delta, 0.001);
    }

    swimRef.current.position.x = state.x;
    swimRef.current.position.y = state.y;
    swimRef.current.position.z = state.z;
    const depthProgress = THREE.MathUtils.inverseLerp(backDepth, frontDepth, state.z);
    const depthScale = THREE.MathUtils.lerp(0.72, 1.24, THREE.MathUtils.smoothstep(depthProgress, 0, 1));
    swimRef.current.scale.setScalar(depthScale);
    const sideHeading = state.vx >= 0 ? 0 : Math.PI;
    const fullDepthHeading = Math.atan2(-state.vz, state.vx);
    const depthTurn = THREE.MathUtils.clamp(
      THREE.MathUtils.euclideanModulo(fullDepthHeading - sideHeading + Math.PI, Math.PI * 2) - Math.PI,
      -0.3,
      0.3,
    );
    const depthHeading = sideHeading + depthTurn;
    const headingDelta = THREE.MathUtils.euclideanModulo(
      depthHeading - directionRef.current.rotation.y + Math.PI,
      Math.PI * 2,
    ) - Math.PI;
    directionRef.current.rotation.y += headingDelta * (1 - Math.exp(-3.4 * delta));
    const slope = isBottomDweller ? 0 : Math.atan2(state.vy, Math.max(0.08, Math.abs(state.vx)));
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
  const individualScale = creatureSizeScale(contribution.publicId) * (juvenile ? 0.48 : 1);

  return (
    <group
      ref={swimRef}
      position={[0, 0, placement.z]}
    >
      <group ref={directionRef} rotation={[0, startsFacingLeft ? Math.PI : 0, 0]}>
        <AquaticCreatureModel
          form={contribution.creatureForm}
          pieces={contribution.parts}
          scale={placement.scale * formScale * individualScale}
          animated
          grounded={isBottomDweller}
        />
      </group>
    </group>
  );
}

function PairingDirector({
  contributions,
  actorRegistry,
  pairingRef,
  onBaby,
}: {
  contributions: ExhibitionContribution[];
  actorRegistry: MutableRefObject<Map<number, MutableRefObject<CreatureMotion>>>;
  pairingRef: MutableRefObject<PairingEvent | null>;
  onBaby: (event: PairingEvent) => void;
}) {
  const lastPairAt = useRef(0);
  const sequence = useRef(0);
  const eligiblePairs = useMemo(() => {
    const byForm = new Map<AquaticForm, ExhibitionContribution[]>();
    contributions.forEach((contribution) => {
      const group = byForm.get(contribution.creatureForm) ?? [];
      group.push(contribution);
      byForm.set(contribution.creatureForm, group);
    });
    return [...byForm.values()].filter((group) => group.length >= 2);
  }, [contributions]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const activePairing = pairingRef.current;

    if (activePairing) {
      const age = elapsed - activePairing.startedAt;
      if (age >= 6.6 && !activePairing.babyCreated) {
        activePairing.babyCreated = true;
        onBaby(activePairing);
      }
      if (age >= 8.5) {
        pairingRef.current = null;
        lastPairAt.current = elapsed;
      }
      return;
    }

    if (elapsed - lastPairAt.current < 12 || eligiblePairs.length === 0) return;
    const group = eligiblePairs[sequence.current % eligiblePairs.length];
    const firstIndex = sequence.current % group.length;
    const first = group[firstIndex];
    const second = group[(firstIndex + 1) % group.length];
    const firstMotion = actorRegistry.current.get(first.id)?.current;
    const secondMotion = actorRegistry.current.get(second.id)?.current;
    if (!firstMotion?.initialized || !secondMotion?.initialized) return;

    pairingRef.current = {
      parents: [first, second],
      startedAt: elapsed,
      midpoint: [
        (firstMotion.x + secondMotion.x) / 2,
        (firstMotion.y + secondMotion.y) / 2,
        (firstMotion.z + secondMotion.z) / 2,
      ],
      sequence: sequence.current,
      babyCreated: false,
    };
    sequence.current += 1;
  });

  return null;
}

function createBaby(event: PairingEvent): BabyCreature {
  const [first, second] = event.parents;
  const inheritedParts = first.parts.map((part, index) => {
    if (index % 2 === 0) return part;
    return second.parts.find((candidate) => candidate.partId === part.partId) ?? second.parts[index % second.parts.length] ?? part;
  });
  const id = 1_000_000 + event.sequence;

  return {
    contribution: {
      id,
      publicId: `offspring-${first.publicId}-${second.publicId}-${event.sequence}`,
      creatureForm: first.creatureForm,
      parts: inheritedParts,
      narrative: [],
      createdAt: new Date().toISOString(),
    },
    spawnPosition: event.midpoint,
  };
}

export function CollectiveCreatureField({ contributions, progress = 1 }: { contributions: ExhibitionContribution[]; progress?: number }) {
  const [babies, setBabies] = useState<BabyCreature[]>([]);
  const actorRegistry = useRef(new Map<number, MutableRefObject<CreatureMotion>>());
  const pairingRef = useRef<PairingEvent | null>(null);
  const adults = useMemo(() => contributions.slice(-32), [contributions]);
  const handleBaby = useCallback((event: PairingEvent) => {
    setBabies((current) => [...current, createBaby(event)].slice(-8));
  }, []);

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
      <AquariumDioramaPlants layer="back" />
      <PairingDirector
        contributions={adults}
        actorRegistry={actorRegistry}
        pairingRef={pairingRef}
        onBaby={handleBaby}
      />
      {adults.map((contribution) => (
        <FloatingCreature
          key={contribution.id}
          contribution={contribution}
          progress={progress}
          actorRegistry={actorRegistry}
          pairingRef={pairingRef}
        />
      ))}
      {babies.map((baby) => (
        <FloatingCreature
          key={baby.contribution.id}
          contribution={baby.contribution}
          progress={progress}
          juvenile
          spawnPosition={baby.spawnPosition}
        />
      ))}
      <DepthHazeLayers />
      <AquariumDioramaPlants layer="front" />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
