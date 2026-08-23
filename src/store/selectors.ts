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
