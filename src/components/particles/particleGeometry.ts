import * as THREE from "three";
import type { ExhibitionArtifact, ThemeId } from "@/types/exhibition";

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seedValue: string) {
  let seed = hashString(seedValue);
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function formationPosition(
  theme: ThemeId,
  index: number,
  count: number,
  random: () => number,
) {
  const progress = index / count;
  const angle = progress * Math.PI * 18 + random() * 0.35;
  const jitter = () => (random() - 0.5) * 0.16;

  if (theme === "memory") {
    const radius = 0.24 + progress * 1.18;
    return [
      Math.cos(angle) * radius + jitter(),
      Math.sin(angle) * radius * 0.62 + jitter(),
      jitter(),
    ];
  }

  if (theme === "machine") {
    const columns = 34;
    const x = ((index % columns) / (columns - 1) - 0.5) * 2.45;
    const y = (Math.floor(index / columns) / Math.ceil(count / columns) - 0.5) * 1.55;
    return [x + jitter() * 0.3, y + Math.sin(x * 5) * 0.12, jitter()];
  }

  if (theme === "body") {
    const y = (progress - 0.5) * 2.45;
    const bodyWidth = 0.32 + Math.sin(progress * Math.PI) * 0.72;
    const side = index % 2 === 0 ? -1 : 1;
    return [side * bodyWidth * random() + jitter(), y + jitter(), jitter()];
  }

  const radius = 0.5 + random();
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * 0.7,
    jitter(),
  ];
}

type FormationArtifact = Pick<ExhibitionArtifact, "id" | "theme">;

export function createArtifactFormationPositions(
  artifact: FormationArtifact,
  count: number,
) {
  const random = seededRandom(`${artifact.id}:formation`);
  const formation = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const target = formationPosition(
      artifact.theme,
      index,
      count,
      random,
    );
    formation[offset] = target[0];
    formation[offset + 1] = target[1] + 0.32;
    formation[offset + 2] = target[2] + 0.35;
  }

  return formation;
}

export function createNarrativeGeometry(
  artifact: ExhibitionArtifact,
  count: number,
) {
  const random = seededRandom(`${artifact.id}:release`);
  const source = new Float32Array(count * 3);
  const release = new Float32Array(count * 3);
  const formation = createArtifactFormationPositions(artifact, count);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const sourceX = (random() - 0.5) * 2.75;
    const sourceY = (random() - 0.5) * 5;
    const sourceZ = (random() - 0.5) * 0.05;
    const radialAngle = Math.atan2(sourceY, sourceX) + (random() - 0.5);
    const force = 0.65 + random() * 1.5;
    source[offset] = sourceX;
    source[offset + 1] = sourceY;
    source[offset + 2] = sourceZ;

    release[offset] = sourceX + Math.cos(radialAngle) * force;
    release[offset + 1] = sourceY + Math.sin(radialAngle) * force;
    release[offset + 2] = 1.2 + random() * 2.1;

    seeds[index] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(source, 3));
  geometry.setAttribute("aSource", new THREE.BufferAttribute(source, 3));
  geometry.setAttribute("aRelease", new THREE.BufferAttribute(release, 3));
  geometry.setAttribute("aFormation", new THREE.BufferAttribute(formation, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export type ConstellationGeometryData = {
  particleGeometry: THREE.BufferGeometry;
  lineGeometry: THREE.BufferGeometry;
  centers: THREE.Vector3[];
};

export function createConstellationGeometry(
  discoveredArtifacts: ExhibitionArtifact[],
  particlesPerCluster: number,
): ConstellationGeometryData {
  const total = Math.max(discoveredArtifacts.length, 1) * particlesPerCluster;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const seeds = new Float32Array(total);
  const centers = discoveredArtifacts.map((artifact, index) => {
    const count = discoveredArtifacts.length;
    const x = (index - (count - 1) / 2) * (count > 2 ? 1.55 : 1.85);
    const y = Math.sin(index * 2.15 + count) * 0.48;
    return new THREE.Vector3(x, y, (index % 2) * 0.15);
  });

  discoveredArtifacts.forEach((artifact, clusterIndex) => {
    const random = seededRandom(`${artifact.id}:constellation:${clusterIndex}`);
    const color = new THREE.Color(artifact.color);
    const center = centers[clusterIndex];

    for (let index = 0; index < particlesPerCluster; index += 1) {
      const particleIndex = clusterIndex * particlesPerCluster + index;
      const offset = particleIndex * 3;
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 1.8) * (0.48 + clusterIndex * 0.06);
      const depth = (random() - 0.5) * 0.55;
      const brightness = 0.58 + random() * 0.42;

      positions[offset] = center.x + Math.cos(angle) * radius;
      positions[offset + 1] = center.y + Math.sin(angle) * radius * 0.82;
      positions[offset + 2] = center.z + depth;
      colors[offset] = color.r * brightness;
      colors[offset + 1] = color.g * brightness;
      colors[offset + 2] = color.b * brightness;
      seeds[particleIndex] = random();
    }
  });

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  particleGeometry.computeBoundingSphere();

  const linePositions = new Float32Array(Math.max(centers.length - 1, 0) * 6);
  for (let index = 0; index < centers.length - 1; index += 1) {
    centers[index].toArray(linePositions, index * 6);
    centers[index + 1].toArray(linePositions, index * 6 + 3);
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(linePositions, 3),
  );

  return { particleGeometry, lineGeometry, centers };
}
