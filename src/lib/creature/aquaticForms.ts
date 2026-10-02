export const aquaticForms = [
  "fish",
  "crab",
  "jellyfish",
  "octopus",
  "turtle",
  "ray",
  "starfish",
  "seahorse",
  "eel",
  "seal",
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
  eel: "eel",
  seal: "seal",
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
