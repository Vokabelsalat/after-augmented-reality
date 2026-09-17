import type { ExhibitionArtifact, ThemeId } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";

const numberWords = ["no", "one", "two", "three", "four", "five"];

const themeLanguage: Record<ThemeId, { motifs: string[] }> = {
  memory: {
    motifs: [
      "an archive of returning images",
      "a half-heard history",
      "a thread of inheritance",
      "a recollection finding its voice",
      "a trace carried forward",
    ],
  },
  interface: {
    motifs: [
      "a signal between surfaces",
      "a responsive letter",
      "a coded threshold",
      "a flicker of translated language",
      "a system ready to be touched",
    ],
  },
  worldmaking: {
    motifs: [
      "a corridor into a possible world",
      "an invented horizon",
      "a playful detour from reality",
      "a doorway with shifting rules",
      "a new world taking shape",
    ],
  },
  embodiment: {
    motifs: [
      "a gesture held in the body",
      "an inner landscape",
      "a rhythm of balance and motion",
      "a sensation looking for form",
      "a movement felt before it was named",
    ],
  },
  agency: {
    motifs: [
      "an act of care",
      "a decision that could not stay neutral",
      "a witness refusing to look away",
      "a reaching hand",
      "a choice becoming responsibility",
    ],
  },
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(options: readonly T[], seed: number) {
  return options[seed % options.length];
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function actionFor(artifact: ExhibitionArtifact, seed: number) {
  const actions = artifact.narrativeWords.filter((_, index) => index !== 1);
  return pick(actions.length > 0 ? actions : artifact.narrativeWords, seed);
}

function motifFor(artifact: ExhibitionArtifact, seed: number) {
  return pick(themeLanguage[artifact.theme].motifs, seed);
}

function compactMiddle(artifacts: ExhibitionArtifact[]) {
  if (artifacts.length <= 3) return artifacts;
  return [
    artifacts[0],
    artifacts[Math.floor((artifacts.length - 1) / 2)],
    artifacts[artifacts.length - 1],
  ];
}

export function generateJourneyNarrative(
  discoveries: Array<Pick<Discovery, "artifactId" | "sequence">>,
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
      "Your fish is still sleeping.",
      "Find an artwork,",
      "and let its first trait wake.",
    ];
  }

  const pathSeed = stableHash(ordered.map((artifact) => artifact.id).join("|"));
  const first = ordered[0];
  const firstMotif = motifFor(first, pathSeed);
  const firstAction = actionFor(first, pathSeed >>> 3);
  const opening = pick([
    `Your path opened in ${first.theme}, where ${firstMotif} began to stir.`,
    `${capitalize(first.theme)} set the first current in motion, carrying ${firstMotif}.`,
    `The first encounter drew ${firstMotif} out of ${first.theme}.`,
    `You entered through ${first.theme}; ${firstMotif} moved beside you.`,
  ], pathSeed >>> 5);
  const firstDetail = pick([
    `From “${first.title},” the fish learned to ${firstAction}.`,
    `The first new part, shaped by “${first.title},” began to ${firstAction}.`,
    `“${first.title}” left the fish ready to ${firstAction}.`,
    `A trait from “${first.title}” carried the impulse to ${firstAction}.`,
  ], pathSeed >>> 9);

  if (ordered.length === 1) {
    const singleEnding = pick([
      "One encounter has become a living part of the fish.",
      `The fish leaves with one new trait and another way to ${firstAction}.`,
      `The fish carries this encounter onward in its ${first.creaturePart.label.toLowerCase()}.`,
      "One new part moves onward with you.",
    ], pathSeed >>> 13);
    return [opening, firstDetail, singleEnding];
  }

  const lines = [opening, firstDetail];
  const middleArtifacts = compactMiddle(ordered.slice(1, -1));

  middleArtifacts.forEach((artifact, index) => {
    const artifactSeed = stableHash(`${pathSeed}:${artifact.id}:${index}`);
    const motif = motifFor(artifact, artifactSeed >>> 2);
    const action = actionFor(artifact, artifactSeed >>> 6);
    lines.push(pick([
      `${capitalize(artifact.theme)} followed: ${motif}, teaching the fish to ${action}.`,
      `At “${artifact.title},” ${motif} joined the body and began to ${action}.`,
      `The route bent through ${artifact.theme}, where ${motif} learned to ${action}.`,
      `Next came ${motif} from “${artifact.title},” urging the fish to ${action}.`,
      `${capitalize(artifact.theme)} added ${motif}; the growing body could now ${action}.`,
    ], artifactSeed >>> 10));
  });

  const last = ordered[ordered.length - 1];
  const lastSeed = stableHash(`${pathSeed}:last:${last.id}`);
  const lastMotif = motifFor(last, lastSeed >>> 2);
  const lastAction = actionFor(last, lastSeed >>> 7);
  lines.push(pick([
    `Finally, ${lastMotif} arrived from ${last.theme}, carrying the impulse to ${lastAction}.`,
    `The last encounter brought ${lastMotif}; ${last.theme} taught it to ${lastAction}.`,
    `At the route’s edge, ${last.theme} added ${lastMotif}, ready to ${lastAction}.`,
    `“${last.title}” completed the path with ${lastMotif}, still learning to ${lastAction}.`,
  ], lastSeed >>> 11));

  const themeCounts = ordered.reduce<Partial<Record<ThemeId, number>>>((counts, artifact) => {
    counts[artifact.theme] = (counts[artifact.theme] ?? 0) + 1;
    return counts;
  }, {});
  const repeatedTheme = (Object.entries(themeCounts) as Array<[ThemeId, number]>).find(([, count]) => count > 1)?.[0];
  const countLabel = numberWords[ordered.length] ?? String(ordered.length);

  if (repeatedTheme) {
    lines.push(pick([
      `${capitalize(countLabel)} parts now swim together, with ${repeatedTheme} returning in a different voice.`,
      `${capitalize(repeatedTheme)} surfaced more than once; ${countLabel} parts carry its changing echo.`,
      `Across ${countLabel} encounters, ${repeatedTheme} returned and became something new.`,
    ], pathSeed >>> 17));
  } else {
    lines.push(pick([
      `${capitalize(countLabel)} parts now move as one changing fish.`,
      `Together, ${countLabel} encounters have become one swimming body.`,
      `What began as one encounter now swims with ${countLabel} connected parts.`,
      `${capitalize(countLabel)} different traces travel onward in the same fish.`,
    ], pathSeed >>> 17));
  }

  return lines.slice(0, 7);
}
