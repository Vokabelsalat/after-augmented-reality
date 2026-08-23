import type { ExhibitionArtifact } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";

const numberWords = ["No", "One", "Two", "Three", "Four", "Five"];

function articleFor(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function generateJourneyNarrative(
  discoveries: Discovery[],
  exhibitionArtifacts: ExhibitionArtifact[],
): string[] {
  const artifactMap = new Map(
    exhibitionArtifacts.map((artifact) => [artifact.id, artifact]),
  );
  const ordered = discoveries
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .flatMap((discovery) => {
      const artifact = artifactMap.get(discovery.artifactId);
      return artifact ? [artifact] : [];
    });

  if (ordered.length === 0) {
    return [
      "Your reading is still waiting.",
      "Find a fragment,",
      "and let the path begin.",
    ];
  }

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const lines = [`You began with ${first.theme}.`];

  if (ordered.length === 1) {
    lines.push(
      `A ${first.narrativeWords[1]} loosened from the surface,`,
      `asking you to ${first.narrativeWords[2]}.`,
      "One fragment travels with you.",
    );
    return lines;
  }

  const themeCounts = ordered.reduce<Record<string, number>>((counts, artifact) => {
    counts[artifact.theme] = (counts[artifact.theme] ?? 0) + 1;
    return counts;
  }, {});
  const repeatedTheme = Object.entries(themeCounts).find(([, count]) => count > 1);

  ordered.slice(1, -1).forEach((artifact, index) => {
    const lead = index === 0 ? "Then" : "Afterward";
    lines.push(
      `${lead} ${artifact.theme} crossed the path as ${articleFor(artifact.narrativeWords[1])} ${artifact.narrativeWords[1]},`,
      `asking the fragments to ${artifact.narrativeWords[2]}.`,
    );
  });

  if (repeatedTheme) {
    lines.push(
      `${repeatedTheme[0][0].toUpperCase()}${repeatedTheme[0].slice(1)} returned, changing its echo.`,
    );
  }

  lines.push(
    `${last.theme[0].toUpperCase()}${last.theme.slice(1)} arrived last,`,
    `carrying ${last.narrativeWords[2]} into what remains.`,
    `${numberWords[ordered.length] ?? ordered.length} fragments travel with you.`,
  );

  return lines.slice(0, 7);
}
