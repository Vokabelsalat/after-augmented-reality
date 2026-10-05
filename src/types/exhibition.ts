export type ThemeId =
  | "memory"
  | "interface"
  | "worldmaking"
  | "embodiment"
  | "agency";

export const particleFormIds = [
  "torus",
  "triad",
  "tree",
  "cuboid",
  "nest",
  "prism",
  "book",
  "skateboard",
  "sphere",
  "tower",
  "pillar",
  "fork",
  "dodecahedron",
  "crystal",
  "hourglass",
  "spiral",
] as const;

export type ParticleFormId = (typeof particleFormIds)[number];

export type CreaturePartId =
  | "memory-crown"
  | "archive-ears"
  | "route-tail"
  | "signal-antenna"
  | "cockatoo-beak"
  | "glass-wings"
  | "page-fins"
  | "surfer-feet"
  | "inner-eye"
  | "orbit-ring"
  | "heart-plume"
  | "helping-arms"
  | "goliath-horns";

export type CreaturePart = {
  id: CreaturePartId;
  label: string;
  description: string;
};

export type NarrativeAxis =
  | "openness"
  | "memory"
  | "agency"
  | "coherence"
  | "voice";

export type NarrativeState = Record<NarrativeAxis, number>;

export type ArtifactChoice = {
  prompt: string;
  options: [
    { id: string; label: string; effects: Partial<NarrativeState> },
    { id: string; label: string; effects: Partial<NarrativeState> },
  ];
};

export type ExhibitionArtifact = {
  id: string;
  targetIndex: number;
  posterImageSrc: `/images/${string}`;
  title: string;
  artist: string;
  theme: ThemeId;
  particleForm: ParticleFormId;
  color: string;
  shortText: string;
  narrativeWords: string[];
  creaturePart: CreaturePart;
  marineType: string;
  classification: string;
  visualTraits: string[];
  stateEffects: Partial<NarrativeState>;
  storylet: string;
  choice: ArtifactChoice;
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  color: string;
  description: string;
};
