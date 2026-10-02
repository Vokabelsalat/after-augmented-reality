"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CreatureModel, type CreaturePiece } from "@/components/creature/CreatureModel";
import type { AquaticForm } from "@/lib/creature/aquaticForms";
import type { CreaturePartId } from "@/types/exhibition";

function palette(pieces: CreaturePiece[]) {
  const base = new THREE.Color(pieces[0]?.color ?? "#3E9299");
  const accent = new THREE.Color(pieces.at(-1)?.color ?? "#E2A53A");
  return {
    body: base.getStyle(),
    light: base.clone().lerp(new THREE.Color("#E7F4E9"), 0.38).getStyle(),
    dark: base.clone().lerp(new THREE.Color("#07141C"), 0.42).getStyle(),
    accent: accent.getStyle(),
  };
}

function TraitMarks({
  pieces,
  form,
  highlightedPart,
}: {
  pieces: CreaturePiece[];
  form: Exclude<AquaticForm, "fish">;
  highlightedPart?: CreaturePartId;
}) {
  return pieces.map((piece, index) => {
    const angle = index * 2.39996;
    const positions: Record<Exclude<AquaticForm, "fish">, [number, number, number]> = {
      crab: [Math.cos(angle) * 0.76, Math.sin(angle) * 0.38 + 0.08, 0.38],
      jellyfish: [Math.cos(angle) * 0.68, 0.38 + Math.sin(angle) * 0.38, 0.42],
      octopus: [Math.cos(angle) * 0.55, 0.42 + Math.sin(angle) * 0.56, 0.5],
    };
    const highlighted = piece.partId === highlightedPart;
    const markerScale = (highlighted ? 0.19 : 0.12) + (index % 3) * 0.012;

    return (
      <group key={piece.artifactId} position={positions[form]} scale={markerScale}>
        <mesh>
          {index % 4 === 0 && <octahedronGeometry args={[1, 0]} />}
          {index % 4 === 1 && <sphereGeometry args={[0.9, 12, 10]} />}
          {index % 4 === 2 && <torusGeometry args={[0.62, 0.19, 8, 18]} />}
          {index % 4 === 3 && <boxGeometry args={[1.25, 0.72, 0.38]} />}
          <meshStandardMaterial
            color={piece.color}
            emissive={piece.color}
            emissiveIntensity={highlighted ? 1.1 : 0.3}
            roughness={0.44}
          />
        </mesh>
      </group>
    );
  });
}

function CrabModel({
  pieces,
  animated,
  highlightedPart,
  scale,
}: AquaticModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftClaw = useRef<THREE.Group>(null);
  const rightClaw = useRef<THREE.Group>(null);
  const colors = palette(pieces);

  useFrame(({ clock }) => {
    if (animated === false || !groupRef.current) return;
    const wave = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(wave * 1.3) * 0.045;
    groupRef.current.rotation.z = Math.sin(wave * 0.8) * 0.025;
    if (leftClaw.current) leftClaw.current.rotation.z = 0.35 + Math.sin(wave * 1.7) * 0.14;
    if (rightClaw.current) rightClaw.current.rotation.z = -0.35 - Math.sin(wave * 1.7 + 0.8) * 0.14;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh scale={[1.28, 0.68, 0.42]}>
        <sphereGeometry args={[0.82, 28, 20]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <mesh position={[0, -0.24, 0.3]} scale={[1.02, 0.34, 0.12]}>
        <sphereGeometry args={[0.78, 20, 14]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`eye-${side}`} position={[side * 0.44, 0.57, 0.22]}>
          <mesh scale={[0.08, 0.26, 0.08]}>
            <cylinderGeometry args={[1, 1, 1, 10]} />
            <meshToonMaterial color={colors.dark} />
          </mesh>
          <mesh position={[0, 0.2, 0]} scale={0.13}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshToonMaterial color="#F3F0E8" />
          </mesh>
          <mesh position={[0, 0.21, 0.11]} scale={0.052}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#071015" />
          </mesh>
        </group>
      ))}
      {[-1, 1].flatMap((side) => [0, 1, 2].map((leg) => (
        <group key={`leg-${side}-${leg}`} position={[side * (0.72 + leg * 0.09), 0.08 - leg * 0.22, 0]} rotation={[0, 0, side * (0.72 + leg * 0.17)]}>
          <mesh position={[0, -0.34, 0]} scale={[0.075, 0.46, 0.075]}>
            <cylinderGeometry args={[1, 0.78, 1, 8]} />
            <meshToonMaterial color={colors.dark} />
          </mesh>
          <mesh position={[side * 0.11, -0.72, 0]} rotation={[0, 0, side * 0.42]} scale={[0.06, 0.38, 0.06]}>
            <cylinderGeometry args={[1, 0.7, 1, 8]} />
            <meshToonMaterial color={colors.body} />
          </mesh>
        </group>
      )))}
      {[-1, 1].map((side) => (
        <group
          key={`claw-${side}`}
          ref={side < 0 ? leftClaw : rightClaw}
          position={[side * 1.14, 0.34, 0]}
          rotation={[0, 0, side * -0.35]}
        >
          <mesh position={[side * 0.2, 0.16, 0]} rotation={[0, 0, side * -0.52]} scale={[0.1, 0.42, 0.1]}>
            <cylinderGeometry args={[1, 0.74, 1, 8]} />
            <meshToonMaterial color={colors.body} />
          </mesh>
          <mesh position={[side * 0.34, 0.47, 0]} scale={[0.34, 0.24, 0.18]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshToonMaterial color={colors.accent} />
          </mesh>
          <mesh position={[side * 0.49, 0.56, 0]} rotation={[0, 0, side * -0.5]} scale={[0.18, 0.07, 0.08]}>
            <coneGeometry args={[1, 1, 10]} />
            <meshToonMaterial color={colors.accent} />
          </mesh>
        </group>
      ))}
      <TraitMarks pieces={pieces} form="crab" highlightedPart={highlightedPart} />
    </group>
  );
}

function makeTentacleCurve(index: number, spread = 1) {
  const x = (index - 3) * 0.2 * spread;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(x * 0.55, -0.22, 0),
    new THREE.Vector3(x, -0.78, Math.sin(index) * 0.08),
    new THREE.Vector3(x * 0.68 + Math.sin(index * 1.7) * 0.2, -1.42, 0),
    new THREE.Vector3(x + Math.cos(index) * 0.18, -2.02 + (index % 2) * 0.18, 0),
  ]);
}

function JellyfishModel({
  pieces,
  animated,
  highlightedPart,
  scale,
}: AquaticModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = palette(pieces);
  const curves = useMemo(() => Array.from({ length: 7 }, (_, index) => makeTentacleCurve(index)), []);

  useFrame(({ clock }) => {
    if (animated === false || !groupRef.current) return;
    const pulse = Math.sin(clock.elapsedTime * 1.65);
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.86) * 0.09;
    groupRef.current.scale.set(scale * (1 + pulse * 0.025), scale * (1 - pulse * 0.035), scale);
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.56) * 0.055;
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, 0.48, 0]}>
      <mesh scale={[1.05, 0.92, 0.64]}>
        <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshToonMaterial color={colors.body} transparent opacity={0.76} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.05, 0]} scale={[1.02, 0.18, 0.62]}>
        <sphereGeometry args={[1, 28, 12]} />
        <meshToonMaterial color={colors.light} transparent opacity={0.62} depthWrite={false} />
      </mesh>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 22, index % 2 ? 0.035 : 0.052, 7, false]} />
          <meshToonMaterial color={index % 3 === 0 ? colors.accent : colors.body} transparent opacity={0.68} />
        </mesh>
      ))}
      <TraitMarks pieces={pieces} form="jellyfish" highlightedPart={highlightedPart} />
    </group>
  );
}

function makeOctopusArm(index: number) {
  const angle = (index / 8) * Math.PI * 2;
  const direction = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(direction.x * 0.28, -0.38 + direction.y * 0.12, 0),
    new THREE.Vector3(direction.x * 0.72, -0.78 + direction.y * 0.3, -0.05),
    new THREE.Vector3(direction.x * 1.05 + Math.sin(index) * 0.12, -1.16 + direction.y * 0.38, 0),
    new THREE.Vector3(direction.x * 1.28 + Math.cos(index) * 0.2, -1.42 + direction.y * 0.34, 0.06),
  ]);
}

function OctopusModel({
  pieces,
  animated,
  highlightedPart,
  scale,
}: AquaticModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = palette(pieces);
  const arms = useMemo(() => Array.from({ length: 8 }, (_, index) => makeOctopusArm(index)), []);

  useFrame(({ clock }) => {
    if (animated === false || !groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 1.05) * 0.065;
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.72) * 0.04;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.42) * 0.12;
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, 0.38, 0]}>
      {arms.map((curve, index) => (
        <mesh key={index} rotation={[0, 0, Math.sin(index * 2.1) * 0.08]}>
          <tubeGeometry args={[curve, 24, 0.085 - index * 0.003, 8, false]} />
          <meshToonMaterial color={index % 3 === 0 ? colors.accent : colors.dark} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]} scale={[0.78, 0.94, 0.58]}>
        <sphereGeometry args={[0.9, 30, 24]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <mesh position={[0, -0.34, 0.02]} scale={[0.94, 0.52, 0.62]}>
        <sphereGeometry args={[0.82, 28, 20]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.28, 0.2, 0.5]}>
          <mesh scale={[0.15, 0.2, 0.1]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshToonMaterial color="#F3F0E8" />
          </mesh>
          <mesh position={[0, -0.01, 0.09]} scale={[0.055, 0.1, 0.04]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#071015" />
          </mesh>
        </group>
      ))}
      <TraitMarks pieces={pieces} form="octopus" highlightedPart={highlightedPart} />
    </group>
  );
}

type AquaticModelProps = {
  pieces: CreaturePiece[];
  animated?: boolean;
  highlightedPart?: CreaturePartId;
  scale: number;
};

export function AquaticCreatureModel({
  form,
  pieces,
  animated = true,
  highlightedPart,
  scale = 1,
}: AquaticModelProps & { form: AquaticForm }) {
  if (form === "crab") {
    return <CrabModel pieces={pieces} animated={animated} highlightedPart={highlightedPart} scale={scale} />;
  }
  if (form === "jellyfish") {
    return <JellyfishModel pieces={pieces} animated={animated} highlightedPart={highlightedPart} scale={scale} />;
  }
  if (form === "octopus") {
    return <OctopusModel pieces={pieces} animated={animated} highlightedPart={highlightedPart} scale={scale} />;
  }
  return <CreatureModel pieces={pieces} animated={animated} highlightedPart={highlightedPart} scale={scale} />;
}
