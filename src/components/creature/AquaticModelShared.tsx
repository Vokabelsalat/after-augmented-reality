"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { CreaturePiece } from "@/components/creature/CreatureModel";
import type { AquaticForm } from "@/lib/creature/aquaticForms";
import { creatureColorPalette } from "@/lib/creature/colorPalettes";
import type { CreaturePartId } from "@/types/exhibition";

export function aquaticPalette(pieces: CreaturePiece[], baseSeed?: string) {
  const signature = baseSeed ?? pieces[0]?.artifactId ?? "new";
  const palette = creatureColorPalette(signature);
  const base = new THREE.Color(palette.body);
  return {
    body: base.getStyle(),
    light: palette.belly,
    dark: palette.marking,
    accent: palette.fin,
  };
}

export function GrowingTrait({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const startedAt = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startedAt.current;
    const progress = Math.min(1, elapsed / 2.2);
    const eased = 1 - Math.pow(1 - progress, 3);
    const settle = progress < 1 ? Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.16 : 0;
    ref.current.scale.setScalar(Math.max(0.001, eased + settle));
    ref.current.rotation.z = (1 - eased) * -0.35;
  });

  return <group ref={ref} scale={active ? 0.001 : 1}>{children}</group>;
}

export function TraitMarks({
  pieces,
  form,
  highlightedPart,
  baseSeed,
}: {
  pieces: CreaturePiece[];
  form: Exclude<AquaticForm, "fish">;
  highlightedPart?: CreaturePartId;
  baseSeed?: string;
}) {
  const signature = baseSeed ?? pieces[0]?.artifactId ?? "new";
  const palette = creatureColorPalette(signature);
  const markColors = [palette.marking, palette.fin, palette.head, palette.belly];
  return pieces.map((piece, index) => {
    const angle = index * 2.39996 + (form === "whale" ? 0.55 : 0);
    const layouts: Record<Exclude<AquaticForm, "fish">, { x: number; y: number; cy: number; z: number }> = {
      crab: { x: 0.76, y: 0.38, cy: 0.08, z: 0.38 },
      jellyfish: { x: 0.68, y: 0.38, cy: 0.38, z: 0.42 },
      octopus: { x: 0.55, y: 0.56, cy: 0.42, z: 0.5 },
      turtle: { x: 0.82, y: 0.48, cy: 0, z: 0.48 },
      ray: { x: 0.86, y: 0.66, cy: 0, z: 0.34 },
      starfish: { x: 0.72, y: 0.72, cy: 0, z: 0.34 },
      seahorse: { x: 0.38, y: 0.78, cy: 0.08, z: 0.38 },
      seal: { x: 0.96, y: 0.42, cy: 0.02, z: 0.42 },
      shrimp: { x: 0.92, y: 0.34, cy: 0.08, z: 0.36 },
      narwhal: { x: 1.08, y: 0.38, cy: 0.02, z: 0.46 },
      dolphin: { x: 1.02, y: 0.34, cy: 0.02, z: 0.44 },
      whale: { x: 1.3, y: 0.48, cy: 0.02, z: 0.58 },
      clam: { x: 0.72, y: 0.42, cy: 0.04, z: 0.46 },
      pufferfish: { x: 0.84, y: 0.56, cy: 0, z: 0.65 },
    };
    const layout = layouts[form];
    const position: [number, number, number] = [
      Math.cos(angle) * layout.x,
      layout.cy + Math.sin(angle) * layout.y,
      layout.z,
    ];
    const highlighted = piece.partId === highlightedPart;
    const markerScale = (highlighted ? 0.19 : 0.12) + (index % 3) * 0.012;

    return (
      <group key={piece.artifactId} position={position} scale={markerScale}>
        <GrowingTrait active={highlighted}>
          <mesh>
            {index % 4 === 0 && <octahedronGeometry args={[1, 0]} />}
            {index % 4 === 1 && <sphereGeometry args={[0.9, 12, 10]} />}
            {index % 4 === 2 && <torusGeometry args={[0.62, 0.19, 8, 18]} />}
            {index % 4 === 3 && <boxGeometry args={[1.25, 0.72, 0.38]} />}
            <meshStandardMaterial
              color={markColors[index % markColors.length]}
              emissive={markColors[index % markColors.length]}
              emissiveIntensity={highlighted ? 1.1 : 0.3}
              roughness={0.44}
            />
          </mesh>
        </GrowingTrait>
      </group>
    );
  });
}
