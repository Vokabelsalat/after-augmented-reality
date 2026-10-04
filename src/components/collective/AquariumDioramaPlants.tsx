"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type PlantLayer = "back" | "front";
type PlantKind = "kelp" | "grass" | "anemone" | "waterweed";

type PlantSpec = {
  kind: PlantKind;
  side: -1 | 0 | 1;
  offset: number;
  height: number;
  color: string;
  phase: number;
  lean?: number;
};

const backPlants: PlantSpec[] = [
  { kind: "kelp", side: -1, offset: 0.12, height: 1.9, color: "#397b68", phase: 0.4 },
  { kind: "grass", side: -1, offset: 0.55, height: 1.15, color: "#4d806c", phase: 1.7 },
  { kind: "kelp", side: 1, offset: 0.18, height: 2.25, color: "#326f66", phase: 2.6 },
  { kind: "anemone", side: 1, offset: 0.78, height: 0.92, color: "#8b6389", phase: 3.8 },
  { kind: "grass", side: 0, offset: 0.2, height: 0.9, color: "#52745f", phase: 5.1 },
  { kind: "anemone", side: 0, offset: 0.73, height: 0.78, color: "#816772", phase: 1.1 },
];

const frontPlants: PlantSpec[] = [
  { kind: "waterweed", side: -1, offset: -0.16, height: 6.2, color: "#4f9a68", phase: 3.2, lean: -0.09 },
  { kind: "grass", side: -1, offset: 0.05, height: 1.45, color: "#5b9b79", phase: 2.1 },
  { kind: "anemone", side: -1, offset: 0.82, height: 1.02, color: "#b8738b", phase: 4.4 },
  { kind: "kelp", side: 1, offset: 0.04, height: 1.65, color: "#3e8d73", phase: 0.9 },
  { kind: "grass", side: 1, offset: 0.62, height: 1.1, color: "#6d986d", phase: 5.7 },
  { kind: "waterweed", side: 1, offset: -0.2, height: 7.15, color: "#43865f", phase: 5.05, lean: 0.1 },
];

function SwayingPlant({ spec, layer, x, floorY }: { spec: PlantSpec; layer: PlantLayer; x: number; floorY: number }) {
  const ref = useRef<THREE.Group>(null);
  const stems = spec.kind === "anemone" ? 7 : spec.kind === "grass" ? 5 : spec.kind === "waterweed" ? 6 : 3;
  const z = layer === "front" ? 2.45 : -2.25;
  const opacity = layer === "front" ? (spec.kind === "waterweed" ? 0.74 : 0.82) : 0.42;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const time = clock.elapsedTime;
    ref.current.rotation.z = (spec.lean ?? 0) + Math.sin(time * (spec.kind === "waterweed" ? 0.3 : 0.42) + spec.phase) * (spec.kind === "kelp" ? 0.075 : 0.045);
    ref.current.children.forEach((child, index) => {
      child.rotation.z = Math.sin(time * (0.56 + index * 0.035) + spec.phase + index * 0.72) * (0.07 + index * 0.008);
    });
  });

  return (
    <group ref={ref} position={[x, floorY, z]}>
      {Array.from({ length: stems }, (_, index) => {
        const spread = (index - (stems - 1) / 2) * (spec.kind === "anemone" ? 0.14 : spec.kind === "waterweed" ? 0.13 : 0.18);
        const stemHeight = spec.height * (0.72 + ((index * 37) % 28) / 100);
        const width = spec.kind === "kelp" ? 0.075 : spec.kind === "anemone" ? 0.045 : spec.kind === "waterweed" ? 0.028 : 0.035;
        return (
          <group key={index} position={[spread, 0, index * 0.012]} rotation={[0, 0, spread * -0.16]}>
            <mesh position={[0, stemHeight / 2, 0]} rotation={[0, 0, spread * 0.12]}>
              <capsuleGeometry args={[width, Math.max(0.08, stemHeight - width * 2), 5, 8]} />
              <meshToonMaterial color={spec.color} transparent opacity={opacity} />
            </mesh>
            {spec.kind === "kelp" && (
              <mesh position={[spread > 0 ? 0.13 : -0.13, stemHeight * 0.72, 0]} rotation={[0, 0, spread > 0 ? -0.7 : 0.7]} scale={[0.28, 0.1, 0.05]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshToonMaterial color={spec.color} transparent opacity={opacity * 0.9} />
              </mesh>
            )}
            {spec.kind === "anemone" && (
              <mesh position={[0, stemHeight, 0]} scale={0.07 + (index % 2) * 0.018}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshToonMaterial color="#ffb08f" transparent opacity={opacity} />
              </mesh>
            )}
            {spec.kind === "waterweed" && Array.from({ length: 7 }, (_, leafIndex) => {
              const leafY = stemHeight * (0.2 + leafIndex * 0.105);
              const leafSide = (leafIndex + index) % 2 === 0 ? -1 : 1;
              return (
                <group key={leafIndex} position={[0, leafY, 0]} rotation={[0, 0, leafSide * (0.82 + (leafIndex % 3) * 0.12)]}>
                  <mesh position={[leafSide * 0.095, 0.07, 0]} scale={[0.045, 0.19, 0.035]}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshToonMaterial color={spec.color} transparent opacity={opacity * 0.96} />
                  </mesh>
                  <mesh position={[-leafSide * 0.075, 0.11, -0.01]} rotation={[0, 0, -leafSide * 1.35]} scale={[0.04, 0.15, 0.03]}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshToonMaterial color={spec.color} transparent opacity={opacity * 0.88} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
      <mesh position={[0, 0.03, -0.04]} scale={[0.48, 0.12, 0.2]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshToonMaterial color={layer === "front" ? "#263f38" : "#19332f"} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

export function AquariumDioramaPlants({ layer }: { layer: PlantLayer }) {
  const viewport = useThree((state) => state.viewport);
  const specs = layer === "front" ? frontPlants : backPlants;
  const positions = useMemo(() => specs.map((spec) => {
    const inset = 0.35 + spec.offset * 1.45;
    if (spec.side === -1) return -viewport.width / 2 + inset;
    if (spec.side === 1) return viewport.width / 2 - inset;
    return -viewport.width * 0.28 + spec.offset * viewport.width * 0.56;
  }), [specs, viewport.width]);
  const floorY = -viewport.height / 2 + 0.03;

  return (
    <group>
      {specs.map((spec, index) => (
        <SwayingPlant key={`${layer}-${index}`} spec={spec} layer={layer} x={positions[index]} floorY={floorY} />
      ))}
    </group>
  );
}
