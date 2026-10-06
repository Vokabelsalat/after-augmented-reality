// Shared 2D renderer for particle constellation previews and target images.
// It only has type imports so scripts/export-particle-targets.mjs can load it
// directly in Node.

export type Orientation = { yaw: number; pitch: number };

export type Constellation = {
  positions: Float32Array;
  sizes: Float32Array;
  halo: [number, number, number];
  core: [number, number, number];
  compositeOperation: "lighter" | "source-over";
};

export type ConstellationSurface = "dark" | "light";

/** Projected bounds at scale 1, used to centre and fill the frame. */
export type ConstellationFraming = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

type Context2D = Pick<
  CanvasRenderingContext2D,
  "globalCompositeOperation" | "fillStyle" | "beginPath" | "arc" | "fill"
>;

export const constellationParticleCount = 1500;
export const initialOrientation: Orientation = { yaw: 0.5, pitch: -0.16 };

const frameFill = 0.84;
const referenceSize = 300;
const baseRadius = 2;
// Colors darker than this are lifted towards white so they read on the abyss.
const minimumHaloLuminance = 0.5;
const coreWhiteMix = 0.7;

function colorChannels(color: string): [number, number, number] {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixWithWhite(
  [red, green, blue]: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    Math.round(red + (255 - red) * amount),
    Math.round(green + (255 - green) * amount),
    Math.round(blue + (255 - blue) * amount),
  ];
}

function mixWithBlack(
  [red, green, blue]: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    Math.round(red * (1 - amount)),
    Math.round(green * (1 - amount)),
    Math.round(blue * (1 - amount)),
  ];
}

function hash(index: number) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function prepareConstellation(
  positions: Float32Array,
  color: string,
  surface: ConstellationSurface = "dark",
): Constellation {
  const rgb = colorChannels(color);
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  // Mostly small dots with a few large ones, so the detector finds distinct
  // blobs at several scales instead of one uniform grain.
  const sizes = Float32Array.from(
    { length: positions.length / 3 },
    (_, index) => 0.55 + 1.7 * hash(index) ** 3,
  );

  return {
    positions,
    sizes,
    halo: surface === "dark"
      ? mixWithWhite(rgb, Math.max(0, minimumHaloLuminance - luminance))
      : rgb,
    core: surface === "dark" ? mixWithWhite(rgb, coreWhiteMix) : mixWithBlack(rgb, 0.28),
    compositeOperation: surface === "dark" ? "lighter" : "source-over",
  };
}

function project(
  positions: Float32Array,
  offset: number,
  orientation: Orientation,
) {
  const x = positions[offset];
  const y = positions[offset + 1] - 0.32;
  const z = positions[offset + 2] - 0.35;
  const rotatedX = x * Math.cos(orientation.yaw) + z * Math.sin(orientation.yaw);
  const rotatedZ = -x * Math.sin(orientation.yaw) + z * Math.cos(orientation.yaw);
  const rotatedY =
    y * Math.cos(orientation.pitch) - rotatedZ * Math.sin(orientation.pitch);
  const depth =
    y * Math.sin(orientation.pitch) + rotatedZ * Math.cos(orientation.pitch);
  const perspective = 2.8 / (2.8 + depth);
  return {
    x: rotatedX * perspective,
    y: rotatedY * perspective,
    depth,
    perspective,
  };
}

export function frameConstellation(
  { positions }: Constellation,
  orientation: Orientation,
): ConstellationFraming {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let offset = 0; offset < positions.length; offset += 3) {
    const { x, y } = project(positions, offset, orientation);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: Math.max(maxX - minX, 0.01),
    height: Math.max(maxY - minY, 0.01),
  };
}

export function paintConstellation(
  context: Context2D,
  width: number,
  height: number,
  constellation: Constellation,
  orientation: Orientation,
  framing: ConstellationFraming,
) {
  const scale = Math.min(
    (width * frameFill) / framing.width,
    (height * frameFill) / framing.height,
  );
  const radiusScale = (Math.min(width, height) / referenceSize) * baseRadius;
  const { positions, sizes, halo, core, compositeOperation } = constellation;

  context.globalCompositeOperation = compositeOperation;
  for (let offset = 0; offset < positions.length; offset += 3) {
    const { x, y, depth, perspective } = project(positions, offset, orientation);
    const screenX = width / 2 + (x - framing.centerX) * scale;
    const screenY = height / 2 - (y - framing.centerY) * scale;
    const radius = radiusScale * sizes[offset / 3] * perspective;
    const alpha = Math.min(0.92, Math.max(0.28, 0.58 + depth * 0.2));

    context.fillStyle = `rgba(${halo[0]}, ${halo[1]}, ${halo[2]}, ${alpha})`;
    context.beginPath();
    context.arc(screenX, screenY, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = `rgba(${core[0]}, ${core[1]}, ${core[2]}, ${Math.min(1, alpha + 0.15)})`;
    context.beginPath();
    context.arc(screenX, screenY, radius * 0.45, 0, Math.PI * 2);
    context.fill();
  }
  context.globalCompositeOperation = "source-over";
}
