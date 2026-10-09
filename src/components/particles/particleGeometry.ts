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

// The 30 outer edges (EdgesGeometry drops the face triangulation seams) and
// 20 corners, which carry most particles so the solid reads as a wireframe.
const dodecahedronEdges = (() => {
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const positions = edgesGeometry.getAttribute("position");
  const edges: [Point3, Point3][] = [];

  for (let index = 0; index < positions.count; index += 2) {
    edges.push([
      [positions.getX(index), positions.getY(index), positions.getZ(index)],
      [positions.getX(index + 1), positions.getY(index + 1), positions.getZ(index + 1)],
    ]);
  }

  geometry.dispose();
  edgesGeometry.dispose();
  return edges;
})();

const dodecahedronVertices = (() => {
  const vertices = new Map<string, Point3>();
  dodecahedronEdges.flat().forEach((point) => {
    vertices.set(point.map((value) => value.toFixed(4)).join(","), point);
  });
  return [...vertices.values()];
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

const BRAIN_GYRUS_LENGTH = 16;

// Walks a seeded, meandering path across one hemisphere so neighbouring
// particles trace gyri instead of filling the surface uniformly.
function sampleBrainGyrus(strand: number, step: number): Point3 {
  const random = seededRandom(`brain-gyrus:${strand}`);
  const side = strand % 2 === 0 ? -1 : 1;
  let polar = THREE.MathUtils.lerp(0.14, 0.82, random()) * Math.PI;
  let azimuth = random() * Math.PI * 2;
  let heading = random() * Math.PI * 2;

  for (let walked = 0; walked < step; walked += 1) {
    heading += (random() - 0.5) * 1.5;
    polar += Math.cos(heading) * 0.1;
    azimuth += (Math.sin(heading) * 0.1) / Math.max(Math.sin(polar), 0.3);
    if (polar < 0.08 * Math.PI || polar > 0.9 * Math.PI) {
      polar = THREE.MathUtils.clamp(polar, 0.08 * Math.PI, 0.9 * Math.PI);
      heading = Math.PI - heading;
    }
  }

  const x = Math.sin(polar) * Math.cos(azimuth);
  let y = Math.cos(polar) * 0.74 * (1 - Math.max(0, x) * 0.12);
  if (y < -0.25) y = -0.25 + (y + 0.25) * 0.45;
  const z = Math.abs(Math.sin(polar) * Math.sin(azimuth));
  return [x, y + 0.08, side * (0.06 + z * 0.7)];
}

// A deck with concave and kicktails, two trucks and four wheels, modelled
// lying flat and then tipped towards the viewer so the deck surface reads.
function sampleSkateboard(progress: number, random: () => number): Point3 {
  const wheelX = 0.66;
  let point: Point3;

  if (progress < 0.6) {
    const x = (random() * 2 - 1) * 1.1;
    const roundedEnd = Math.max(0, (Math.abs(x) - 0.8) / 0.3);
    const halfWidth = 0.3 * Math.sqrt(Math.max(0, 1 - roundedEnd * roundedEnd));
    const z = random() < 0.4 ? (random() < 0.5 ? -1 : 1) * halfWidth : (random() * 2 - 1) * halfWidth;
    const kick = Math.max(0, Math.abs(x) - 0.72);
    point = [x, kick * kick * 1.6 + z * z * 0.4 + (random() - 0.5) * 0.02, z];
  } else if (progress < 0.7) {
    const truck = random() < 0.5 ? -1 : 1;
    point =
      random() < 0.7
        ? sampleSegment([truck * wheelX, -0.16, -0.26], [truck * wheelX, -0.16, 0.26], random(), random, 0.03)
        : sampleSegment([truck * wheelX, -0.03, 0], [truck * wheelX * 0.94, -0.16, 0], random(), random, 0.07);
  } else {
    const wheel = Math.floor(random() * 4);
    const angle = random() * Math.PI * 2;
    const rim = random() < 0.75 ? 0.1 : random() * 0.1;
    point = [
      (wheel < 2 ? -1 : 1) * wheelX + Math.cos(angle) * rim,
      -0.2 + Math.sin(angle) * rim,
      (wheel % 2 ? 1 : -1) * 0.33 + (random() - 0.5) * 0.08,
    ];
  }

  const roll = 0.12;
  const x = point[0] * Math.cos(roll) - point[1] * Math.sin(roll);
  const y = point[0] * Math.sin(roll) + point[1] * Math.cos(roll) + 0.04;
  const tip = -0.6;
  return [
    x,
    y * Math.cos(tip) - point[2] * Math.sin(tip),
    y * Math.sin(tip) + point[2] * Math.cos(tip),
  ];
}

const GALAXY_ARMS = 2;
const GALAXY_WINDING = Math.PI * 2.3;
const GALAXY_TILT = 0.42;

// Roughly normal noise in [-1, 1], denser towards zero.
function centeredNoise(random: () => number) {
  return (random() + random() + random()) / 1.5 - 1;
}

// A spiral galaxy: a bright core bulge, two arms winding outwards along a
// logarithmic spiral that widen and thin out, and a faint scattered disc.
// The disc faces the viewer, tilted back just enough to read as a plane.
function sampleGalaxy(progress: number, random: () => number): Point3 {
  let x: number;
  let y: number;
  let thickness: number;

  if (progress < 0.16) {
    const angle = random() * Math.PI * 2;
    const radius = 0.24 * Math.pow(random(), 1.6);
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
    thickness = centeredNoise(random) * 0.12 * (1 - radius / 0.24);
  } else if (progress < 0.82) {
    const arm = Math.floor(random() * GALAXY_ARMS);
    const along = Math.pow(random(), 0.8);
    const radius = 0.16 * Math.exp(along * Math.log(1.02 / 0.16));
    const angle = (arm / GALAXY_ARMS) * Math.PI * 2 + along * GALAXY_WINDING;
    const spread = 0.025 + along * 0.09;
    x = Math.cos(angle) * radius + centeredNoise(random) * spread;
    y = Math.sin(angle) * radius + centeredNoise(random) * spread;
    thickness = centeredNoise(random) * 0.03;
  } else {
    const angle = random() * Math.PI * 2;
    const radius = 0.2 + Math.pow(random(), 0.7) * 0.9;
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
    thickness = centeredNoise(random) * 0.04;
  }

  return [
    x,
    y * Math.cos(GALAXY_TILT) - thickness * Math.sin(GALAXY_TILT),
    y * Math.sin(GALAXY_TILT) + thickness * Math.cos(GALAXY_TILT),
  ];
}

// Upper and lower wing as rotated ellipses: centre, radii and tilt for the
// right-hand side; the left side mirrors them.
const butterflyWings = [
  { center: [0.52, 0.34], radius: [0.56, 0.4], angle: 0.5 },
  { center: [0.4, -0.34], radius: [0.4, 0.28], angle: -0.65 },
] as const;

// Four wings with crisp outlines, raised into a shallow V, around a slim
// body with two curling antennae.
function sampleButterfly(progress: number, random: () => number): Point3 {
  if (progress < 0.84) {
    const side = random() < 0.5 ? -1 : 1;
    const wing = butterflyWings[random() < 0.62 ? 0 : 1];
    const angle = random() * Math.PI * 2;
    const extent = random() < 0.45 ? 1 : Math.sqrt(random());
    const localX = Math.cos(angle) * wing.radius[0] * extent;
    const localY = Math.sin(angle) * wing.radius[1] * extent;
    const x =
      wing.center[0] + localX * Math.cos(wing.angle) - localY * Math.sin(wing.angle);
    const y =
      wing.center[1] + localX * Math.sin(wing.angle) + localY * Math.cos(wing.angle);
    return [side * x, y, x * 0.32 + (random() - 0.5) * 0.02];
  }

  if (progress < 0.94) {
    return sampleSegment([0, -0.62, 0], [0, 0.42, 0], random(), random, 0.08);
  }

  const side = random() < 0.5 ? -1 : 1;
  const along = random();
  return [
    side * (along * 0.3 + Math.max(0, along - 0.8) * 0.4),
    0.42 + along * 0.5 - Math.max(0, along - 0.8) * 0.3,
    along * 0.08,
  ];
}

// A fish in profile, swimming toward +x.
function sampleFish(index: number, count: number, progress: number, random: () => number): Point3 {
  const bodyCount = Math.floor(count * 0.58);
  if (index < bodyCount) {
    const point = sampleSphere(index, bodyCount, [0.78, 0.46, 0.26]);
    return [point[0] + 0.1, point[1], point[2]];
  }
  if (progress < 0.76) {
    const side = random() < 0.5 ? -1 : 1;
    const point = sampleTriangle([-0.6, 0, 0], [-1.08, side * 0.56, 0], [-0.9, side * 0.04, 0], random);
    return [point[0], point[1], (random() - 0.5) * 0.05];
  }
  if (progress < 0.87) {
    const point = sampleTriangle([-0.28, 0.4, 0], [0.24, 0.44, 0], [-0.36, 0.8, 0], random);
    return [point[0], point[1], (random() - 0.5) * 0.05];
  }
  if (progress < 0.94) {
    const point = sampleTriangle([0.06, -0.38, 0], [0.34, -0.42, 0], [-0.1, -0.66, 0], random);
    return [point[0], point[1], (random() - 0.5) * 0.05];
  }
  const angle = random() * Math.PI * 2;
  return [0.6 + Math.cos(angle) * 0.075, 0.12 + Math.sin(angle) * 0.075, 0.24];
}

// The same pseudo-random value for every particle of one feather.
function unitHash(value: number) {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return hashed - Math.floor(hashed);
}

// Each crest feather: where it roots on the crown (angle around the head),
// its lean from upright (negative leans back) and its length.
const crestFeathers: Array<[number, number, number]> = [
  [0.86, -1.08, 0.92], [0.8, -0.84, 1.2], [0.74, -0.6, 1.44], [0.67, -0.38, 1.6],
  [0.6, -0.16, 1.56], [0.53, 0.06, 1.36], [0.46, 0.26, 1.06],
];
const crestHead = { x: 0.04, y: -0.78, width: 0.42, height: 0.36, depth: 0.32 };

// A point on the head's surface in the direction (dx, dy, dz). The skull
// narrows towards the face and flattens a little under the chin.
function crestHeadSurface(dx: number, dy: number, dz: number): Point3 {
  const length = Math.hypot(dx, dy, dz) || 1;
  const [nx, ny, nz] = [dx / length, dy / length, dz / length];
  const narrowing = 1 - 0.32 * Math.max(0, nx);
  const chin = ny < 0 ? 1 - 0.18 * ny * ny : 1;
  return [
    crestHead.x + nx * crestHead.width,
    crestHead.y + ny * crestHead.height * chin,
    nz * crestHead.depth * narrowing,
  ];
}

// A point on a tube of the given radius around a centre line, with a flattened side.
function aroundTube(center: [number, number], direction: number, radius: number, angle: number, width = 0.8): Point3 {
  return [
    center[0] - Math.sin(direction) * Math.cos(angle) * radius,
    center[1] + Math.cos(direction) * Math.cos(angle) * radius,
    Math.sin(angle) * radius * width,
  ];
}

// The fortune-telling cockatoo's raised crest: a fan of feathers rooted along
// its crown, sweeping back and up and hooking forward at the tips, each a
// shaft with a tapering vane. Below sit the rounded head, its two eyes, the
// hooked beak and a short neck.
function sampleCrest(progress: number, random: () => number): Point3 {
  if (progress < 0.2) {
    // The head as contour lines, so it reads as a rounded volume from any
    // side: rings around the skull from neck to face, its profile and its
    // outline seen from above.
    const line = random();
    const angle = random() * Math.PI * 2;
    if (line < 0.62) {
      const along = -0.84 + Math.floor(random() * 6) * 0.336;
      const ring = Math.sqrt(1 - along * along);
      return crestHeadSurface(along, Math.cos(angle) * ring, Math.sin(angle) * ring);
    }
    if (line < 0.92) {
      return line < 0.8
        ? crestHeadSurface(Math.cos(angle), Math.sin(angle), 0)
        : crestHeadSurface(Math.cos(angle), 0, Math.sin(angle));
    }
    const y = random() * 2 - 1;
    const ring = Math.sqrt(1 - y * y);
    return crestHeadSurface(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
  }

  if (progress < 0.24) {
    // One eye on each side of the head: a ring around a pupil, set into the skin.
    const side = random() < 0.5 ? -1 : 1;
    const [ex, ey, ez] = crestHeadSurface(0.42, 0.2, side * 0.88);
    const angle = random() * Math.PI * 2;
    const radius = random() < 0.65 ? 0.075 : 0.028;
    return [ex + Math.cos(angle) * radius, ey + Math.sin(angle) * radius, ez + side * 0.02];
  }

  if (progress < 0.295) {
    // The hooked upper beak: a tube that leaves the face, arcs over and
    // tapers to a point curling down and back. Particles follow the tube's
    // girth, so the thin tip stays sparse instead of bunching up.
    const t = 1 - Math.sqrt(random());
    const arc = 1.25 - t * 2.45;
    const center: [number, number] = [0.42 + Math.cos(arc) * 0.2, -0.92 + Math.sin(arc) * 0.2];
    return aroundTube(center, arc + Math.PI / 2, 0.13 * (1 - t) + 0.012, random() * Math.PI * 2);
  }

  if (progress < 0.315) {
    // The smaller lower beak, tucked under the hook well short of its tip.
    const t = 1 - Math.sqrt(random());
    const center: [number, number] = [0.38 + t * 0.1, -1.0 - t * 0.03];
    return aroundTube(center, -0.25, 0.065 * (1 - t) + 0.012, random() * Math.PI * 2);
  }

  if (progress < 0.35) {
    // A short neck, fading out below the back of the head.
    const t = random();
    const angle = random() * Math.PI * 2;
    const radius = 0.27 + t * 0.05;
    return [-0.06 + Math.cos(angle) * radius, -1.02 - t * 0.3, Math.sin(angle) * radius * 0.9];
  }

  const feather = Math.floor(random() * crestFeathers.length);
  const [root, tilt, length] = crestFeathers[feather];
  const t = random();
  const along = t * length;
  const baseX = crestHead.x + Math.cos(root * Math.PI) * crestHead.width;
  const baseY = crestHead.y + Math.sin(root * Math.PI) * crestHead.height;
  // Tips hook forward (+x) and down, and each feather bows out of the plane.
  const hook = t * t * t;
  const x = baseX + Math.sin(tilt) * along + hook * 0.48;
  const y = baseY + Math.cos(tilt) * along - hook * 0.22;
  const z = Math.sin(t * Math.PI) * (0.1 + unitHash(feather) * 0.12);
  // Most particles trace the shaft and the two edges of the vane.
  const vaneWidth = 0.12 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (0.85 + unitHash(feather + 10) * 0.3);
  const strand = random();
  const offset =
    strand < 0.3 ? 0 : strand < 0.8 ? (strand < 0.55 ? -1 : 1) * vaneWidth : (random() * 2 - 1) * vaneWidth;
  return [
    x + Math.cos(tilt) * offset,
    y - Math.sin(tilt) * offset,
    z + (random() - 0.5) * 0.03,
  ];
}

// Bar and gap widths of the barcode, in modules, alternating from a bar.
const barcodeModules = [3, 2, 1, 2, 4, 3, 2, 2, 1, 2, 3, 3, 1, 2, 2];
// The x range of every bar, spread over [-1, 1].
const barcodeBars = (() => {
  const total = barcodeModules.reduce((sum, width) => sum + width, 0);
  const bars: Array<[number, number]> = [];
  let x = -1;
  barcodeModules.forEach((width, index) => {
    const next = x + (width / total) * 2;
    if (index % 2 === 0) bars.push([x, next]);
    x = next;
  });
  return bars;
})();

// A violet crescent moon cut into the bars of a barcode, with a few square
// stickers that have drifted away from it.
function sampleCrescent(index: number, random: () => number): Point3 {
  if (index % 9 === 0) {
    const stickers: Array<[number, number]> = [[0.84, 0.86], [1.04, 0.3], [0.72, -0.9], [-0.84, -1.08]];
    const [x, y] = stickers[Math.floor(random() * stickers.length)];
    const half = 0.13;
    const along = random() * 8;
    const side = Math.floor(along / 2);
    const offset = (along % 2) - 1;
    const point: [number, number] =
      side === 0 ? [offset, -1] : side === 1 ? [1, offset] : side === 2 ? [-offset, 1] : [-1, -offset];
    return [x + point[0] * half, y + point[1] * half, (random() - 0.5) * 0.03];
  }

  // A solid crescent: the outline of a moon with a disc cut away, swelling
  // into a lens that is thickest midway between its two edges. Particles lie
  // on its front and back faces, which meet along the rim.
  const shadowCenter = [0.42, 0.14];
  const shadowRadius = 0.86;
  let point: Point3 = [-0.8, 0, 0];
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const radius = Math.sqrt(random());
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const toInnerEdge = Math.hypot(x - shadowCenter[0], y - shadowCenter[1]) - shadowRadius;
    const onBar = barcodeBars.some(([from, to]) => x >= from && x <= to);
    const thickness = 0.8 * Math.sqrt(Math.max(0, Math.min(1 - radius, toInnerEdge)));
    point = [x, y, (random() < 0.5 ? -1 : 1) * thickness];
    if (toInnerEdge > 0 && onBar) break;
  }
  return point;
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
      const half: Point3 = [0.95, 0.7, 0.5];
      let point: Point3;
      if (progress < 0.66) {
        // One of the 12 edges: pick the axis it runs along and a corner sign
        // for each of the other two axes.
        const axis = Math.floor(random() * 3);
        const signA = random() < 0.5 ? -1 : 1;
        const signB = random() < 0.5 ? -1 : 1;
        const along = (random() * 2 - 1) * half[axis];
        const [first, second] = [0, 1, 2].filter((other) => other !== axis);
        point = [0, 0, 0];
        point[axis] = along;
        point[first] = signA * half[first] + jitter(0.025);
        point[second] = signB * half[second] + jitter(0.025);
      } else if (progress < 0.76) {
        point = half.map(
          (extent) => (random() < 0.5 ? -1 : 1) * extent + jitter(0.07),
        ) as Point3;
      } else {
        const face = index % 6;
        const a = random() * 2 - 1;
        const b = random() * 2 - 1;
        if (face < 2) point = [(face ? -1 : 1) * half[0], a * half[1], b * half[2]];
        else if (face < 4) point = [a * half[0], (face === 3 ? -1 : 1) * half[1], b * half[2]];
        else point = [a * half[0], b * half[1], (face === 5 ? -1 : 1) * half[2]];
      }
      // Horizontal glitch bands slide sideways, breaking the edges.
      const glitchBand = Math.floor((point[1] + half[1]) * 7);
      point[0] += glitchBand % 4 === 0 ? (glitchBand % 8 ? 0.13 : -0.13) : 0;
      return point;
    }

    case "crest":
      return sampleCrest(progress, random);

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

    case "skateboard":
      return sampleSkateboard(progress, random);

    case "brain": {
      const cortexCount = Math.floor(count * 0.82);
      if (index < cortexCount) {
        const point = sampleBrainGyrus(
          Math.floor(index / BRAIN_GYRUS_LENGTH),
          index % BRAIN_GYRUS_LENGTH,
        );
        return [point[0] + jitter(0.03), point[1] + jitter(0.03), point[2] + jitter(0.03)];
      }
      const cerebellumCount = Math.floor(count * 0.12);
      if (index < cortexCount + cerebellumCount) {
        const point = sampleSphere(index - cortexCount, cerebellumCount, [0.32, 1, 0.56]);
        const folium = Math.round(point[1] * 4) / 4;
        return [point[0] - 0.66, -0.5 + folium * 0.2 + jitter(0.02), point[2]];
      }
      return sampleSegment(
        [-0.32, -0.42, 0],
        [-0.22, -1.05, 0],
        (index - cortexCount - cerebellumCount) /
          Math.max(1, count - cortexCount - cerebellumCount),
        random,
        0.16,
      );
    }

    case "galaxy":
      return sampleGalaxy(progress, random);

    case "pillar": {
      // A T: a stem topped by a wide crossbar, both as box surfaces.
      const inCrossbar = progress >= 0.6;
      const bottom = inCrossbar ? 0.62 : -1.05;
      const top = inCrossbar ? 1.05 : 0.62;
      const halfWidth = inCrossbar ? 0.95 : 0.28;
      const face = index % (inCrossbar ? 6 : 4);
      const y = bottom + random() * (top - bottom);
      if (face < 2) return [(face ? -1 : 1) * halfWidth, y, jitter(0.52)];
      if (face < 4) return [jitter(halfWidth * 2), y, (face === 3 ? -1 : 1) * 0.26];
      return [jitter(halfWidth * 2), face === 4 ? top : bottom, jitter(0.52)];
    }

    case "butterfly":
      return sampleButterfly(progress, random);

    case "dodecahedron": {
      const scale = 0.92;
      let point: Point3;
      if (progress < 0.68) {
        const [start, end] =
          dodecahedronEdges[Math.floor(random() * dodecahedronEdges.length)];
        point = sampleSegment(start, end, random(), random, 0.025);
      } else if (progress < 0.8) {
        const vertex =
          dodecahedronVertices[Math.floor(random() * dodecahedronVertices.length)];
        point = [vertex[0] + jitter(0.07), vertex[1] + jitter(0.07), vertex[2] + jitter(0.07)];
      } else {
        const triangle =
          dodecahedronTriangles[
            Math.floor(random() * dodecahedronTriangles.length)
          ];
        point = sampleTriangle(triangle[0], triangle[1], triangle[2], random);
      }
      // Turned against the default preview yaw so a face points at the viewer.
      const turn = -0.5;
      return [
        (point[0] * Math.cos(turn) + point[2] * Math.sin(turn)) * scale,
        point[1] * scale,
        (-point[0] * Math.sin(turn) + point[2] * Math.cos(turn)) * scale,
      ];
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

    case "fish":
      return sampleFish(index, count, progress, random);

    case "crescent":
      return sampleCrescent(index, random);

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
    // Rows tighten past four so the whole collection keeps the same height.
    const rowSpacing = Math.min(1.3, 3.9 / Math.max(rows - 1, 1));
    const y = ((rows - 1) / 2 - row) * rowSpacing;
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
