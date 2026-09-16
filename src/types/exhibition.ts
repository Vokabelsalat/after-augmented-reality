export type ThemeId =
  | "memory"
  | "interface"
  | "worldmaking"
  | "embodiment"
  | "agency";

export type ParticleFormId = "memory" | "machine" | "body";

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
};

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  color: string;
  description: string;
};
