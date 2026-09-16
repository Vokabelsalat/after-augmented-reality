import type { CreaturePartId, ThemeId } from "@/types/exhibition";

export type SharedCreaturePart = {
  artifactId: string;
  partId: CreaturePartId;
  label: string;
  sequence: number;
  theme: ThemeId;
  color: string;
  /** Time from this scan until the next scan or journey completion. */
  dwellMs?: number;
};

export type ExhibitionContribution = {
  id: number;
  publicId: string;
  parts: SharedCreaturePart[];
  narrative: string[];
  createdAt: string;
};

export type ContributionSubmission = {
  sessionId: string;
  completedAt: number;
  discoveries: Array<{
    artifactId: string;
    sequence: number;
    discoveredAt: number;
  }>;
};
