import type { ExhibitionArtifact } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";

export function generateJourneyNarrative(
  discoveries: Array<Pick<Discovery, "artifactId" | "sequence" | "discoveredAt">>,
  exhibitionArtifacts: ExhibitionArtifact[],
): string[] {
  const artifactMap = new Map(exhibitionArtifacts.map((artifact) => [artifact.id, artifact]));
  const orderedDiscoveries = discoveries
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .filter((discovery) => artifactMap.has(discovery.artifactId));

  if (orderedDiscoveries.length === 0) return ["The fishbowl waits."];

  return orderedDiscoveries.flatMap((discovery) => {
    const artifact = artifactMap.get(discovery.artifactId);
    return artifact ? [artifact.storylet] : [];
  });
}
