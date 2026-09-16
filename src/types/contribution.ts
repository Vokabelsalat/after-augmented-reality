import type { ThemeId } from "@/types/exhibition";

export type SharedGlyph = {
  artifactId: string;
  sequence: number;
  theme: ThemeId;
  color: string;
};

export type ExhibitionContribution = {
  id: number;
  publicId: string;
  glyphs: SharedGlyph[];
  narrative: string[];
  createdAt: string;
};

export type ContributionSubmission = {
  sessionId: string;
  discoveries: Array<{
    artifactId: string;
    sequence: number;
  }>;
};
