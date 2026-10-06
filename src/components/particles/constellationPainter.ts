// Shared 2D renderer for particle constellation previews and target images.
// It only has type imports so scripts/export-particle-targets.mjs can load it
// directly in Node.

/**
 * How a constellation is turned for its target: yaw around the vertical axis,
 * pitch around the horizontal one, then roll within the image plane.
 */
export type Orientation = { yaw: number; pitch: number; roll?: number };

export type Constellation = {
  positions: Float32Array;
  sizes: Float32Array;
  halo: [number, number, number];
  core: [number, number, number];
  compositeOperation: "lighter" | "source-over";
  /** Added to every halo's opacity; prints on white need denser ink. */
  haloOpacityBoost: number;
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
export const initialOrientation: Orientation = { yaw: 0.5, pitch: -0.16, roll: 0 };

const frameFill = 0.84;
const referenceSize = 300;
const baseRadius = 2;
// Colors darker than this are lifted towards white so they read on the abyss.
const minimumHaloLuminance = 0.5;
const coreWhiteMix = 0.7;
// On white the roles swap: a dark halo disc carries a light core dot. Both
// keep the hue at boosted saturation; the halo's lightness is capped so the
// ink stays dark enough in grayscale for MindAR to find its edges.
const lightSaturationBoost = 1.45;
const lightSaturationFloor = 0.2;
const lightHaloMaxLightness = 0.4;
const lightHaloOpacityBoost = 0.22;
const lightCoreLightness = 0.8;

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

function toHsl([red, green, blue]: [number, number, number]): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [hue * 60, saturation, lightness];
}

function fromHsl([hue, saturation, lightness]: [number, number, number]): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const [r, g, b] =
    hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x]
      : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** The color's hue at higher saturation and the given lightness. Grays stay gray. */
function vivid(rgb: [number, number, number], lightness: (current: number) => number) {
  const [hue, saturation, current] = toHsl(rgb);
  const boosted = saturation === 0 ? 0 : Math.min(1, Math.max(lightSaturationFloor, saturation * lightSaturationBoost));
  return fromHsl([hue, boosted, lightness(current)]);
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
      : vivid(rgb, (current) => Math.min(current, lightHaloMaxLightness)),
    core: surface === "dark"
      ? mixWithWhite(rgb, coreWhiteMix)
      : vivid(rgb, () => lightCoreLightness),
    compositeOperation: surface === "dark" ? "lighter" : "source-over",
    haloOpacityBoost: surface === "dark" ? 0 : lightHaloOpacityBoost,
  };
}

/** Projects one formation particle the way every target image draws it. */
export function projectConstellationPoint(
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
  const roll = orientation.roll ?? 0;
  return {
    x: (rotatedX * Math.cos(roll) - rotatedY * Math.sin(roll)) * perspective,
    y: (rotatedX * Math.sin(roll) + rotatedY * Math.cos(roll)) * perspective,
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
    const { x, y } = projectConstellationPoint(positions, offset, orientation);
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
  const { positions, sizes, halo, core, compositeOperation, haloOpacityBoost } = constellation;

  context.globalCompositeOperation = compositeOperation;
  for (let offset = 0; offset < positions.length; offset += 3) {
    const { x, y, depth, perspective } = projectConstellationPoint(positions, offset, orientation);
    const screenX = width / 2 + (x - framing.centerX) * scale;
    const screenY = height / 2 - (y - framing.centerY) * scale;
    const radius = radiusScale * sizes[offset / 3] * perspective;
    const alpha = Math.min(0.95, Math.max(0.28, 0.58 + depth * 0.2) + haloOpacityBoost);

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
