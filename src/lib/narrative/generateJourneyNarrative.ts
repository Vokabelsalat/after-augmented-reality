import type { ExhibitionArtifact, NarrativeAxis, NarrativeState } from "@/types/exhibition";
import type { Discovery } from "@/store/journeySlice";
import { neutralNarrativeState } from "@/store/journeySlice";
import {
  narrativeSentenceTemplates,
  narrativeWordBanks,
  type NarrativeWordBankKey,
} from "@/data/narrativeLexicon";

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

function lowerFirst(value: string) {
  return value.charAt(0).toLocaleLowerCase() + value.slice(1);
}

function renderTemplate(
  template: string,
  context: Record<string, string>,
  random: () => number,
) {
  return template.replace(/\{(\w+)\}/g, (token, key: string) => {
    if (context[key]) return context[key];
    if (key in narrativeWordBanks) {
      return pick(narrativeWordBanks[key as NarrativeWordBankKey], random);
    }
    return token;
  });
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
  discoveries: Array<Pick<Discovery, "artifactId" | "sequence" | "choiceId" | "discoveredAt">>,
  exhibitionArtifacts: ExhibitionArtifact[],
  suppliedState?: NarrativeState,
): string[] {
  const artifactMap = new Map(exhibitionArtifacts.map((artifact) => [artifact.id, artifact]));
  const orderedDiscoveries = discoveries.slice().sort((a, b) => a.sequence - b.sequence);
  const validDiscoveries = orderedDiscoveries.filter((discovery) => artifactMap.has(discovery.artifactId));

  if (validDiscoveries.length === 0) {
    return [
      "The aquarium is waiting.",
      "Find a porthole.",
      "Let something cross the glass.",
    ];
  }

  const seed = stableHash(orderedDiscoveries
    .map((item) => `${item.artifactId}:${item.choiceId ?? "_"}:${item.discoveredAt}`)
    .join("|"));
  const random = seededRandom(seed);
  const state = suppliedState ?? combineState(orderedDiscoveries, artifactMap);
  const dominantAxis = (Object.entries(state) as Array<[NarrativeAxis, number]>).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
  )[0]?.[0] ?? "openness";

  const selectedDiscoveries = validDiscoveries.length <= 4
    ? validDiscoveries
    : [
        validDiscoveries[0],
        validDiscoveries[Math.floor(validDiscoveries.length / 2)],
        validDiscoveries[validDiscoveries.length - 1],
      ];
  const lines = [renderTemplate(pick(narrativeSentenceTemplates.opening, random), {}, random)];

  selectedDiscoveries.forEach((discovery) => {
    const artifact = artifactMap.get(discovery.artifactId);
    if (!artifact) return;
    const choice = artifact.choice.options.find((option) => option.id === discovery.choiceId);
    const templates = choice
      ? [...narrativeSentenceTemplates.encounter, ...narrativeSentenceTemplates.choice]
      : narrativeSentenceTemplates.encounter;
    const context = {
      title: artifact.title,
      classification: lowerFirst(artifact.classification),
      marineType: artifact.marineType,
      visualTrait: pick(artifact.visualTraits, random),
      narrativeWord: pick(artifact.narrativeWords, random),
      storylet: artifact.storylet,
      choiceAction: choice ? lowerFirst(choice.label) : "leave it undecided",
    };
    lines.push(renderTemplate(pick(templates, random), context, random));
  });

  const axisEndings = state[dominantAxis] >= 0
    ? narrativeSentenceTemplates.ending[dominantAxis].positive
    : narrativeSentenceTemplates.ending[dominantAxis].negative;
  lines.push(renderTemplate(pick(axisEndings, random), {}, random));
  return lines;
}
