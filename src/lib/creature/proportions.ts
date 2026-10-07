/**
 * How a creature's main body is stretched along its length (x), height (y) and depth (z).
 * It is chosen once per visitor and stored with the contribution, like the palette and pattern.
 */
export type CreatureProportions = { x: number; y: number; z: number };

const limits = {
  x: [0.88, 1.12],
  y: [0.88, 1.15],
  z: [0.85, 1.2],
} as const;

function hashUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  // Without this final mix, seeds that differ only in their last character hash to related values.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

export function isCreatureProportions(value: unknown): value is CreatureProportions {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (["x", "y", "z"] as const).every((axis) => {
    const scale = candidate[axis];
    return typeof scale === "number" && scale >= limits[axis][0] && scale <= limits[axis][1];
  });
}

/** Proportions drawn from `seed`; the same seed always gives the same proportions. */
export function creatureProportions(seed: string): CreatureProportions {
  const draw = (axis: keyof typeof limits) => {
    const [min, max] = limits[axis];
    return Math.round((min + hashUnit(`${seed}:proportions-${axis}`) * (max - min)) * 100) / 100;
  };
  return { x: draw("x"), y: draw("y"), z: draw("z") };
}
