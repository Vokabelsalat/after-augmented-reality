import { artifactById } from "@/data/artifacts";
import type { RootState } from "@/store";

export const selectJourney = (state: RootState) => state.journey;
export const selectDiscoveries = (state: RootState) =>
  state.journey.discoveries;
export const selectDiscoveryCount = (state: RootState) =>
  state.journey.discoveries.length;
export const selectActiveArtifactId = (state: RootState) =>
  state.journey.activeArtifactId;
export const selectExperiencePhase = (state: RootState) =>
  state.journey.experiencePhase;
export const selectNarrativeState = (state: RootState) =>
  state.journey.narrativeState;
export const selectCreatureForm = (state: RootState) =>
  state.journey.creatureForm;
export const selectCreatureSeed = (state: RootState) =>
  state.journey.sessionId ?? "new-specimen";
export const selectCreaturePalette = (state: RootState) =>
  state.journey.creaturePalette;
export const selectCreaturePattern = (state: RootState) =>
  state.journey.creaturePattern;
export const selectCreatureProportions = (state: RootState) =>
  state.journey.creatureProportions;

export const selectDiscoveredArtifacts = (state: RootState) =>
  state.journey.discoveries
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .flatMap((discovery) => {
      const artifact = artifactById.get(discovery.artifactId);
      return artifact ? [{ ...discovery, artifact }] : [];
    });

export const selectHasDiscovered = (artifactId: string) => (state: RootState) =>
  state.journey.discoveries.some(
    (discovery) => discovery.artifactId === artifactId,
  );
