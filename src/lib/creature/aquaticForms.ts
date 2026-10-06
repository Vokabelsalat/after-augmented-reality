export const aquaticForms = [
  "fish",
  "crab",
  "jellyfish",
  "octopus",
  "turtle",
  "ray",
  "starfish",
  "seahorse",
  "seal",
  "shrimp",
  "narwhal",
  "dolphin",
  "whale",
  "clam",
  "pufferfish",
] as const;

export type AquaticForm = (typeof aquaticForms)[number];

export const aquaticFormLabels: Record<AquaticForm, string> = {
  fish: "fish",
  crab: "crab",
  jellyfish: "jellyfish",
  octopus: "octopus",
  turtle: "turtle",
  ray: "ray",
  starfish: "starfish",
  seahorse: "seahorse",
  seal: "seal",
  shrimp: "shrimp",
  narwhal: "narwhal",
  dolphin: "dolphin",
  whale: "whale",
  clam: "clam",
  pufferfish: "pufferfish",
};

export function isAquaticForm(value: unknown): value is AquaticForm {
  return typeof value === "string" && aquaticForms.some((form) => form === value);
}

export function pickAquaticForm(seed: string): AquaticForm {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return aquaticForms[(hash >>> 0) % aquaticForms.length];
}

const creatureSizeTiers = [0.72, 0.86, 1, 1.16, 1.32] as const;

export function creatureSizeScale(seed: string | number) {
  const value = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return creatureSizeTiers[(hash >>> 0) % creatureSizeTiers.length];
}
