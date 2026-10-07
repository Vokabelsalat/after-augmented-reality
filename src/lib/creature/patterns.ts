export const creaturePatternKinds = ["plain", "stripes", "bands", "spots", "speckles", "scales", "net"] as const;

export type CreaturePatternKind = (typeof creaturePatternKinds)[number];

/**
 * How a creature's skin is patterned. It is chosen once per visitor and stored with the
 * contribution, so the creature looks the same on the phone and in the collective aquarium.
 */
export type CreaturePattern = {
  kind: CreaturePatternKind;
  /** How many times the pattern repeats across a body part, from 1 (large) to 3 (fine). */
  density: 1 | 2 | 3;
  /** Whether stripes, bands and scale rows run along the body or around it. */
  orientation: "along" | "around";
  /** How strongly the marking colour stands out against the body, from 0.35 to 1. */
  contrast: number;
  /** Places the spots, speckles and net cells, so two creatures with the same pattern still differ. */
  seed: number;
};

const kindWeights: Record<CreaturePatternKind, number> = {
  plain: 1,
  stripes: 2,
  bands: 2,
  spots: 2,
  speckles: 1.5,
  scales: 1.5,
  net: 1,
};

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

export function isCreaturePattern(value: unknown): value is CreaturePattern {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    creaturePatternKinds.some((kind) => kind === candidate.kind) &&
    (candidate.density === 1 || candidate.density === 2 || candidate.density === 3) &&
    (candidate.orientation === "along" || candidate.orientation === "around") &&
    typeof candidate.contrast === "number" &&
    candidate.contrast >= 0.35 &&
    candidate.contrast <= 1 &&
    typeof candidate.seed === "number" &&
    Number.isInteger(candidate.seed) &&
    candidate.seed >= 0 &&
    candidate.seed < 2 ** 31
  );
}

/** A pattern drawn from `seed`; the same seed always gives the same pattern. */
export function creaturePattern(seed: string): CreaturePattern {
  const totalWeight = creaturePatternKinds.reduce((sum, kind) => sum + kindWeights[kind], 0);
  let pick = hashUnit(`${seed}:pattern-kind`) * totalWeight;
  const kind = creaturePatternKinds.find((candidate) => (pick -= kindWeights[candidate]) < 0) ?? "plain";
  return {
    kind,
    density: (1 + Math.min(2, Math.floor(hashUnit(`${seed}:pattern-density`) * 3))) as 1 | 2 | 3,
    orientation: hashUnit(`${seed}:pattern-orientation`) < 0.5 ? "along" : "around",
    contrast: Math.round((0.35 + hashUnit(`${seed}:pattern-contrast`) * 0.65) * 100) / 100,
    seed: Math.min(2 ** 31 - 1, Math.floor(hashUnit(`${seed}:pattern-seed`) * 2 ** 31)),
  };
}
