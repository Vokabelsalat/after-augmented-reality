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

const fishProfiles: Record<ThemeId, FishProfile> = {
  memory: { length: 1.35, height: 0.86, depth: 0.66, head: 0.74 },
  interface: { length: 1.65, height: 0.62, depth: 0.56, head: 0.6 },
  worldmaking: { length: 1.2, height: 0.98, depth: 0.72, head: 0.82 },
  embodiment: { length: 1.55, height: 0.7, depth: 0.62, head: 0.68 },
  agency: { length: 1.4, height: 0.82, depth: 0.7, head: 0.76 },
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
      roughness={0.42}
      metalness={0.1}
      transparent={opacity < 1}
      opacity={opacity}
      side={opacity < 1 ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

function FishPartMesh({ piece }: { piece: CreaturePiece }) {
  const material = <SoftMaterial color={piece.color} />;

  switch (piece.partId) {
    case "memory-crown":
      return (
        <group name={piece.partId} position={[-0.18, 0.02, 0.7]}>
          {[-0.65, -0.28, 0.1, 0.48].map((x, index) => (
            <mesh key={x} position={[x, (index % 2) * 0.18 - 0.09, 0]} scale={[1.35, 0.85, 0.18]}>
              <sphereGeometry args={[0.16, 14, 14]} />
              <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.18} roughness={0.25} />
            </mesh>
          ))}
        </group>
      );
    case "archive-ears":
      return (
        <group name={piece.partId} position={[0.52, 0, 0.4]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[0, side * 0.3, 0]} rotation={[0, 0, side * 0.16]}>
              {[0, 1, 2].map((index) => (
                <mesh key={index} position={[-index * 0.08, side * index * 0.12, 0]} rotation={[0, 0, side * -0.28]} scale={[0.5, 1, 0.22]}>
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
            <mesh key={y} position={[-0.42 - index * 0.08, y, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.35, 1 + index * 0.2, 0.28]}>
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
            <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={1.5} />
          </mesh>
        </group>
      );
    case "cockatoo-beak":
      return (
        <group name={piece.partId} position={[1.34, -0.03, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh scale={[1, 1.25, 0.86]}>
            <coneGeometry args={[0.3, 0.6, 5]} />
            {material}
          </mesh>
        </group>
      );
    case "glass-wings":
      return (
        <group name={piece.partId} position={[-0.05, -0.12, 0.62]}>
          <mesh rotation={[0.05, 0.18, -0.72]} scale={[0.62, 1.34, 0.12]}>
            <sphereGeometry args={[0.5, 18, 18]} />
            <meshStandardMaterial color={piece.color} transparent opacity={0.38} roughness={0.12} metalness={0.18} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "page-fins":
      return (
        <group name={piece.partId} position={[-0.2, 0.68, -0.04]}>
          {[-0.28, 0.18, 0.58].map((x, index) => (
            <mesh key={x} position={[x, index * 0.06, 0]} rotation={[0, 0, -0.08 + index * 0.08]} scale={[0.7, 1.1 - index * 0.12, 0.2]}>
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
            <mesh key={x} position={[x, -0.18, 0.06]} rotation={[0, 0, x < 0 ? -0.22 : 0.22]} scale={[0.7, 1.12, 0.25]}>
              <coneGeometry args={[0.24, 0.62, 5]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "inner-eye":
      return (
        <group name={piece.partId} position={[0.76, 0.42, 0.58]}>
          <mesh scale={[1.2, 0.72, 0.28]}>
            <sphereGeometry args={[0.17, 18, 18]} />
            {material}
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshStandardMaterial color="#09090D" roughness={0.3} />
          </mesh>
        </group>
      );
    case "orbit-ring":
      return (
        <group name={piece.partId} position={[-0.12, 0, 0.67]}>
          {[-0.44, 0, 0.44].map((x, index) => (
            <mesh key={x} position={[x, 0, 0]} scale={[0.38, 0.72 - Math.abs(index - 1) * 0.08, 0.12]}>
              <torusGeometry args={[0.55, 0.055, 8, 28]} />
              <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={0.32} />
            </mesh>
          ))}
        </group>
      );
    case "heart-plume":
      return (
        <group name={piece.partId} position={[0.18, -0.02, 0.75]} scale={0.58}>
          <mesh position={[-0.13, 0.12, 0]}><sphereGeometry args={[0.23, 16, 16]} />{material}</mesh>
          <mesh position={[0.13, 0.12, 0]}><sphereGeometry args={[0.23, 16, 16]} />{material}</mesh>
          <mesh position={[0, -0.16, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1.4, 0.75]}>
            <coneGeometry args={[0.31, 0.62, 4]} />
            {material}
          </mesh>
        </group>
      );
    case "helping-arms":
      return (
        <group name={piece.partId} position={[0.72, -0.34, 0.18]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0.18, side * 0.18, 0]} rotation={[0, 0, Math.PI / 2 + side * 0.18]} scale={[0.26, 1.35, 0.22]}>
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
  const finRef = useRef<THREE.Group>(null);
  const eyeRefs = useRef<Array<THREE.Group | null>>([]);
  const partRefs = useRef(new Map<string, THREE.Group>());
  const signature = pieces.map((piece) => piece.artifactId).join(":") || "new";
  const firstArtifact = pieces[0] ? artifactById.get(pieces[0].artifactId) : undefined;
  const profile = fishProfiles[firstArtifact?.theme ?? "worldmaking"];
  const proportions = useMemo(() => ({
    length: profile.length * (0.96 + hashUnit(`${signature}:length`) * 0.08),
    height: profile.height * (0.96 + hashUnit(`${signature}:height`) * 0.08),
    depth: profile.depth,
    head: profile.head,
    winkEvery: 4.2 + hashUnit(`${signature}:wink-speed`) * 3.8,
    winkOffset: hashUnit(`${signature}:wink-offset`) * 7,
  }), [profile, signature]);
  const baseColor = pieces[0]?.color ?? "#58D6FF";
  const accentColor = useMemo(
    () => new THREE.Color(baseColor).lerp(new THREE.Color("#F3F0E8"), 0.34).getStyle(),
    [baseColor],
  );

  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const elapsed = clock.elapsedTime;
    const swim = elapsed * 3.3 + hashUnit(signature) * Math.PI * 2;
    groupRef.current.position.y = Math.sin(elapsed * 1.15 + hashUnit(signature) * 5) * 0.045;
    groupRef.current.rotation.z = Math.sin(elapsed * 1.1 + proportions.winkOffset) * 0.025;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(swim) * 0.28;
    if (finRef.current) finRef.current.rotation.x = Math.sin(swim * 0.74) * 0.24;

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
          part.rotation.y = Math.sin(time * 2.6) * 0.24 * emphasis;
          break;
        case "signal-antenna":
          part.rotation.z = Math.sin(time * 1.9) * 0.08 * emphasis;
          break;
        case "cockatoo-beak":
          part.scale.set(1, 1 + Math.max(0, pulse) * 0.055 * emphasis, 1);
          break;
        case "glass-wings":
          part.rotation.x = Math.sin(time * 2.4) * 0.18 * emphasis;
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
          part.rotation.y = Math.sin(time * 1.7) * 0.18 * emphasis;
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
  const tailX = -proportions.length * 0.9;

  return (
    <group ref={groupRef} scale={scale}>
      <mesh scale={[proportions.length, proportions.height, proportions.depth]}>
        <sphereGeometry args={[0.86, 32, 26]} />
        <meshStandardMaterial color={baseColor} roughness={0.4} metalness={0.08} />
      </mesh>
      <mesh position={[headX, 0.02, 0.02]} scale={[proportions.head, proportions.height * 0.9, proportions.depth * 0.96]}>
        <sphereGeometry args={[0.7, 28, 24]} />
        <meshStandardMaterial color={baseColor} roughness={0.36} metalness={0.08} />
      </mesh>
      <mesh position={[-0.12, -0.08, proportions.depth * 0.72]} scale={[proportions.length * 0.72, proportions.height * 0.62, 0.12]}>
        <sphereGeometry args={[0.76, 24, 20]} />
        <SoftMaterial color={accentColor} opacity={0.34} />
      </mesh>

      <group ref={tailRef} position={[tailX, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[-0.32, side * 0.28, 0]} rotation={[0, 0, side * -0.54]} scale={[0.82, 1.15, 0.5]}>
            <coneGeometry args={[0.42, 0.92, 5]} />
            <SoftMaterial color={accentColor} opacity={0.82} />
          </mesh>
        ))}
      </group>

      <group ref={finRef} position={[-0.1, -0.08, proportions.depth * 0.78]}>
        <mesh rotation={[0.18, 0, -0.72]} scale={[0.72, 1.2, 0.16]}>
          <coneGeometry args={[0.32, 0.78, 5]} />
          <SoftMaterial color={accentColor} opacity={0.7} />
        </mesh>
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
            <meshStandardMaterial color="#F3F0E8" roughness={0.28} />
          </mesh>
          <mesh position={[0.025, 0, side * 0.1]}>
            <sphereGeometry args={[0.062, 14, 14]} />
            <meshStandardMaterial color="#07080A" roughness={0.2} />
          </mesh>
        </group>
      ))}

      <mesh position={[headX + proportions.head * 0.62, -0.18, proportions.depth * 0.45]} scale={[1.1, 0.55, 0.3]}>
        <torusGeometry args={[0.15, 0.035, 8, 24]} />
        <meshStandardMaterial color={accentColor} roughness={0.32} />
      </mesh>

      {pieces.map((piece) => (
        <group ref={(node) => { setPartRef(piece.artifactId, node); }} key={piece.artifactId}>
          <FishPartMesh piece={piece} />
        </group>
      ))}
    </group>
  );
}
