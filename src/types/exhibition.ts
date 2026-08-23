export type ThemeId = "memory" | "body" | "machine" | "language" | "place";

export type ExhibitionArtifact = {
  id: string;
  targetIndex: number;
  title: string;
  artist: string;
  theme: ThemeId;
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
