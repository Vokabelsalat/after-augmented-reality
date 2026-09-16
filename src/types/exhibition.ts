export type ThemeId =
  | "memory"
  | "interface"
  | "worldmaking"
  | "embodiment"
  | "agency";

export type ParticleFormId = "memory" | "machine" | "body";

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
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  color: string;
  description: string;
};
