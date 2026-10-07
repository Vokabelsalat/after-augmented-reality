"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { CreaturePiece } from "@/components/creature/CreatureModel";
import type { AquaticForm } from "@/lib/creature/aquaticForms";
import { creatureColorPalette, type CreatureColorPalette } from "@/lib/creature/colorPalettes";
import type { CreaturePartId } from "@/types/exhibition";

export function aquaticPalette(
  pieces: CreaturePiece[],
  baseSeed?: string,
  colorPalette?: CreatureColorPalette,
) {
  const signature = baseSeed ?? pieces[0]?.artifactId ?? "new";
  const palette = colorPalette ?? creatureColorPalette(signature);
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

function TraitMaterial({ color, highlighted, opacity = 1, glow = 0.24 }: { color: string; highlighted: boolean; opacity?: number; glow?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={highlighted ? 0.85 : glow}
      roughness={0.38}
      transparent={opacity < 1}
      opacity={opacity}
      side={THREE.DoubleSide}
    />
  );
}

export type TraitMount = "top" | "bottom" | "left" | "right";

// Every artifact grows exactly one form, always on the same side of the body.
// `along` is where on that side it sits, from tail (-1) to head (1).
export const traitMounts: Record<CreaturePartId, { mount: TraitMount; along: number }> = {
  "signal-antenna": { mount: "top", along: 0.5 },
  "goliath-horns": { mount: "top", along: 0.15 },
  "spark-plume": { mount: "top", along: -0.2 },
  "crystal-spines": { mount: "top", along: -0.5 },
  "helping-arms": { mount: "bottom", along: 0.4 },
  "surfer-feet": { mount: "bottom", along: 0.1 },
  "sand-hourglass": { mount: "bottom", along: -0.2 },
  "route-tail": { mount: "bottom", along: -0.5 },
  "cockatoo-beak": { mount: "right", along: 0.45 },
  "inner-eye": { mount: "right", along: 0.15 },
  "heart-plume": { mount: "right", along: -0.15 },
  "memory-crown": { mount: "right", along: -0.45 },
  "archive-ears": { mount: "left", along: 0.45 },
  "orbit-ring": { mount: "left", along: 0.15 },
  "glass-wings": { mount: "left", along: -0.15 },
  "page-fins": { mount: "left", along: -0.45 },
};

function shapeFrom(points: Array<[number, number]>) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => (index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

// A leaf-like outline from the base (0, 0) to the tip (0, length), bending sideways by `bend`.
function leafShape(length: number, width: number, bend = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.35, 0);
  shape.bezierCurveTo(-width, length * 0.3, -width * 0.6 + bend, length * 0.8, bend, length);
  shape.bezierCurveTo(width * 0.6 + bend, length * 0.75, width, length * 0.3, width * 0.35, 0);
  shape.closePath();
  return shape;
}

// A tube along `curve` that narrows from `radius` at its base to a soft tip.
function taperedTube(curve: THREE.Curve<THREE.Vector3>, radius: number, tip = 0.15) {
  const tubular = 32;
  const radial = 10;
  const geometry = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  const positions = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let ring = 0; ring <= tubular; ring += 1) {
    const t = ring / tubular;
    const center = curve.getPointAt(t);
    const taper = 1 - (1 - tip) * Math.pow(t, 1.4);
    for (let side = 0; side <= radial; side += 1) {
      const index = ring * (radial + 1) + side;
      vertex.fromBufferAttribute(positions, index).sub(center).multiplyScalar(taper).add(center);
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function curve(points: Array<[number, number, number]>) {
  return new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
}

function smoothProfile(points: Array<[number, number]>) {
  return new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(28);
}

const flatExtrude = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 18 };
const thinExtrude = { ...flatExtrude, depth: 0.015, bevelThickness: 0.012, bevelSize: 0.012 };

const traitShapes = {
  comb: shapeFrom([
    [-0.42, 0], [-0.4, 0.34], [-0.3, 0.12], [-0.2, 0.46], [-0.1, 0.16], [0, 0.56],
    [0.1, 0.16], [0.2, 0.46], [0.3, 0.12], [0.4, 0.34], [0.42, 0],
  ]),
  flame: leafShape(0.78, 0.2, -0.16),
  ribbon: shapeFrom([
    ...Array.from({ length: 12 }, (_, index) => {
      const y = (index / 11) * 0.9;
      return [Math.sin(y * 6) * 0.1 - 0.07, y] as [number, number];
    }),
    ...Array.from({ length: 12 }, (_, index) => {
      const y = ((11 - index) / 11) * 0.9;
      return [Math.sin(y * 6) * 0.1 + 0.07 * (1 - y * 0.6), y] as [number, number];
    }),
  ]),
  scale: leafShape(0.5, 0.36),
  leaf: leafShape(0.62, 0.24, -0.12),
  fan: (() => {
    // A half-fan whose rim is scalloped like a frilled gill.
    const shape = new THREE.Shape();
    shape.moveTo(-0.08, 0);
    for (let lobe = 0; lobe < 5; lobe += 1) {
      const from = Math.PI - (lobe / 5) * Math.PI;
      const to = Math.PI - ((lobe + 1) / 5) * Math.PI;
      const middle = (from + to) / 2;
      if (lobe === 0) shape.lineTo(Math.cos(from) * 0.34, Math.sin(from) * 0.34);
      shape.quadraticCurveTo(Math.cos(middle) * 0.46, Math.sin(middle) * 0.46, Math.cos(to) * 0.34, Math.sin(to) * 0.34);
    }
    shape.lineTo(0.08, 0);
    shape.closePath();
    return shape;
  })(),
};

const traitGeometries = {
  lure: taperedTube(curve([[0, -0.05, 0], [0.04, 0.42, 0], [0.28, 0.74, 0], [0.48, 0.7, 0]]), 0.05, 0.5),
  arm: taperedTube(curve([[0, -0.05, 0], [0.04, 0.36, 0], [0.28, 0.6, 0], [0.48, 0.46, 0], [0.38, 0.3, 0], [0.28, 0.38, 0]]), 0.1, 0.18),
  thorn: taperedTube(curve([[0, -0.05, 0], [0.02, 0.3, 0], [-0.1, 0.6, 0], [-0.26, 0.78, 0]]), 0.13, 0.05),
  beak: taperedTube(curve([[0, -0.05, 0], [0.08, 0.2, 0], [0.26, 0.34, 0], [0.42, 0.26, 0]]), 0.17, 0.08),
  // A fiddlehead curl lying on the skin.
  curl: taperedTube(curve(Array.from({ length: 14 }, (_, index) => {
    const t = index / 13;
    const angle = t * Math.PI * 2.2;
    const radius = 0.32 * (1 - t * 0.78);
    return [Math.cos(angle) * radius - 0.1, 0.06 + t * 0.05, -Math.sin(angle) * radius];
  })), 0.07, 0.35),
  hourglass: new THREE.LatheGeometry(smoothProfile([[0.001, 0], [0.2, 0.03], [0.24, 0.14], [0.07, 0.32], [0.24, 0.5], [0.2, 0.61], [0.001, 0.64]]), 22),
  polyp: new THREE.LatheGeometry(smoothProfile([[0.001, 0], [0.16, 0.01], [0.08, 0.14], [0.07, 0.26], [0.17, 0.36], [0.18, 0.44], [0.08, 0.5], [0.001, 0.48]]), 22),
};

// One form per part, built in a mount frame: origin on the skin, +y pointing away from the body,
// +x pointing toward the head and -z pointing up on the flanks. Flank forms mostly lie in the xz plane so they face the viewer.
function AquaticTraitForm({ partId, color, highlighted }: { partId: CreaturePartId; color: string; highlighted: boolean }) {
  const material = <TraitMaterial color={color} highlighted={highlighted} />;
  switch (partId) {
    case "signal-antenna":
      return (
        <>
          <mesh geometry={traitGeometries.lure}>{material}</mesh>
          <mesh position={[0.48, 0.7, 0]}><sphereGeometry args={[0.11, 16, 12]} /><TraitMaterial color={color} highlighted={highlighted} glow={1.2} /></mesh>
        </>
      );
    case "goliath-horns":
      return <mesh position={[0, -0.06, -0.05]}><extrudeGeometry args={[traitShapes.comb, { ...flatExtrude, depth: 0.06, curveSegments: 4 }]} />{material}</mesh>;
    case "spark-plume":
      return <mesh position={[0, -0.06, -0.03]}><extrudeGeometry args={[traitShapes.flame, flatExtrude]} /><TraitMaterial color={color} highlighted={highlighted} glow={0.7} /></mesh>;
    case "crystal-spines":
      return <mesh geometry={traitGeometries.thorn}><TraitMaterial color={color} highlighted={highlighted} opacity={0.86} /></mesh>;
    case "helping-arms":
      return <mesh geometry={traitGeometries.arm}>{material}</mesh>;
    case "surfer-feet":
      return <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, 0.45]} scale={[0.17, 0.4, 0.05]}><sphereGeometry args={[1, 20, 14]} />{material}</mesh>;
    case "sand-hourglass":
      return <mesh position={[0, -0.04, 0]} geometry={traitGeometries.hourglass}><TraitMaterial color={color} highlighted={highlighted} opacity={0.8} /></mesh>;
    case "route-tail":
      return <mesh position={[0, -0.04, -0.02]} rotation={[0, 0, 0.5]}><extrudeGeometry args={[traitShapes.ribbon, thinExtrude]} /><TraitMaterial color={color} highlighted={highlighted} opacity={0.85} /></mesh>;
    case "cockatoo-beak":
      return <mesh geometry={traitGeometries.beak}>{material}</mesh>;
    case "inner-eye":
      return (
        <>
          <mesh scale={[1, 0.7, 1]}><sphereGeometry args={[0.24, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />{material}</mesh>
          <mesh position={[0, 0.15, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.1, 14, 10]} /><meshBasicMaterial color="#071015" /></mesh>
        </>
      );
    case "heart-plume":
      return <mesh position={[0, -0.02, 0]} rotation={[-0.35, 0, 0]} geometry={traitGeometries.polyp}>{material}</mesh>;
    case "memory-crown":
      return <mesh position={[0.18, 0.05, -0.02]} rotation={[-Math.PI / 2, 0, Math.PI / 2 - 0.2]}><extrudeGeometry args={[traitShapes.scale, flatExtrude]} />{material}</mesh>;
    case "archive-ears":
      return <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2 + 0.45, 0, 0]}><extrudeGeometry args={[traitShapes.fan, thinExtrude]} />{material}</mesh>;
    case "orbit-ring":
      return <mesh geometry={traitGeometries.curl}>{material}</mesh>;
    case "glass-wings":
      return <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0.3, -0.35]} scale={[0.46, 0.04, 0.22]}><sphereGeometry args={[1, 20, 14]} /><TraitMaterial color={color} highlighted={highlighted} opacity={0.58} /></mesh>;
    case "page-fins":
      return <mesh position={[0.2, 0.08, 0]} rotation={[-Math.PI / 2, 0.25, Math.PI / 2 + 0.3]}><extrudeGeometry args={[traitShapes.leaf, thinExtrude]} />{material}</mesh>;
  }
}

const traitMarksTag = "aquaticTraitMarks";
const skinInset = 0.02;

function isInsideTraitMarks(object: THREE.Object3D) {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    if (node.userData[traitMarksTag]) return true;
  }
  return false;
}

// Flat fins, outlines and see-through veils are not skin a trait can grow from.
function isSkin(object: THREE.Object3D) {
  if (!object.visible || isInsideTraitMarks(object)) return false;
  const mesh = object as THREE.Mesh;
  if (mesh.geometry instanceof THREE.ShapeGeometry) return false;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return materials.every((material) => material && material.side !== THREE.BackSide && (!material.transparent || material.opacity >= 0.6));
}

type TraitLayout = { x: number; y: number; cx: number; cy: number; z: number; scale: number; vertical?: boolean };

const mountTilt = 0.35;
const mountRotations: Record<"horizontal" | "vertical", Record<TraitMount, THREE.Euler>> = {
  horizontal: {
    top: new THREE.Euler(0, 0, 0),
    bottom: new THREE.Euler(Math.PI, 0, 0),
    right: new THREE.Euler(Math.PI / 2 - mountTilt, 0, 0),
    left: new THREE.Euler(Math.PI / 2 - mountTilt, 0, 0),
  },
  // Upright bodies grow their top traits from the back and their bottom traits from the belly.
  vertical: {
    top: new THREE.Euler(0, 0, Math.PI / 2),
    bottom: new THREE.Euler(Math.PI, 0, Math.PI / 2, "ZYX"),
    right: new THREE.Euler(Math.PI / 2 - mountTilt, 0, 0),
    left: new THREE.Euler(Math.PI / 2 - mountTilt, 0, 0),
  },
};
// The left flank is the right flank mirrored, so flank forms keep pointing up and forward on both sides.
const mountMirrors: Record<TraitMount, [number, number, number]> = {
  top: [1, 1, 1],
  bottom: [1, 1, 1],
  right: [1, 1, 1],
  left: [1, 1, -1],
};

function mountGeometry(layout: TraitLayout, mount: TraitMount, along: number) {
  const axis = layout.vertical ? "y" : "x";
  const alongPosition = layout.vertical ? layout.cy + along * layout.y : layout.cx + along * layout.x;
  const start = new THREE.Vector3(layout.cx, layout.cy, 0);
  start[axis] = alongPosition;
  const outward = new THREE.Vector3();
  let reach: number;
  if (mount === "left" || mount === "right") {
    outward.z = mount === "right" ? 1 : -1;
    reach = layout.z;
  } else if (layout.vertical) {
    outward.x = mount === "top" ? -1 : 1;
    reach = layout.x;
  } else {
    outward.y = mount === "top" ? 1 : -1;
    reach = layout.y;
  }
  return { start, outward, reach };
}

// Casts a ray from outside the body back toward its core and returns the first skin hit in body-local space.
function skinPoint(body: THREE.Object3D, start: THREE.Vector3, outward: THREE.Vector3, reach: number, raycaster: THREE.Raycaster) {
  const origin = body.localToWorld(start.clone().addScaledVector(outward, 20));
  const target = body.localToWorld(start.clone());
  raycaster.set(origin, target.sub(origin).normalize());
  for (const hit of raycaster.intersectObjects(body.children, true)) {
    if (!isSkin(hit.object)) continue;
    const point = body.worldToLocal(hit.point.clone());
    const height = point.clone().sub(start).dot(outward);
    if (height > 0 && height <= reach * 1.3) return point.addScaledVector(outward, -skinInset);
  }
  return null;
}

const traitLayouts: Record<Exclude<AquaticForm, "fish">, TraitLayout> = {
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

type TraitPlacement = { position: THREE.Vector3 };

export function TraitMarks({
  pieces,
  form,
  highlightedPart,
  baseSeed,
  layout: layoutOverride,
}: {
  pieces: CreaturePiece[];
  form: AquaticForm;
  highlightedPart?: CreaturePartId;
  baseSeed?: string;
  layout?: TraitLayout;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [placements, setPlacements] = useState<Record<string, TraitPlacement>>({});
  const signature = baseSeed ?? pieces[0]?.artifactId ?? "new";
  const palette = creatureColorPalette(signature);
  const layout = layoutOverride ?? (form === "fish" ? traitLayouts.seal : traitLayouts[form]);
  const rotations = mountRotations[layout.vertical ? "vertical" : "horizontal"];
  const placementKey = `${form}:${Object.values(layout).join("/")}:${pieces.map((piece) => `${piece.artifactId}/${piece.partId}`).join(",")}`;

  // Measure where the creature's skin actually is, so each trait grows out of it.
  useLayoutEffect(() => {
    const body = groupRef.current?.parent;
    if (!body) return;
    body.updateWorldMatrix(true, true);
    const raycaster = new THREE.Raycaster();
    const next: Record<string, TraitPlacement> = {};
    for (const piece of pieces) {
      const { mount, along } = traitMounts[piece.partId];
      // If the side misses the body there, slide toward the middle until it lands on skin.
      for (let step = 0; step <= 10; step += 1) {
        const { start, outward, reach } = mountGeometry(layout, mount, along * (1 - step / 10));
        const point = skinPoint(body, start, outward, reach, raycaster);
        if (point) {
          next[piece.artifactId] = { position: point };
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
        const { mount, along } = traitMounts[piece.partId];
        const fallback = mountGeometry(layout, mount, along);
        const position = placements[piece.artifactId]?.position
          ?? fallback.start.addScaledVector(fallback.outward, fallback.reach);
        const highlighted = piece.partId === highlightedPart;
        const color = piece.color || [palette.marking, palette.fin, palette.head, palette.belly][index % 4];

        return (
          <group key={piece.artifactId} name={piece.partId} position={position} scale={mountMirrors[mount]}>
            <group rotation={rotations[mount]}>
              <GrowingTrait active={highlighted}>
                <group scale={layout.scale * (highlighted ? 1.18 : 1)}>
                  <AquaticTraitForm partId={piece.partId} color={color} highlighted={highlighted} />
                </group>
              </GrowingTrait>
            </group>
          </group>
        );
      })}
    </group>
  );
}
