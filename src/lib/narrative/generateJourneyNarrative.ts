import type { ExhibitionArtifact, ThemeId } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";

const movements = ["enter", "cross", "follow", "circle", "drift through", "sound"] as const;
const qualities = ["open", "dim", "folded", "tidal", "quiet", "unfixed"] as const;
const motions = ["drifting", "turning", "listening", "surfacing", "circling", "opening"] as const;
const responses = ["holds", "alters", "follows", "loosens", "remembers", "repeats"] as const;

const habitats: Record<ThemeId, readonly string[]> = {
  memory: ["archive", "rooted water", "remembering basin"],
  interface: ["glass passage", "signal current", "lit surface"],
  worldmaking: ["dream channel", "unmapped room", "invented tide"],
  embodiment: ["moving body", "skin of water", "felt depth"],
  agency: ["forked current", "witnessing water", "answering tide"],
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function sentence(value: string) {
  return `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}.`;
}

function stanza(artifact: ExhibitionArtifact, random: () => number) {
  const traits = artifact.visualTraits.length > 1
    ? artifact.visualTraits
    : [artifact.visualTraits[0], artifact.marineType];
  const route = pick(habitats[artifact.theme], random);
  const lineCount = 1 + Math.floor(random() * 3);

  return [
    `${pick(movements, random)} the ${pick(qualities, random)} ${route} —`,
    sentence(`${traits[0]}, ${pick(motions, random)}`),
    sentence(`${traits[1]} ${pick(responses, random)} the water`),
  ].slice(0, lineCount).join("\n");
}

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

  const random = seededRandom(stableHash(
    orderedDiscoveries
      .map((item) => `${item.artifactId}:${item.discoveredAt}`)
      .join("|"),
  ));

  return orderedDiscoveries.flatMap((discovery) => {
    const artifact = artifactMap.get(discovery.artifactId);
    return artifact ? [stanza(artifact, random)] : [];
  });
}
