import type { ExhibitionArtifact, NarrativeAxis, NarrativeState } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";
import { neutralNarrativeState } from "@/store/journeySlice";

const endings: Record<NarrativeAxis, { positive: string[]; negative: string[] }> = {
  openness: {
    positive: ["You touched the glass. The aquarium called it a leak. The sea called it a beginning.", "By the time the tank found a name, the creature was already outside it."],
    negative: ["The glass held for now. Something on the other side kept listening.", "The tank closed its lid. A small current remained unaccounted for."],
  },
  memory: {
    positive: ["Nothing was lost. It only changed the body that carried it.", "The creature remembered more than the label allowed."],
    negative: ["The missing parts made room for another kind of map.", "What vanished left a current in its place."],
  },
  agency: {
    positive: ["The tank recorded a visitor. The water recorded an accomplice.", "Your choices became fins. The creature chose the rest of the way."],
    negative: ["The current made the next decision, quietly, without asking permission.", "The creature drifted. Even drifting altered the tank."],
  },
  coherence: {
    positive: ["For one moment, every fragment held together. Then it began to swim.", "The system found a pattern. The pattern grew gills."],
    negative: ["Every sentence loosened from its speaker. The fragments swam better apart.", "The classification broke into pieces, and the pieces learned the open sea."],
  },
  voice: {
    positive: ["One voice entered the tank. It surfaced as a chorus.", "The creature opened its mouth. Other voices came through."],
    negative: ["No voice answered. The silence still changed the water.", "The unsaid moved through the tank like a deep-sea current."],
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

function combineState(
  discoveries: Array<Pick<Discovery, "artifactId" | "choiceId">>,
  artifactMap: Map<string, ExhibitionArtifact>,
) {
  const state = { ...neutralNarrativeState };
  discoveries.forEach((discovery) => {
    const artifact = artifactMap.get(discovery.artifactId);
    if (!artifact) return;
    const choice = artifact.choice.options.find((option) => option.id === discovery.choiceId);
    const effects = { ...artifact.stateEffects };
    (Object.keys(choice?.effects ?? {}) as NarrativeAxis[]).forEach((axis) => {
      effects[axis] = (effects[axis] ?? 0) + (choice?.effects[axis] ?? 0);
    });
    (Object.keys(effects) as NarrativeAxis[]).forEach((axis) => {
      state[axis] += effects[axis] ?? 0;
    });
  });
  return state;
}

export function generateJourneyNarrative(
  discoveries: Array<Pick<Discovery, "artifactId" | "sequence" | "choiceId">>,
  exhibitionArtifacts: ExhibitionArtifact[],
  suppliedState?: NarrativeState,
): string[] {
  const artifactMap = new Map(exhibitionArtifacts.map((artifact) => [artifact.id, artifact]));
  const orderedDiscoveries = discoveries.slice().sort((a, b) => a.sequence - b.sequence);
  const ordered = orderedDiscoveries.flatMap((discovery) => {
    const artifact = artifactMap.get(discovery.artifactId);
    return artifact ? [artifact] : [];
  });

  if (ordered.length === 0) {
    return [
      "The aquarium is waiting.",
      "Find a porthole.",
      "Let something cross the glass.",
    ];
  }

  const seed = stableHash(orderedDiscoveries.map((item) => `${item.artifactId}:${item.choiceId ?? "_"}`).join("|"));
  const state = suppliedState ?? combineState(orderedDiscoveries, artifactMap);
  const dominantAxis = (Object.entries(state) as Array<[NarrativeAxis, number]>).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
  )[0]?.[0] ?? "openness";

  const selectedStorylets = ordered.length <= 4
    ? ordered
    : [ordered[0], ordered[Math.floor(ordered.length / 2)], ordered[ordered.length - 1]];
  const lines = [
    "The aquarium insisted that everything had a name.",
    ...selectedStorylets.map((artifact) => artifact.storylet),
  ];

  const axisEndings = state[dominantAxis] >= 0
    ? endings[dominantAxis].positive
    : endings[dominantAxis].negative;
  lines.push(axisEndings[seed % axisEndings.length]);
  return lines;
}
