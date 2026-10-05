"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

function TraitMaterial({ color, highlighted, opacity = 1 }: { color: string; highlighted: boolean; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={highlighted ? 0.85 : 0.24}
      roughness={0.38}
      transparent={opacity < 1}
      opacity={opacity}
      side={THREE.DoubleSide}
    />
  );
}

function AquaticTraitGrowth({
  partId,
  color,
  rootColor,
  highlighted,
}: {
  partId: CreaturePartId;
  color: string;
  rootColor: string;
  highlighted: boolean;
}) {
  return (
    <group>
      <mesh name={`${partId} root`} position={[0, 0, 0.035]} scale={[0.62, 0.44, 0.18]}>
        <sphereGeometry args={[0.52, 18, 14]} />
        <TraitMaterial color={rootColor} highlighted={highlighted} />
      </mesh>

      {partId === "memory-crown" && [-0.42, 0, 0.42].map((x, index) => (
        <mesh key={x} position={[x, 0.28 + (index % 2) * 0.14, 0.2]} scale={[0.72, 1 + (index % 2) * 0.22, 0.72]}>
          <coneGeometry args={[0.2, 0.68, 10]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      ))}

      {partId === "archive-ears" && [-1, 1].map((direction) => (
        <group key={direction} position={[direction * 0.25, 0.08, 0.2]} rotation={[0, 0, direction * -0.45]}>
          {[0, 1, 2].map((index) => (
            <mesh key={index} position={[direction * index * 0.14, index * 0.14, index * 0.04]} scale={[0.2, 0.42 - index * 0.055, 0.1]}>
              <sphereGeometry args={[1, 16, 12]} />
              <TraitMaterial color={color} highlighted={highlighted} />
            </mesh>
          ))}
        </group>
      ))}

      {partId === "route-tail" && [-0.22, 0, 0.22].map((y, index) => (
        <mesh key={y} position={[-0.38 - index * 0.08, y, 0.22]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1 + index * 0.15, 1]}>
          <capsuleGeometry args={[0.075, 0.62, 6, 12]} />
          <TraitMaterial color={color} highlighted={highlighted} opacity={0.82} />
        </mesh>
      ))}

      {partId === "signal-antenna" && (
        <>
          <mesh position={[0, 0.35, 0.18]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.035, 0.07, 0.72, 10]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
          <mesh position={[0.05, 0.76, 0.2]}>
            <sphereGeometry args={[0.16, 18, 14]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
        </>
      )}

      {partId === "cockatoo-beak" && (
        <mesh position={[0.35, 0, 0.19]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1.15, 0.82]}>
          <coneGeometry args={[0.25, 0.72, 12]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      )}

      {partId === "glass-wings" && [-1, 1].map((direction) => (
        <mesh key={direction} position={[-0.12, direction * 0.25, 0.24]} rotation={[0.1, 0, direction * -0.72]} scale={[0.32, 0.72, 0.12]}>
          <sphereGeometry args={[1, 20, 16]} />
          <TraitMaterial color={color} highlighted={highlighted} opacity={0.58} />
        </mesh>
      ))}

      {partId === "page-fins" && [-0.34, 0, 0.34].map((x, index) => (
        <mesh key={x} position={[x, 0.28 + index * 0.06, 0.18]} rotation={[0, 0, -0.1 + index * 0.1]} scale={[0.72, 1 - index * 0.08, 0.72]}>
          <coneGeometry args={[0.19, 0.58, 8]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      ))}

      {partId === "surfer-feet" && [-1, 1].map((direction) => (
        <mesh key={direction} position={[direction * 0.22, -0.16, 0.22]} rotation={[0, 0, Math.PI / 2 + direction * 0.12]} scale={[1, 1.15, 0.72]}>
          <capsuleGeometry args={[0.12, 0.58, 6, 14]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      ))}

      {partId === "inner-eye" && (
        <>
          <mesh position={[0, 0, 0.24]} scale={[1.3, 0.82, 0.34]}>
            <sphereGeometry args={[0.28, 20, 16]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
          <mesh position={[0.03, 0, 0.34]}>
            <sphereGeometry args={[0.095, 16, 12]} />
            <meshBasicMaterial color="#071015" />
          </mesh>
        </>
      )}

      {partId === "orbit-ring" && (
        <group position={[0, 0, 0.28]}>
          <mesh rotation={[0.12, 0.18, 0]} scale={[1.05, 0.72, 1]}>
            <torusGeometry args={[0.38, 0.065, 10, 32]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
          <mesh position={[0.38, 0.1, 0.05]}>
            <sphereGeometry args={[0.11, 14, 12]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
        </group>
      )}

      {partId === "heart-plume" && (
        <group position={[0, 0.08, 0.22]}>
          <mesh position={[-0.14, 0.14, 0]}><sphereGeometry args={[0.22, 18, 14]} /><TraitMaterial color={color} highlighted={highlighted} /></mesh>
          <mesh position={[0.14, 0.14, 0]}><sphereGeometry args={[0.22, 18, 14]} /><TraitMaterial color={color} highlighted={highlighted} /></mesh>
          <mesh position={[0, -0.13, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1.28, 0.8]}>
            <coneGeometry args={[0.3, 0.58, 8]} />
            <TraitMaterial color={color} highlighted={highlighted} />
          </mesh>
        </group>
      )}

      {partId === "helping-arms" && [-1, 1].map((direction) => (
        <mesh key={direction} position={[direction * 0.2, -0.18, 0.2]} rotation={[0, 0, Math.PI / 2 + direction * 0.34]}>
          <capsuleGeometry args={[0.09, 0.72, 7, 14]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      ))}

      {partId === "goliath-horns" && [-0.28, 0.28].map((x, index) => (
        <mesh key={x} position={[x, 0.35, 0.19]} rotation={[0, 0, index === 0 ? 0.22 : -0.22]} scale={[1, 1.12, 0.9]}>
          <coneGeometry args={[0.16, 0.72, 10]} />
          <TraitMaterial color={color} highlighted={highlighted} />
        </mesh>
      ))}
    </group>
  );
}

const traitMarksTag = "aquaticTraitMarks";
const skinInset = 0.015;

function isInsideTraitMarks(object: THREE.Object3D) {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    if (node.userData[traitMarksTag]) return true;
  }
  return false;
}

// Casts a ray along the local z axis of `body` and returns the first skin hit in body-local coordinates.
function skinDepth(body: THREE.Object3D, x: number, y: number, side: 1 | -1, raycaster: THREE.Raycaster) {
  const origin = body.localToWorld(new THREE.Vector3(x, y, side * 20));
  const target = body.localToWorld(new THREE.Vector3(x, y, 0));
  raycaster.set(origin, target.sub(origin).normalize());
  const hit = raycaster
    .intersectObjects(body.children, true)
    .find((intersection) => intersection.object.visible && !isInsideTraitMarks(intersection.object));
  return hit ? body.worldToLocal(hit.point.clone()).z : null;
}

type TraitPlacement = { x: number; y: number; front: number; back: number };

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
  const groupRef = useRef<THREE.Group>(null);
  const [placements, setPlacements] = useState<Record<string, TraitPlacement>>({});
  const signature = baseSeed ?? pieces[0]?.artifactId ?? "new";
  const palette = creatureColorPalette(signature);
  const partAnchors: Record<CreaturePartId, [number, number]> = {
    "memory-crown": [-0.42, 0.68],
    "archive-ears": [0.62, 0.3],
    "route-tail": [-0.88, 0],
    "signal-antenna": [0.3, 0.74],
    "cockatoo-beak": [0.9, -0.04],
    "glass-wings": [-0.04, -0.24],
    "page-fins": [-0.16, 0.78],
    "surfer-feet": [-0.3, -0.68],
    "inner-eye": [0.7, 0.12],
    "orbit-ring": [-0.12, 0.14],
    "heart-plume": [0.12, -0.04],
    "helping-arms": [0.46, -0.54],
    "goliath-horns": [0.58, 0.62],
  };
  const largePartIds = new Set<CreaturePartId>([
    "memory-crown",
    "route-tail",
    "signal-antenna",
    "glass-wings",
    "page-fins",
    "helping-arms",
    "goliath-horns",
  ]);
  const layouts: Record<Exclude<AquaticForm, "fish">, { x: number; y: number; cx: number; cy: number; z: number; scale: number; vertical?: boolean }> = {
    crab: { x: 0.92, y: 0.48, cx: 0, cy: 0.08, z: 0.34, scale: 0.46 },
    jellyfish: { x: 0.78, y: 0.48, cx: 0, cy: 0.42, z: 0.5, scale: 0.44 },
    octopus: { x: 0.66, y: 0.68, cx: 0, cy: 0.36, z: 0.46, scale: 0.44 },
    turtle: { x: 1.08, y: 0.54, cx: 0.04, cy: 0, z: 0.36, scale: 0.48 },
    ray: { x: 1.14, y: 0.82, cx: 0.18, cy: 0, z: 0.24, scale: 0.46 },
    starfish: { x: 0.84, y: 0.84, cx: 0, cy: 0, z: 0.24, scale: 0.4 },
    seahorse: { x: 0.48, y: 1.06, cx: 0, cy: 0.02, z: 0.3, scale: 0.38, vertical: true },
    seal: { x: 1.16, y: 0.48, cx: 0, cy: 0.02, z: 0.35, scale: 0.48 },
    shrimp: { x: 1.08, y: 0.4, cx: 0, cy: 0.08, z: 0.28, scale: 0.4 },
    narwhal: { x: 1.34, y: 0.46, cx: 0, cy: 0.02, z: 0.46, scale: 0.48 },
    dolphin: { x: 1.18, y: 0.43, cx: 0, cy: 0.02, z: 0.26, scale: 0.5 },
    whale: { x: 1.56, y: 0.56, cx: 0, cy: 0.02, z: 0.3, scale: 0.56 },
    clam: { x: 0.86, y: 0.48, cx: 0, cy: 0.04, z: 0.3, scale: 0.42 },
    pufferfish: { x: 0.94, y: 0.68, cx: 0, cy: 0, z: 0.6, scale: 0.46 },
  };
  const layout = layouts[form];
  const anchorFor = (partId: CreaturePartId): [number, number] => {
    const [anchorX, anchorY] = partAnchors[partId];
    return [
      layout.cx + (layout.vertical ? anchorY * layout.x : anchorX * layout.x),
      layout.cy + (layout.vertical ? anchorX * layout.y : anchorY * layout.y),
    ];
  };
  const placementKey = `${form}:${pieces.map((piece) => `${piece.artifactId}/${piece.partId}`).join(",")}`;

  // Measure where the creature's skin actually is, so traits sit on it instead of at a fixed depth.
  useLayoutEffect(() => {
    const body = groupRef.current?.parent;
    if (!body) return;
    body.updateWorldMatrix(true, true);
    const raycaster = new THREE.Raycaster();
    const next: Record<string, TraitPlacement> = {};
    for (const piece of pieces) {
      const [anchorX, anchorY] = anchorFor(piece.partId);
      // If the anchor misses the body, slide it toward the body centre until it lands on skin.
      for (let step = 0; step <= 10; step += 1) {
        const t = step / 10;
        const x = anchorX + (layout.cx - anchorX) * t;
        const y = anchorY + (layout.cy - anchorY) * t;
        const front = skinDepth(body, x, y, 1, raycaster);
        const back = skinDepth(body, x, y, -1, raycaster);
        if (front !== null && back !== null) {
          next[piece.artifactId] = { x, y, front: front - skinInset, back: back + skinInset };
          break;
        }
      }
    }
    setPlacements(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementKey]);

  return (
    <group ref={groupRef} userData={{ [traitMarksTag]: true }}>
      {pieces.map((piece, index) => {
        const [anchorX, anchorY] = anchorFor(piece.partId);
        const placement = placements[piece.artifactId] ?? { x: anchorX, y: anchorY, front: layout.z, back: -layout.z };
        const highlighted = piece.partId === highlightedPart;
        const markerScale = layout.scale * (largePartIds.has(piece.partId) ? 1.12 : 0.92) * (highlighted ? 1.18 : 1);
        const color = piece.color || [palette.marking, palette.fin, palette.head, palette.belly][index % 4];

        return (
          <group key={piece.artifactId} position={[placement.x, placement.y, 0]}>
            {([1, -1] as const).map((side) => (
              <group key={side} position={[0, 0, side > 0 ? placement.front : placement.back]} scale={[1, 1, side]}>
                <GrowingTrait active={highlighted}>
                  <group scale={markerScale}>
                    <AquaticTraitGrowth
                      partId={piece.partId}
                      color={color}
                      rootColor={palette.marking}
                      highlighted={highlighted}
                    />
                  </group>
                </GrowingTrait>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
