import * as THREE from "three";
import type { ExhibitionArtifact, ParticleFormId } from "@/types/exhibition";

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

type Point3 = [number, number, number];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const dodecahedronTriangles = (() => {
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const positions = geometry.getAttribute("position");
  const triangles: [Point3, Point3, Point3][] = [];

  for (let index = 0; index < positions.count; index += 3) {
    triangles.push([
      [positions.getX(index), positions.getY(index), positions.getZ(index)],
      [
        positions.getX(index + 1),
        positions.getY(index + 1),
        positions.getZ(index + 1),
      ],
      [
        positions.getX(index + 2),
        positions.getY(index + 2),
        positions.getZ(index + 2),
      ],
    ]);
  }

  geometry.dispose();
  return triangles;
})();

function sampleSphere(
  index: number,
  count: number,
  radius: Point3 = [1, 1, 1],
): Point3 {
  const y = 1 - ((index + 0.5) / Math.max(count, 1)) * 2;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = index * GOLDEN_ANGLE;
  return [
    Math.cos(angle) * ringRadius * radius[0],
    y * radius[1],
    Math.sin(angle) * ringRadius * radius[2],
  ];
}

function sampleSegment(
  start: Point3,
  end: Point3,
  progress: number,
  random: () => number,
  thickness = 0.06,
): Point3 {
  return [
    THREE.MathUtils.lerp(start[0], end[0], progress) +
      (random() - 0.5) * thickness,
    THREE.MathUtils.lerp(start[1], end[1], progress) +
      (random() - 0.5) * thickness,
    THREE.MathUtils.lerp(start[2], end[2], progress) +
      (random() - 0.5) * thickness,
  ];
}

function sampleTriangle(
  a: Point3,
  b: Point3,
  c: Point3,
  random: () => number,
): Point3 {
  const root = Math.sqrt(random());
  const second = random();
  const aWeight = 1 - root;
  const bWeight = root * (1 - second);
  const cWeight = root * second;
  return [
    a[0] * aWeight + b[0] * bWeight + c[0] * cWeight,
    a[1] * aWeight + b[1] * bWeight + c[1] * cWeight,
    a[2] * aWeight + b[2] * bWeight + c[2] * cWeight,
  ];
}

function formationPosition(
  particleForm: ParticleFormId,
  index: number,
  count: number,
  random: () => number,
): Point3 {
  const progress = (index + 0.5) / Math.max(count, 1);
  const jitter = (amount = 0.08) => (random() - 0.5) * amount;

  switch (particleForm) {
    case "torus": {
      const around = index * GOLDEN_ANGLE;
      const through = random() * Math.PI * 2;
      const radius = 0.72 + Math.cos(through) * 0.3;
      return [
        Math.cos(around) * radius,
        Math.sin(around) * radius * 0.82,
        Math.sin(through) * 0.3,
      ];
    }

    case "triad": {
      const cluster = index % 3;
      const localIndex = Math.floor(index / 3);
      const localCount = Math.ceil(count / 3);
      const point = sampleSphere(localIndex, localCount, [0.35, 0.4, 0.3]);
      return [
        point[0] + (cluster - 1) * 0.72,
        point[1] + (cluster === 1 ? 0.2 : -0.18),
        point[2],
      ];
    }

    case "tree": {
      const trunkCount = Math.max(1, Math.floor(count * 0.25));
      const branchCount = Math.max(1, Math.floor(count * 0.5));
      if (index < trunkCount) {
        return sampleSegment(
          [0, -1.05, 0],
          [0, -0.08, 0],
          index / trunkCount,
          random,
          0.14,
        );
      }
      if (index < trunkCount + branchCount) {
        const branchIndex = (index - trunkCount) % 7;
        const positionOnBranch =
          Math.floor((index - trunkCount) / 7) /
          Math.max(1, Math.ceil(branchCount / 7) - 1);
        const angle = THREE.MathUtils.lerp(0.32, Math.PI - 0.32, branchIndex / 6);
        return sampleSegment(
          [0, -0.12, 0],
          [
            Math.cos(angle) * 0.92,
            0.18 + Math.sin(angle) * 0.72,
            Math.sin(branchIndex * 2.1) * 0.24,
          ],
          Math.min(positionOnBranch, 1),
          random,
          0.09,
        );
      }
      const point = sampleSphere(
        index - trunkCount - branchCount,
        Math.max(1, count - trunkCount - branchCount),
        [1.02, 0.62, 0.4],
      );
      return [point[0], point[1] + 0.42, point[2]];
    }

    case "cuboid": {
      const face = index % 6;
      const a = random() * 2 - 1;
      const b = random() * 2 - 1;
      const half: Point3 = [1.02, 0.72, 0.42];
      let point: Point3;
      if (face < 2) point = [(face ? -1 : 1) * half[0], a * half[1], b * half[2]];
      else if (face < 4) point = [a * half[0], (face === 3 ? -1 : 1) * half[1], b * half[2]];
      else point = [a * half[0], b * half[1], (face === 5 ? -1 : 1) * half[2]];
      const glitchBand = Math.floor((point[1] + half[1]) * 7);
      point[0] += glitchBand % 4 === 0 ? (glitchBand % 8 ? 0.13 : -0.13) : 0;
      return point;
    }

    case "nest": {
      const ring = index % 9;
      const radius = 0.3 + ring * 0.085;
      const angle = Math.floor(index / 9) * GOLDEN_ANGLE + ring * 0.18;
      return [
        Math.cos(angle) * radius * 1.2,
        -0.58 + radius * radius * 0.82 + jitter(0.05),
        Math.sin(angle) * radius * 0.56,
      ];
    }

    case "prism": {
      const vertices: Point3[] = [
        [-0.92, -0.68, 0],
        [0.92, -0.68, 0],
        [0, 0.94, 0],
      ];
      const face = index % 5;
      if (face < 2) {
        const point = sampleTriangle(vertices[0], vertices[1], vertices[2], random);
        point[2] = face === 0 ? -0.4 : 0.4;
        return point;
      }
      const edge = face - 2;
      const start = vertices[edge];
      const end = vertices[(edge + 1) % 3];
      const along = random();
      return [
        THREE.MathUtils.lerp(start[0], end[0], along),
        THREE.MathUtils.lerp(start[1], end[1], along),
        (random() - 0.5) * 0.8,
      ];
    }

    case "book": {
      const side = index % 2 === 0 ? -1 : 1;
      const distanceFromSpine = 0.05 + random() * 1.02;
      const y = (random() - 0.5) * 1.45;
      return [
        side * distanceFromSpine,
        y * (1 - distanceFromSpine * 0.08),
        0.24 - distanceFromSpine * 0.34 + jitter(0.035),
      ];
    }

    case "skateboard": {
      if (progress < 0.76) {
        const x = (random() - 0.5) * 2.2;
        const roundedEnd = Math.max(0, (Math.abs(x) - 0.75) / 0.35);
        const halfWidth = 0.34 * Math.sqrt(Math.max(0, 1 - roundedEnd * roundedEnd));
        return [
          x,
          0.12 + (random() * 2 - 1) * halfWidth,
          0.04 + Math.max(0, Math.abs(x) - 0.75) * 0.38 + jitter(0.04),
        ];
      }
      const wheel = index % 2 === 0 ? -1 : 1;
      const angle = random() * Math.PI * 2;
      return [
        wheel * 0.72 + Math.cos(angle) * 0.17,
        -0.34 + Math.sin(angle) * 0.17,
        jitter(0.28),
      ];
    }

    case "sphere":
      return sampleSphere(index, count, [0.92, 0.92, 0.7]);

    case "tower": {
      if (progress > 0.88) {
        return sampleSegment(
          [0, 0.68, 0],
          [0, 1.16, 0],
          (progress - 0.88) / 0.12,
          random,
          0.08,
        );
      }
      const y = -1 + random() * 1.72;
      const level = Math.floor((y + 1) / 0.28);
      const halfWidth = 0.72 - Math.min(level, 5) * 0.065;
      const face = index % 4;
      const depth = (random() - 0.5) * 0.72;
      if (face < 2) return [(face ? -1 : 1) * halfWidth, y, depth];
      return [(random() * 2 - 1) * halfWidth, y, (face === 3 ? -1 : 1) * 0.36];
    }

    case "pillar": {
      const y = -1.05 + progress * 2.1;
      const atEnd = Math.abs(y) > 0.78;
      const halfWidth = atEnd ? 0.62 : 0.32;
      const face = index % 4;
      if (face < 2) return [(face ? -1 : 1) * halfWidth, y, jitter(0.52)];
      return [jitter(halfWidth * 2), y, (face === 3 ? -1 : 1) * 0.26];
    }

    case "fork": {
      const trunkCount = Math.max(1, Math.floor(count * 0.42));
      if (index < trunkCount) {
        return sampleSegment(
          [0, -1.05, 0],
          [0, -0.1, 0],
          index / trunkCount,
          random,
          0.1,
        );
      }
      const branchIndex = (index - trunkCount) % 3;
      const positionOnBranch =
        Math.floor((index - trunkCount) / 3) /
        Math.max(1, Math.ceil((count - trunkCount) / 3) - 1);
      const ends: Point3[] = [
        [-0.92, 0.9, -0.08],
        [0, 1.04, 0.18],
        [0.92, 0.9, -0.08],
      ];
      return sampleSegment(
        [0, -0.12, 0],
        ends[branchIndex],
        Math.min(positionOnBranch, 1),
        random,
        0.1,
      );
    }

    case "dodecahedron": {
      const triangle =
        dodecahedronTriangles[
          Math.floor(random() * dodecahedronTriangles.length)
        ];
      const point = sampleTriangle(triangle[0], triangle[1], triangle[2], random);
      return [point[0] * 0.9, point[1] * 0.9, point[2] * 0.68];
    }

    case "crystal": {
      const crystal = index % 5;
      const centers = [-0.7, -0.34, 0, 0.36, 0.7];
      const heights = [1.15, 1.55, 2.05, 1.45, 1.1];
      const localProgress = random();
      const height = heights[crystal];
      const radius = 0.2 * (1 - Math.max(0, localProgress - 0.72) / 0.28);
      const angle = ((index % 4) / 4) * Math.PI * 2;
      return [
        centers[crystal] + Math.cos(angle) * radius,
        -1 + localProgress * height,
        Math.sin(angle) * radius,
      ];
    }

    case "hourglass": {
      const y = -1 + progress * 2;
      const radius = 0.14 + Math.abs(y) * 0.68;
      const angle = index * GOLDEN_ANGLE;
      return [
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius * 0.58,
      ];
    }

    case "spiral": {
      const angle = progress * Math.PI * 18;
      const radius = 0.18 + progress * 0.72;
      return [
        Math.cos(angle) * radius,
        -1 + progress * 2,
        Math.sin(angle) * radius * 0.55,
      ];
    }

    default: {
      const exhaustiveCheck: never = particleForm;
      throw new Error(`Unsupported particle form: ${exhaustiveCheck}`);
    }
  }
}

type FormationArtifact = Pick<ExhibitionArtifact, "id" | "particleForm">;

export function createArtifactFormationPositions(
  artifact: FormationArtifact,
  count: number,
) {
  const random = seededRandom(`${artifact.id}:formation`);
  const formation = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const target = formationPosition(
      artifact.particleForm,
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
    const radialAngle = random() * Math.PI * 2;
    const sourceRadius =
      index % 3 === 0
        ? 1.03 + (random() - 0.5) * 0.08
        : Math.sqrt(random()) * 0.96;
    const sourceX = Math.cos(radialAngle) * sourceRadius;
    const sourceY = Math.sin(radialAngle) * sourceRadius;
    const sourceZ = (random() - 0.5) * 0.05;
    const releaseAngle = radialAngle + (random() - 0.5) * 0.16;
    const releaseRadius = 3.2 + random() * 1.1;
    source[offset] = sourceX;
    source[offset + 1] = sourceY;
    source[offset + 2] = sourceZ;

    release[offset] = Math.cos(releaseAngle) * releaseRadius;
    release[offset + 1] = Math.sin(releaseAngle) * releaseRadius;
    release[offset + 2] = 0.45 + random() * 0.9;

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
    if (count <= 5) {
      const x = (index - (count - 1) / 2) * (count > 2 ? 1.3 : 1.85);
      const y = Math.sin(index * 2.15 + count) * 0.48;
      return new THREE.Vector3(x, y, (index % 2) * 0.15);
    }

    const columns = Math.min(4, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / columns);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const itemsInRow = Math.min(columns, count - row * columns);
    const x = (column - (itemsInRow - 1) / 2) * 1.42;
    const y = ((rows - 1) / 2 - row) * 1.3;
    return new THREE.Vector3(x, y, ((column + row) % 2) * 0.12);
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
