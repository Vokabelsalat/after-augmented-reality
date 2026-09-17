"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { artifactById } from "@/data/artifacts";
import type { CreaturePartId, ThemeId } from "@/types/exhibition";

export type CreaturePiece = {
  artifactId: string;
  partId: CreaturePartId;
  color: string;
};

type FishProfile = {
  length: number;
  height: number;
  depth: number;
  head: number;
};

type FishPattern = "bands" | "spots" | "stripe" | "belly";

type FishLook = {
  profile: FishProfile;
  body: string;
  head: string;
  belly: string;
  fin: string;
  marking: string;
  pattern: FishPattern;
};

const fishProfiles: Record<ThemeId, FishProfile> = {
  memory: { length: 1.35, height: 0.86, depth: 0.2, head: 0.74 },
  interface: { length: 1.65, height: 0.62, depth: 0.17, head: 0.6 },
  worldmaking: { length: 1.2, height: 0.98, depth: 0.22, head: 0.82 },
  embodiment: { length: 1.55, height: 0.7, depth: 0.18, head: 0.68 },
  agency: { length: 1.4, height: 0.82, depth: 0.21, head: 0.76 },
};

const fishLooks: Record<string, Omit<FishLook, "profile"> & { profile: keyof typeof fishProfiles }> = {
  "finding-frida": { profile: "memory", body: "#2D7786", head: "#3E9299", belly: "#D8C57E", fin: "#E2A53A", marking: "#173D55", pattern: "bands" },
  "historically-yours": { profile: "agency", body: "#9AA6A2", head: "#687675", belly: "#E7E1CA", fin: "#C47A45", marking: "#303B3C", pattern: "spots" },
  "from-ingrid-to-bergen": { profile: "interface", body: "#BC6B3D", head: "#D5894F", belly: "#F0D8AD", fin: "#712F2B", marking: "#F1B84A", pattern: "stripe" },
  "your-update-has-failed": { profile: "embodiment", body: "#3D83A6", head: "#23526D", belly: "#D5E7DE", fin: "#E4C33B", marking: "#162C4B", pattern: "stripe" },
  "grand-hotel-bald-cockatoo": { profile: "worldmaking", body: "#EE8A32", head: "#E35F2B", belly: "#F2E6C9", fin: "#202632", marking: "#F4EEE0", pattern: "bands" },
  "glass-like-fabric": { profile: "memory", body: "#5AC5C3", head: "#2A8CAA", belly: "#D9F0DF", fin: "#7257A8", marking: "#E3D262", pattern: "spots" },
  "between-page-and-screen": { profile: "agency", body: "#ADB9BA", head: "#62767C", belly: "#E9E7DD", fin: "#2B3E52", marking: "#151B25", pattern: "bands" },
  "bybanen-slop-surfer": { profile: "interface", body: "#B5C95B", head: "#829735", belly: "#E5E5A7", fin: "#D8A42B", marking: "#405326", pattern: "spots" },
  emperor: { profile: "memory", body: "#8E83A8", head: "#655C83", belly: "#DAD4DF", fin: "#C2A1D6", marking: "#35314B", pattern: "stripe" },
  "grand-hotel-galactic-center": { profile: "embodiment", body: "#274E93", head: "#1E3570", belly: "#E5C945", fin: "#E0B72B", marking: "#101E4E", pattern: "bands" },
  "her-name-was-gisberta": { profile: "worldmaking", body: "#D34A79", head: "#A92E59", belly: "#F3B7A3", fin: "#ED7C3D", marking: "#682342", pattern: "spots" },
  "missing-10-hours": { profile: "agency", body: "#C35B4F", head: "#8F3939", belly: "#E9C5A7", fin: "#E2A044", marking: "#582735", pattern: "stripe" },
  goliath: { profile: "worldmaking", body: "#69884A", head: "#405E3B", belly: "#D6CF83", fin: "#D7A62C", marking: "#26372B", pattern: "bands" },
};

const caudalTailShape = new THREE.Shape();
caudalTailShape.moveTo(0, 0.1);
caudalTailShape.bezierCurveTo(-0.2, 0.16, -0.46, 0.54, -0.7, 0.52);
caudalTailShape.quadraticCurveTo(-0.55, 0.2, -0.42, 0.05);
caudalTailShape.quadraticCurveTo(-0.5, 0, -0.42, -0.05);
caudalTailShape.quadraticCurveTo(-0.55, -0.2, -0.7, -0.52);
caudalTailShape.bezierCurveTo(-0.46, -0.54, -0.2, -0.16, 0, -0.1);
caudalTailShape.quadraticCurveTo(0.045, 0, 0, 0.1);

type DorsalFinStyle = {
  shape: THREE.Shape;
  width: number;
  height: number;
  x: number;
  rays: Array<[number, number, number, number]>;
};

function createDorsalShape(
  draw: (shape: THREE.Shape) => void,
) {
  const shape = new THREE.Shape();
  draw(shape);
  return shape;
}

const dorsalFinStyles: DorsalFinStyle[] = [
  {
    shape: createDorsalShape((shape) => {
      shape.moveTo(-0.7, 0);
      shape.lineTo(0.58, 0);
      shape.bezierCurveTo(0.42, 0.12, 0.24, 0.75, -0.04, 0.96);
      shape.bezierCurveTo(-0.19, 1.02, -0.2, 0.3, -0.7, 0);
    }),
    width: 0.9,
    height: 0.86,
    x: -0.18,
    rays: [[0.43, 0.03, -0.03, 0.86], [0.2, 0.03, -0.12, 0.64], [-0.04, 0.03, -0.25, 0.4]],
  },
  {
    shape: createDorsalShape((shape) => {
      shape.moveTo(-0.72, 0);
      shape.lineTo(0.6, 0);
      shape.bezierCurveTo(0.38, 0.08, 0.25, 0.52, -0.02, 0.7);
      shape.bezierCurveTo(-0.24, 0.81, -0.43, 0.2, -0.72, 0);
    }),
    width: 1,
    height: 0.74,
    x: -0.22,
    rays: [[0.42, 0.03, -0.03, 0.63], [0.14, 0.03, -0.2, 0.48], [-0.16, 0.03, -0.38, 0.28]],
  },
  {
    shape: createDorsalShape((shape) => {
      shape.moveTo(-0.68, 0);
      shape.lineTo(0.56, 0);
      shape.lineTo(0.02, 0.9);
      shape.quadraticCurveTo(-0.12, 0.94, -0.68, 0);
    }),
    width: 0.82,
    height: 0.9,
    x: -0.1,
    rays: [[0.43, 0.03, 0.03, 0.82], [0.18, 0.03, -0.07, 0.7], [-0.08, 0.03, -0.27, 0.44]],
  },
  {
    shape: createDorsalShape((shape) => {
      shape.moveTo(-0.74, 0);
      shape.lineTo(0.6, 0);
      shape.bezierCurveTo(0.38, 0.12, 0.2, 0.62, -0.02, 0.78);
      shape.bezierCurveTo(-0.16, 0.84, -0.08, 0.2, -0.74, 0);
    }),
    width: 1.02,
    height: 0.78,
    x: -0.26,
    rays: [[0.43, 0.03, -0.03, 0.69], [0.16, 0.03, -0.09, 0.52], [-0.13, 0.03, -0.28, 0.3]],
  },
  {
    shape: createDorsalShape((shape) => {
      shape.moveTo(-0.76, 0);
      shape.lineTo(0.58, 0);
      shape.bezierCurveTo(0.42, 0.16, 0.28, 0.64, 0.08, 0.82);
      shape.quadraticCurveTo(-0.02, 0.88, -0.08, 0.57);
      shape.quadraticCurveTo(-0.18, 0.69, -0.22, 0.4);
      shape.quadraticCurveTo(-0.36, 0.53, -0.38, 0.25);
      shape.quadraticCurveTo(-0.54, 0.32, -0.76, 0);
    }),
    width: 0.96,
    height: 0.82,
    x: -0.22,
    rays: [[0.43, 0.03, 0.08, 0.76], [0.17, 0.03, -0.1, 0.55], [-0.1, 0.03, -0.27, 0.4], [-0.38, 0.03, -0.48, 0.22]],
  },
];

type PectoralFinStyle = {
  shape: THREE.Shape;
  width: number;
  height: number;
  rays: Array<[number, number, number, number]>;
};

function createPectoralShape(draw: (shape: THREE.Shape) => void) {
  const shape = new THREE.Shape();
  draw(shape);
  return shape;
}

const pectoralFinStyles: PectoralFinStyle[] = [
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.12, 0.1);
      shape.bezierCurveTo(-0.18, 0.02, -0.66, -0.28, -0.82, -0.52);
      shape.bezierCurveTo(-0.9, -0.68, -0.7, -0.78, -0.4, -0.7);
      shape.bezierCurveTo(-0.12, -0.52, 0.04, -0.28, 0.11, -0.12);
      shape.quadraticCurveTo(0.19, -0.01, 0.12, 0.1);
    }),
    width: 0.92,
    height: 0.92,
    rays: [[0.07, 0, -0.25, -0.16], [0.06, -0.03, -0.5, -0.3], [0.04, -0.06, -0.69, -0.48], [0.02, -0.09, -0.52, -0.64], [0, -0.12, -0.27, -0.57]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.12, 0.1);
      shape.bezierCurveTo(-0.2, 0.01, -0.72, -0.17, -0.96, -0.45);
      shape.quadraticCurveTo(-0.85, -0.72, -0.46, -0.72);
      shape.quadraticCurveTo(-0.06, -0.48, 0.1, -0.12);
      shape.quadraticCurveTo(0.18, 0, 0.12, 0.1);
    }),
    width: 0.98,
    height: 0.86,
    rays: [[0.07, 0, -0.28, -0.12], [0.06, -0.03, -0.58, -0.23], [0.04, -0.06, -0.82, -0.39], [0.02, -0.09, -0.65, -0.6], [0, -0.12, -0.36, -0.59]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.12, 0.08);
      shape.bezierCurveTo(-0.22, -0.04, -0.76, -0.44, -1.02, -0.78);
      shape.quadraticCurveTo(-0.74, -0.8, -0.43, -0.67);
      shape.quadraticCurveTo(-0.08, -0.4, 0.1, -0.11);
      shape.quadraticCurveTo(0.17, -0.01, 0.12, 0.08);
    }),
    width: 0.94,
    height: 0.94,
    rays: [[0.07, 0, -0.34, -0.24], [0.05, -0.03, -0.58, -0.41], [0.03, -0.06, -0.83, -0.62], [0, -0.1, -0.58, -0.65], [-0.02, -0.12, -0.32, -0.52]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.12, 0.08);
      shape.bezierCurveTo(-0.16, -0.02, -0.6, -0.34, -0.88, -0.68);
      shape.quadraticCurveTo(-0.65, -0.67, -0.44, -0.55);
      shape.bezierCurveTo(-0.2, -0.42, -0.02, -0.23, 0.1, -0.1);
      shape.quadraticCurveTo(0.17, -0.01, 0.12, 0.08);
    }),
    width: 1.02,
    height: 0.88,
    rays: [[0.07, 0, -0.28, -0.2], [0.05, -0.03, -0.5, -0.35], [0.03, -0.06, -0.72, -0.54], [0, -0.1, -0.48, -0.5], [-0.02, -0.12, -0.24, -0.39]],
  },
];

const pelvicFinStyles: PectoralFinStyle[] = [
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.1, 0.06);
      shape.bezierCurveTo(-0.12, 0, -0.43, -0.18, -0.58, -0.38);
      shape.quadraticCurveTo(-0.56, -0.55, -0.32, -0.55);
      shape.quadraticCurveTo(-0.04, -0.34, 0.09, -0.09);
      shape.quadraticCurveTo(0.15, -0.01, 0.1, 0.06);
    }),
    width: 0.68,
    height: 0.68,
    rays: [[0.05, 0, -0.2, -0.14], [0.03, -0.03, -0.4, -0.28], [0, -0.06, -0.35, -0.45]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.1, 0.05);
      shape.bezierCurveTo(-0.12, -0.02, -0.48, -0.34, -0.72, -0.64);
      shape.quadraticCurveTo(-0.48, -0.59, -0.28, -0.46);
      shape.quadraticCurveTo(-0.03, -0.25, 0.09, -0.08);
      shape.quadraticCurveTo(0.15, -0.01, 0.1, 0.05);
    }),
    width: 0.64,
    height: 0.68,
    rays: [[0.05, 0, -0.22, -0.2], [0.03, -0.03, -0.43, -0.38], [0, -0.06, -0.57, -0.54]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.1, 0.05);
      shape.bezierCurveTo(-0.15, -0.03, -0.54, -0.25, -0.78, -0.52);
      shape.quadraticCurveTo(-0.57, -0.58, -0.35, -0.5);
      shape.bezierCurveTo(-0.1, -0.36, 0.03, -0.18, 0.09, -0.08);
      shape.quadraticCurveTo(0.15, -0.01, 0.1, 0.05);
    }),
    width: 0.7,
    height: 0.62,
    rays: [[0.05, 0, -0.25, -0.16], [0.03, -0.03, -0.49, -0.31], [0, -0.06, -0.63, -0.46]],
  },
  {
    shape: createPectoralShape((shape) => {
      shape.moveTo(0.1, 0.05);
      shape.bezierCurveTo(-0.12, -0.02, -0.43, -0.19, -0.65, -0.43);
      shape.quadraticCurveTo(-0.52, -0.42, -0.38, -0.35);
      shape.quadraticCurveTo(-0.43, -0.52, -0.27, -0.57);
      shape.quadraticCurveTo(-0.05, -0.31, 0.09, -0.08);
      shape.quadraticCurveTo(0.15, -0.01, 0.1, 0.05);
    }),
    width: 0.72,
    height: 0.66,
    rays: [[0.05, 0, -0.2, -0.15], [0.03, -0.03, -0.4, -0.29], [0, -0.06, -0.3, -0.48]],
  },
];

export function creaturePiecesFromArtifactIds(artifactIds: string[]) {
  return artifactIds.flatMap((artifactId) => {
    const artifact = artifactById.get(artifactId);
    return artifact
      ? [{ artifactId, partId: artifact.creaturePart.id, color: artifact.color }]
      : [];
  });
}

function hashUnit(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function SoftMaterial({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <meshToonMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      side={opacity < 1 ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

function DorsalFin({
  style,
  color,
  rayColor,
}: {
  style: DorsalFinStyle;
  color: string;
  rayColor: string;
}) {
  return (
    <>
      <mesh position={[0, -0.006, -0.012]} scale={[1.035, 1.035, 1]}>
        <shapeGeometry args={[style.shape, 20]} />
        <meshBasicMaterial color="#080B12" side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <shapeGeometry args={[style.shape, 20]} />
        <SoftMaterial color={color} opacity={0.88} />
      </mesh>
      {style.rays.map(([startX, startY, endX, endY], index) => {
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.hypot(dx, dy);
        return (
          <mesh
            key={`${startX}-${index}`}
            position={[(startX + endX) / 2, (startY + endY) / 2, 0.012]}
            rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}
          >
            <capsuleGeometry args={[0.009, Math.max(0.02, length - 0.018), 3, 6]} />
            <meshBasicMaterial color={rayColor} transparent opacity={0.3} />
          </mesh>
        );
      })}
    </>
  );
}

function PectoralFin({
  style,
  color,
  rayColor,
  side,
}: {
  style: PectoralFinStyle;
  color: string;
  rayColor: string;
  side: number;
}) {
  return (
    <>
      <mesh position={[0, 0, -0.012 * side]} scale={[1.035, 1.035, 1]}>
        <shapeGeometry args={[style.shape, 20]} />
        <meshBasicMaterial color="#080B12" side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <shapeGeometry args={[style.shape, 20]} />
        <SoftMaterial color={color} opacity={0.82} />
      </mesh>
      {style.rays.map(([startX, startY, endX, endY], index) => {
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.hypot(dx, dy);
        return (
          <mesh
            key={`${endX}-${index}`}
            position={[(startX + endX) / 2, (startY + endY) / 2, 0.012 * side]}
            rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}
          >
            <capsuleGeometry args={[0.008, Math.max(0.02, length - 0.016), 3, 6]} />
            <meshBasicMaterial color={rayColor} transparent opacity={0.28} />
          </mesh>
        );
      })}
    </>
  );
}

function FishPartMesh({ piece }: { piece: CreaturePiece }) {
  const material = <SoftMaterial color={piece.color} />;

  switch (piece.partId) {
    case "memory-crown":
      return (
        <group name={piece.partId} position={[-0.18, 0.02, 0.27]}>
          {[-0.65, -0.28, 0.1, 0.48].map((x, index) => (
            <mesh key={x} position={[x, (index % 2) * 0.18 - 0.09, 0]} scale={[1.35, 0.85, 0.08]}>
              <sphereGeometry args={[0.16, 14, 14]} />
              <meshToonMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.18} />
            </mesh>
          ))}
        </group>
      );
    case "archive-ears":
      return (
        <group name={piece.partId} position={[0.52, 0, 0.2]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[0, side * 0.3, 0]} rotation={[0, 0, side * 0.16]}>
              {[0, 1, 2].map((index) => (
                <mesh key={index} position={[-index * 0.08, side * index * 0.12, 0]} rotation={[0, 0, side * -0.28]} scale={[0.5, 1, 0.08]}>
                  <coneGeometry args={[0.2, 0.58, 5]} />
                  {material}
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    case "route-tail":
      return (
        <group name={piece.partId} position={[-1.42, 0, -0.04]}>
          {[-0.3, 0, 0.3].map((y, index) => (
            <mesh key={y} position={[-0.42 - index * 0.08, y, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.35, 1 + index * 0.2, 0.08]}>
              <capsuleGeometry args={[0.07, 0.72, 5, 10]} />
              <SoftMaterial color={piece.color} opacity={0.74} />
            </mesh>
          ))}
        </group>
      );
    case "signal-antenna":
      return (
        <group name={piece.partId} position={[0.68, 0.5, 0]} rotation={[0, 0, -0.24]}>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.045, 0.68, 8]} />
            {material}
          </mesh>
          <mesh position={[0.05, 0.7, 0]}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshToonMaterial color={piece.color} emissive={piece.color} emissiveIntensity={1.5} />
          </mesh>
        </group>
      );
    case "cockatoo-beak":
      return (
        <group name={piece.partId} position={[1.34, -0.03, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh scale={[1, 1.25, 0.12]}>
            <coneGeometry args={[0.3, 0.6, 5]} />
            {material}
          </mesh>
        </group>
      );
    case "glass-wings":
      return (
        <group name={piece.partId} position={[-0.05, -0.12, 0.28]}>
          <mesh rotation={[0.05, 0.18, -0.72]} scale={[0.62, 1.34, 0.12]}>
            <sphereGeometry args={[0.5, 18, 18]} />
            <meshToonMaterial color={piece.color} transparent opacity={0.42} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "page-fins":
      return (
        <group name={piece.partId} position={[-0.2, 0.68, -0.04]}>
          {[-0.28, 0.18, 0.58].map((x, index) => (
            <mesh key={x} position={[x, index * 0.06, 0]} rotation={[0, 0, -0.08 + index * 0.08]} scale={[0.7, 1.1 - index * 0.12, 0.08]}>
              <coneGeometry args={[0.28, 0.76, 4]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "surfer-feet":
      return (
        <group name={piece.partId} position={[-0.18, -0.66, 0.04]}>
          {[-0.42, 0.32].map((x) => (
            <mesh key={x} position={[x, -0.18, 0.06]} rotation={[0, 0, x < 0 ? -0.22 : 0.22]} scale={[0.7, 1.12, 0.08]}>
              <coneGeometry args={[0.24, 0.62, 5]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "inner-eye":
      return (
        <group name={piece.partId} position={[0.76, 0.42, 0.28]}>
          <mesh scale={[1.2, 0.72, 0.1]}>
            <sphereGeometry args={[0.17, 18, 18]} />
            {material}
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshBasicMaterial color="#09090D" />
          </mesh>
        </group>
      );
    case "orbit-ring":
      return (
        <group name={piece.partId} position={[-0.12, 0, 0.3]}>
          {[-0.44, 0, 0.44].map((x, index) => (
            <mesh key={x} position={[x, 0, 0]} scale={[0.38, 0.72 - Math.abs(index - 1) * 0.08, 0.12]}>
              <torusGeometry args={[0.55, 0.055, 8, 28]} />
              <meshToonMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.32} />
            </mesh>
          ))}
        </group>
      );
    case "heart-plume":
      return (
        <group name={piece.partId} position={[0.18, -0.02, 0.31]} scale={0.58}>
          <mesh position={[-0.13, 0.12, 0]}><sphereGeometry args={[0.23, 16, 16]} />{material}</mesh>
          <mesh position={[0.13, 0.12, 0]}><sphereGeometry args={[0.23, 16, 16]} />{material}</mesh>
          <mesh position={[0, -0.16, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1.4, 0.1]}>
            <coneGeometry args={[0.31, 0.62, 4]} />
            {material}
          </mesh>
        </group>
      );
    case "helping-arms":
      return (
        <group name={piece.partId} position={[0.72, -0.34, 0.18]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0.18, side * 0.18, 0]} rotation={[0, 0, Math.PI / 2 + side * 0.18]} scale={[0.26, 1.35, 0.08]}>
              <capsuleGeometry args={[0.08, 0.86, 5, 10]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "goliath-horns":
      return (
        <group name={piece.partId} position={[0.58, 0.58, 0]}>
          {[0, 1, 2].map((index) => (
            <mesh key={index} position={[-index * 0.26, index * 0.04, 0]} rotation={[0, 0, index * -0.12]}>
              <coneGeometry args={[0.13, 0.58 - index * 0.06, 6]} />
              {material}
            </mesh>
          ))}
        </group>
      );
  }
}

function FishMarkings({
  pattern,
  color,
  length,
  height,
  depth,
}: {
  pattern: FishPattern;
  color: string;
  length: number;
  height: number;
  depth: number;
}) {
  const z = depth * 0.94 + 0.018;

  if (pattern === "bands") {
    return (
      <group position={[0, 0, z]}>
        {[-0.52, -0.05, 0.42].map((x, index) => (
          <mesh key={x} position={[x * length, 0, 0]} scale={[0.48, height * (1.15 - index * 0.08), 0.06]}>
            <torusGeometry args={[0.42, 0.055, 6, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.72} />
          </mesh>
        ))}
      </group>
    );
  }

  if (pattern === "spots") {
    const spots = [
      [-0.66, 0.2, 0.12],
      [-0.34, -0.2, 0.1],
      [-0.02, 0.26, 0.13],
      [0.3, -0.18, 0.09],
      [0.58, 0.16, 0.1],
    ] as const;
    return (
      <group position={[0, 0, z]}>
        {spots.map(([x, y, size]) => (
          <mesh key={`${x}:${y}`} position={[x * length, y * height, 0]} scale={[1.3, 0.9, 0.08]}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.78} />
          </mesh>
        ))}
      </group>
    );
  }

  if (pattern === "stripe") {
    return (
      <mesh position={[-0.12 * length, 0.06 * height, z]} scale={[length * 0.76, height * 0.14, 0.055]}>
        <sphereGeometry args={[0.72, 18, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.74} />
      </mesh>
    );
  }

  return null;
}

export function CreatureModel({
  pieces,
  animated = true,
  highlightedPart,
  scale = 1,
}: {
  pieces: CreaturePiece[];
  animated?: boolean;
  highlightedPart?: CreaturePartId;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const dorsalRef = useRef<THREE.Group>(null);
  const finRef = useRef<THREE.Group>(null);
  const pelvicRef = useRef<THREE.Group>(null);
  const eyeRefs = useRef<Array<THREE.Group | null>>([]);
  const partRefs = useRef(new Map<string, THREE.Group>());
  const signature = pieces.map((piece) => piece.artifactId).join(":") || "new";
  const firstArtifact = pieces[0] ? artifactById.get(pieces[0].artifactId) : undefined;
  const configuredLook = firstArtifact ? fishLooks[firstArtifact.id] : undefined;
  const profile = fishProfiles[configuredLook?.profile ?? firstArtifact?.theme ?? "worldmaking"];
  const proportions = useMemo(() => ({
    length: profile.length * (0.96 + hashUnit(`${signature}:length`) * 0.08),
    height: profile.height * (0.96 + hashUnit(`${signature}:height`) * 0.08),
    depth: profile.depth,
    head: profile.head,
    winkEvery: 4.2 + hashUnit(`${signature}:wink-speed`) * 3.8,
    winkOffset: hashUnit(`${signature}:wink-offset`) * 7,
  }), [profile, signature]);
  const baseColor = configuredLook?.body ?? pieces[0]?.color ?? "#58D6FF";
  const headColor = configuredLook?.head ?? baseColor;
  const bellyColor = configuredLook?.belly ?? new THREE.Color(baseColor).lerp(new THREE.Color("#F3F0E8"), 0.38).getStyle();
  const finColor = configuredLook?.fin ?? bellyColor;
  const markingColor = configuredLook?.marking ?? headColor;
  const pattern = configuredLook?.pattern ?? "belly";
  const dorsalStyle = dorsalFinStyles[
    Math.min(dorsalFinStyles.length - 1, Math.floor(hashUnit(`${firstArtifact?.id ?? signature}:dorsal-fin`) * dorsalFinStyles.length))
  ];
  const pectoralStyle = pectoralFinStyles[
    Math.min(pectoralFinStyles.length - 1, Math.floor(hashUnit(`${firstArtifact?.id ?? signature}:pectoral-fin`) * pectoralFinStyles.length))
  ];
  const pelvicStyle = pelvicFinStyles[
    Math.min(pelvicFinStyles.length - 1, Math.floor(hashUnit(`${firstArtifact?.id ?? signature}:pelvic-fin`) * pelvicFinStyles.length))
  ];

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const elapsed = clock.elapsedTime;
    const swim = elapsed * 3.3 + hashUnit(signature) * Math.PI * 2;
    groupRef.current.position.y = Math.sin(elapsed * 1.15 + hashUnit(signature) * 5) * 0.045;
    groupRef.current.rotation.z = Math.sin(elapsed * 1.1 + proportions.winkOffset) * 0.025;
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(swim) * 0.16;
    if (dorsalRef.current) dorsalRef.current.rotation.z = Math.sin(swim * 0.48) * 0.025;
    if (finRef.current) {
      finRef.current.rotation.x = Math.sin(swim * 0.74) * 0.11;
      finRef.current.rotation.z = Math.sin(swim * 0.74) * 0.055;
    }
    if (pelvicRef.current) {
      pelvicRef.current.rotation.x = Math.sin(swim * 0.64 + 1.8) * 0.075;
      pelvicRef.current.rotation.z = Math.sin(swim * 0.64 + 1.8) * 0.035;
    }

    const winkTime = elapsed + proportions.winkOffset;
    const winkProgress = (winkTime % proportions.winkEvery) / 0.18;
    eyeRefs.current.forEach((eye) => {
      if (!eye) return;
      const closure = winkProgress < 1 ? Math.sin(winkProgress * Math.PI) : 0;
      eye.scale.y = Math.max(0.08, 1 - closure * 0.92);
    });

    pieces.forEach((piece) => {
      const part = partRefs.current.get(piece.artifactId);
      if (!part) return;
      const time = elapsed + hashUnit(piece.artifactId) * Math.PI * 2;
      const emphasis = piece.partId === highlightedPart ? 1.75 : 1;
      const pulse = Math.sin(time * 2.1);
      part.position.set(0, 0, 0);
      part.rotation.set(0, 0, 0);
      part.scale.setScalar(1);

      switch (piece.partId) {
        case "memory-crown":
          part.scale.setScalar(1 + pulse * 0.035 * emphasis);
          break;
        case "archive-ears":
          part.scale.set(1, 1 + pulse * 0.06 * emphasis, 1);
          break;
        case "route-tail":
          part.rotation.z = Math.sin(time * 2.6) * 0.14 * emphasis;
          break;
        case "signal-antenna":
          part.rotation.z = Math.sin(time * 1.9) * 0.08 * emphasis;
          break;
        case "cockatoo-beak":
          part.scale.set(1, 1 + Math.max(0, pulse) * 0.055 * emphasis, 1);
          break;
        case "glass-wings":
          part.rotation.z = Math.sin(time * 2.4) * 0.1 * emphasis;
          break;
        case "page-fins":
          part.rotation.z = Math.sin(time * 1.5) * 0.045 * emphasis;
          break;
        case "surfer-feet":
          part.rotation.z = Math.sin(time * 2.1) * 0.06 * emphasis;
          break;
        case "inner-eye":
          part.scale.set(1, 0.88 + Math.sin(time * 1.6) * 0.12, 1);
          break;
        case "orbit-ring":
          part.position.x = Math.sin(time * 0.9) * 0.025 * emphasis;
          break;
        case "heart-plume": {
          const heartbeat = Math.pow(Math.max(0, Math.sin(time * 2.8)), 8);
          part.scale.setScalar(1 + heartbeat * 0.1 * emphasis);
          break;
        }
        case "helping-arms":
          part.rotation.z = Math.sin(time * 1.7) * 0.1 * emphasis;
          break;
        case "goliath-horns":
          part.rotation.z = Math.sin(time * 1.15) * 0.04 * emphasis;
          break;
      }
    });
  });

  function setPartRef(artifactId: string, node: THREE.Group | null) {
    if (node) partRefs.current.set(artifactId, node);
    else partRefs.current.delete(artifactId);
  }

  const headX = proportions.length * 0.62;
  const tailX = -proportions.length * 1.02;

  return (
    <group ref={groupRef} scale={scale}>
      <mesh scale={[proportions.length, proportions.height, proportions.depth]}>
        <sphereGeometry args={[0.86, 32, 26]} />
        <meshToonMaterial color={baseColor} />
      </mesh>
      <mesh scale={[proportions.length * 1.035, proportions.height * 1.055, proportions.depth * 1.12]}>
        <sphereGeometry args={[0.86, 32, 26]} />
        <meshBasicMaterial color="#080B12" side={THREE.BackSide} />
      </mesh>
      <mesh position={[headX, 0.02, 0.02]} scale={[proportions.head, proportions.height * 0.9, proportions.depth * 0.96]}>
        <sphereGeometry args={[0.7, 28, 24]} />
        <meshToonMaterial color={headColor} />
      </mesh>
      <mesh position={[headX, 0.02, 0]} scale={[proportions.head * 1.045, proportions.height * 0.95, proportions.depth * 1.1]}>
        <sphereGeometry args={[0.7, 28, 24]} />
        <meshBasicMaterial color="#080B12" side={THREE.BackSide} />
      </mesh>
      <mesh position={[-0.12, -0.08, proportions.depth * 0.72]} scale={[proportions.length * 0.72, proportions.height * 0.62, 0.12]}>
        <sphereGeometry args={[0.76, 24, 20]} />
        <SoftMaterial color={bellyColor} opacity={0.42} />
      </mesh>

      <FishMarkings
        pattern={pattern}
        color={markingColor}
        length={proportions.length}
        height={proportions.height}
        depth={proportions.depth}
      />

      <mesh position={[tailX + 0.22, 0, 0]} scale={[0.54, 0.2, proportions.depth * 0.78]}>
        <sphereGeometry args={[0.44, 18, 14]} />
        <meshToonMaterial color={baseColor} />
      </mesh>

      <group ref={tailRef} position={[tailX, 0, 0]}>
        <mesh position={[0, 0, -0.012]} scale={[1.055, 1.055, 1]}>
          <shapeGeometry args={[caudalTailShape, 14]} />
          <meshBasicMaterial color="#080B12" side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <shapeGeometry args={[caudalTailShape, 14]} />
          <SoftMaterial color={finColor} opacity={0.92} />
        </mesh>
      </group>

      <group
        ref={dorsalRef}
        position={[dorsalStyle.x, proportions.height * 0.78, 0]}
        scale={[dorsalStyle.width, proportions.height * dorsalStyle.height, 1]}
      >
        <DorsalFin style={dorsalStyle} color={finColor} rayColor={markingColor} />
      </group>
      <group
        ref={pelvicRef}
        position={[-proportions.length * 0.18, -proportions.height * 0.62, 0]}
      >
        {[1, -1].map((side) => (
          <group
            key={side}
            position={[0, 0, side * (proportions.depth * 0.66 + 0.015)]}
            scale={[pelvicStyle.width, proportions.height * pelvicStyle.height, 1]}
          >
            <PectoralFin
              style={pelvicStyle}
              color={finColor}
              rayColor={markingColor}
              side={side}
            />
          </group>
        ))}
      </group>

      <group
        ref={finRef}
        position={[proportions.length * 0.24, -proportions.height * 0.08, 0]}
      >
        {[1, -1].map((side) => (
          <group
            key={side}
            position={[0, 0, side * (proportions.depth * 0.9 + 0.018)]}
            scale={[pectoralStyle.width, proportions.height * pectoralStyle.height, 1]}
          >
            <PectoralFin
              style={pectoralStyle}
              color={finColor}
              rayColor={markingColor}
              side={side}
            />
          </group>
        ))}
      </group>

      {[1, -1].map((side, index) => (
        <group
          ref={(node) => { eyeRefs.current[index] = node; }}
          key={side}
          position={[headX + proportions.head * 0.24, proportions.height * 0.28, side * proportions.depth * 0.7]}
          rotation={[0, side > 0 ? 0 : Math.PI, 0]}
        >
          <mesh>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshToonMaterial color="#F3F0E8" />
          </mesh>
          <mesh position={[0.025, 0, 0.1]}>
            <sphereGeometry args={[0.062, 14, 14]} />
            <meshBasicMaterial color="#07080A" />
          </mesh>
        </group>
      ))}

      {[1, -1].map((side) => (
        <mesh
          key={`mouth-${side}`}
          position={[
            headX + proportions.head * 0.64,
            -proportions.height * 0.1,
            side * (proportions.depth * 0.72),
          ]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1, 1, 0.12]}
        >
          <capsuleGeometry args={[0.025, 0.15, 4, 8]} />
          <meshBasicMaterial color="#171218" />
        </mesh>
      ))}

      {pieces.map((piece) => (
        <group ref={(node) => { setPartRef(piece.artifactId, node); }} key={piece.artifactId}>
          <FishPartMesh piece={piece} />
        </group>
      ))}
    </group>
  );
}
