"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { artifactById } from "@/data/artifacts";
import type { CreaturePartId } from "@/types/exhibition";

export type CreaturePiece = {
  artifactId: string;
  partId: CreaturePartId;
  color: string;
};

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
    <meshStandardMaterial
      color={color}
      roughness={0.48}
      metalness={0.08}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function CreaturePartMesh({ piece }: { piece: CreaturePiece }) {
  const material = <SoftMaterial color={piece.color} />;

  switch (piece.partId) {
    case "memory-crown":
      return (
        <group name={piece.partId} position={[0, 1.72, -0.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.68, 0.055, 10, 40]} />
            <SoftMaterial color={piece.color} opacity={0.82} />
          </mesh>
          {[-0.55, -0.27, 0, 0.27, 0.55].map((x, index) => (
            <mesh key={x} position={[x, 0.2 + Math.cos(x * 3) * 0.13, 0]} scale={0.75 + index * 0.05}>
              <sphereGeometry args={[0.09, 12, 12]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "archive-ears":
      return (
        <group name={piece.partId} position={[0, 1.12, 0]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.67, 0.08, 0]} rotation={[0, 0, side * -0.62]} scale={[0.72, 1.15, 0.36]}>
              <coneGeometry args={[0.32, 0.72, 5]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "route-tail":
      return (
        <group name={piece.partId} position={[0.62, -0.38, -0.2]} rotation={[0.1, 0, -0.42]}>
          {[0, 1, 2, 3].map((index) => (
            <mesh key={index} position={[0.28 + index * 0.28, -index * 0.04, -index * 0.05]} scale={1 - index * 0.14}>
              <sphereGeometry args={[0.21, 14, 14]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "signal-antenna":
      return (
        <group name={piece.partId} position={[0.05, 1.72, 0]} rotation={[0, 0, -0.12]}>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.52, 8]} />
            {material}
          </mesh>
          <mesh position={[0, 0.55, 0]} rotation={[0.2, 0.4, 0.15]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={1.4} />
          </mesh>
        </group>
      );
    case "cockatoo-beak":
      return (
        <group name={piece.partId} position={[0, 1.02, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh scale={[1, 1.35, 0.82]}>
            <coneGeometry args={[0.28, 0.62, 5]} />
            {material}
          </mesh>
        </group>
      );
    case "glass-wings":
      return (
        <group name={piece.partId} position={[0, 0.15, -0.04]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.78, 0.05, -0.12]} rotation={[0.15, side * 0.22, side * -0.42]} scale={[0.48, 1.25, 0.16]}>
              <sphereGeometry args={[0.52, 18, 18]} />
              <meshStandardMaterial color={piece.color} transparent opacity={0.36} roughness={0.15} metalness={0.25} />
            </mesh>
          ))}
        </group>
      );
    case "page-fins":
      return (
        <group name={piece.partId} position={[0, 0.1, -0.45]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.53, 0.18, 0]} rotation={[0.08, side * -0.18, side * 0.3]}>
              <boxGeometry args={[0.58, 1.18, 0.055]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "surfer-feet":
      return (
        <group name={piece.partId} position={[0, -1.14, 0.12]}>
          {[-0.34, 0.34].map((x) => (
            <mesh key={x} position={[x, 0, 0.12]} rotation={[0.08, 0, x * -0.28]} scale={[1.6, 0.38, 0.65]}>
              <sphereGeometry args={[0.28, 14, 14]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "inner-eye":
      return (
        <group name={piece.partId} position={[0, 1.38, 0.58]}>
          <mesh scale={[1.35, 0.74, 0.28]}>
            <sphereGeometry args={[0.16, 18, 18]} />
            {material}
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshStandardMaterial color="#111016" roughness={0.3} />
          </mesh>
        </group>
      );
    case "orbit-ring":
      return (
        <mesh name={piece.partId} position={[0, 0.05, 0]} rotation={[1.1, 0.15, 0.25]}>
          <torusGeometry args={[1.02, 0.045, 10, 52]} />
          <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.45} />
        </mesh>
      );
    case "heart-plume":
      return (
        <group name={piece.partId} position={[0, 0.1, 0.68]} scale={0.72}>
          <mesh position={[-0.13, 0.12, 0]}>{<sphereGeometry args={[0.23, 16, 16]} />}{material}</mesh>
          <mesh position={[0.13, 0.12, 0]}>{<sphereGeometry args={[0.23, 16, 16]} />}{material}</mesh>
          <mesh position={[0, -0.16, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1.4, 0.75]}>
            <coneGeometry args={[0.31, 0.62, 4]} />
            {material}
          </mesh>
        </group>
      );
    case "helping-arms":
      return (
        <group name={piece.partId} position={[0, 0.05, 0.05]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.72, 0.12, 0]} rotation={[0, 0, side * -0.82]}>
              <mesh position={[0, -0.42, 0]}>
                <capsuleGeometry args={[0.12, 0.68, 6, 12]} />
                {material}
              </mesh>
              <mesh position={[0, -0.88, 0]}>
                <sphereGeometry args={[0.18, 14, 14]} />
                {material}
              </mesh>
            </group>
          ))}
        </group>
      );
    case "goliath-horns":
      return (
        <group name={piece.partId} position={[0, 1.62, 0.02]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.38, 0.26, 0]} rotation={[0, 0, side * -0.28]}>
              <coneGeometry args={[0.14, 0.68, 6]} />
              {material}
            </mesh>
          ))}
        </group>
      );
  }
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
  const eyeRefs = useRef<Array<THREE.Group | null>>([]);
  const partRefs = useRef(new Map<string, THREE.Group>());
  const signature = pieces.map((piece) => piece.artifactId).join(":") || "new";
  const proportions = useMemo(() => ({
    width: 0.92 + hashUnit(`${signature}:w`) * 0.18,
    height: 0.94 + hashUnit(`${signature}:h`) * 0.15,
    tilt: (hashUnit(`${signature}:t`) - 0.5) * 0.12,
    winkEvery: 4.2 + hashUnit(`${signature}:wink-speed`) * 3.8,
    winkOffset: hashUnit(`${signature}:wink-offset`) * 7,
  }), [signature]);
  const baseColor = pieces[0]?.color ?? "#8C86A8";

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const elapsed = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(elapsed * 1.15 + hashUnit(signature) * 5) * 0.06;
    groupRef.current.rotation.y = Math.sin(elapsed * 0.42) * 0.16 + proportions.tilt;

    const winkTime = elapsed + proportions.winkOffset;
    const winkProgress = (winkTime % proportions.winkEvery) / 0.18;
    eyeRefs.current.forEach((eye) => {
      if (!eye) return;
      const closure = winkProgress < 1
        ? Math.sin(winkProgress * Math.PI)
        : 0;
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
          part.position.y = Math.sin(time * 1.4) * 0.045 * emphasis;
          part.scale.setScalar(1 + pulse * 0.025 * emphasis);
          break;
        case "archive-ears":
          part.rotation.z = Math.sin(time * 1.7) * 0.055 * emphasis;
          break;
        case "route-tail":
          part.rotation.z = Math.sin(time * 1.3) * 0.2 * emphasis;
          break;
        case "signal-antenna":
          part.rotation.z = Math.sin(time * 2.3) * 0.09 * emphasis;
          part.scale.setScalar(1 + pulse * 0.02 * emphasis);
          break;
        case "cockatoo-beak":
          part.scale.set(1, 1 + Math.max(0, pulse) * 0.045 * emphasis, 1);
          break;
        case "glass-wings":
          part.scale.set(1 + pulse * 0.075 * emphasis, 1, 1);
          break;
        case "page-fins":
          part.scale.set(1 + pulse * 0.045 * emphasis, 1, 1);
          part.rotation.z = Math.sin(time * 1.1) * 0.025 * emphasis;
          break;
        case "surfer-feet":
          part.position.y = Math.sin(time * 2.2) * 0.035 * emphasis;
          part.rotation.z = Math.sin(time * 1.2) * 0.035 * emphasis;
          break;
        case "inner-eye":
          part.scale.set(1, 0.88 + Math.sin(time * 1.6) * 0.12, 1);
          break;
        case "orbit-ring":
          part.rotation.z = time * 0.22;
          break;
        case "heart-plume": {
          const heartbeat = Math.pow(Math.max(0, Math.sin(time * 2.8)), 8);
          part.scale.setScalar(1 + heartbeat * 0.1 * emphasis);
          break;
        }
        case "helping-arms":
          part.rotation.z = Math.sin(time * 1.45) * 0.085 * emphasis;
          break;
        case "goliath-horns":
          part.rotation.z = Math.sin(time * 1.15) * 0.045 * emphasis;
          break;
      }
    });
  });

  function setPartRef(artifactId: string, node: THREE.Group | null) {
    if (node) {
      partRefs.current.set(artifactId, node);
    } else {
      partRefs.current.delete(artifactId);
    }
  }

  return (
    <group ref={groupRef} scale={scale} rotation={[0, proportions.tilt, 0]}>
      <mesh position={[0, -0.03, 0]} scale={[proportions.width, proportions.height, 0.88]}>
        <sphereGeometry args={[0.84, 28, 28]} />
        <meshStandardMaterial color="#25222E" roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.02, 0.03]} scale={[0.76, 0.68, 0.72]}>
        <sphereGeometry args={[0.74, 26, 26]} />
        <meshStandardMaterial color="#34303E" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.02, 0.66]} scale={[0.68, 0.82, 0.13]}>
        <sphereGeometry args={[0.72, 22, 22]} />
        <SoftMaterial color={baseColor} opacity={0.22} />
      </mesh>
      {[-0.25, 0.25].map((x, index) => (
        <group
          ref={(node) => { eyeRefs.current[index] = node; }}
          key={x}
          position={[x, 1.08, 0.53]}
        >
          <mesh>
            <sphereGeometry args={[0.105, 16, 16]} />
            <meshStandardMaterial color="#F3F0E8" roughness={0.35} />
          </mesh>
          <mesh position={[x * 0.08, 0, 0.083]}>
            <sphereGeometry args={[0.047, 12, 12]} />
            <meshStandardMaterial color="#08080B" />
          </mesh>
        </group>
      ))}
      {pieces.map((piece) => (
        <group
          ref={(node) => { setPartRef(piece.artifactId, node); }}
          key={piece.artifactId}
        >
          <CreaturePartMesh key={piece.artifactId} piece={piece} />
        </group>
      ))}
    </group>
  );
}
