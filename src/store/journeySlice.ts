import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { artifactById } from "@/data/artifacts";
import { pickAquaticForm, type AquaticForm } from "@/lib/creature/aquaticForms";
import type { NarrativeState } from "@/types/exhibition";

export type ExperiencePhase =
  | "intro"
  | "scanning"
  | "revealing"
  | "content"
  | "journey"
  | "ending";

export type Discovery = {
  artifactId: string;
  sequence: number;
  discoveredAt: number;
  choiceId?: string;
};

export type JourneyState = {
  sessionId: string | null;
  startedAt: number | null;
  completedAt: number | null;
  discoveries: Discovery[];
  activeArtifactId: string | null;
  experiencePhase: ExperiencePhase;
  narrativeState: NarrativeState;
  creatureForm: AquaticForm | null;
};

export type PersistedJourney = Pick<
  JourneyState,
  "sessionId" | "startedAt" | "completedAt" | "discoveries"
> & { narrativeState?: NarrativeState; creatureForm?: AquaticForm | null };

export const neutralNarrativeState: NarrativeState = {
  openness: 0,
  memory: 0,
  agency: 0,
  coherence: 0,
  voice: 0,
};

export const initialJourneyState: JourneyState = {
  sessionId: null,
  startedAt: null,
  completedAt: null,
  discoveries: [],
  activeArtifactId: null,
  experiencePhase: "intro",
  narrativeState: { ...neutralNarrativeState },
  creatureForm: null,
};

function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `say-hi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const journeySlice = createSlice({
  name: "journey",
  initialState: initialJourneyState,
  reducers: {
    startJourney: {
      reducer(
        state,
        action: PayloadAction<{ sessionId: string; startedAt: number }>,
      ) {
        if (!state.sessionId) {
          state.sessionId = action.payload.sessionId;
          state.startedAt = action.payload.startedAt;
        }
        state.activeArtifactId = null;
        state.completedAt = null;
        state.experiencePhase = "scanning";
      },
      prepare(payload?: { sessionId: string; startedAt: number }) {
        return {
          payload: payload ?? {
            sessionId: makeSessionId(),
            startedAt: Date.now(),
          },
        };
      },
    },
    artifactDetected: {
      reducer(
        state,
        action: PayloadAction<{ artifactId: string; discoveredAt: number }>,
      ) {
        const { artifactId, discoveredAt } = action.payload;
        const alreadyDiscovered = state.discoveries.some(
          (discovery) => discovery.artifactId === artifactId,
        );

        if (alreadyDiscovered) return;

        if (!state.creatureForm) {
          state.creatureForm = pickAquaticForm(
            `${state.sessionId ?? "anonymous"}:${artifactId}:${discoveredAt}`,
          );
        }

        state.discoveries.push({
          artifactId,
          discoveredAt,
          sequence: state.discoveries.length + 1,
        });
        const artifact = artifactById.get(artifactId);
        if (artifact) {
          (Object.keys(artifact.stateEffects) as Array<keyof NarrativeState>).forEach(
            (axis) => {
              state.narrativeState[axis] = Math.max(
                -8,
                Math.min(
                  8,
                  state.narrativeState[axis] + (artifact.stateEffects[axis] ?? 0),
                ),
              );
            },
          );
        }
        state.completedAt = null;
        state.activeArtifactId = artifactId;
        state.experiencePhase = "revealing";
      },
      prepare(artifactId: string, discoveredAt = Date.now()) {
        return { payload: { artifactId, discoveredAt } };
      },
    },
    artifactCollected(state, action: PayloadAction<string>) {
      if (state.activeArtifactId === action.payload) {
        state.experiencePhase = "content";
      }
    },
    artifactRevisited(state, action: PayloadAction<string>) {
      const wasDiscovered = state.discoveries.some(
        (discovery) => discovery.artifactId === action.payload,
      );
      if (!wasDiscovered) return;
      state.activeArtifactId = action.payload;
      state.experiencePhase = "revealing";
    },
    choiceMade(
      state,
      action: PayloadAction<{
        artifactId: string;
        choiceId: string;
        effects: Partial<NarrativeState>;
      }>,
    ) {
      const discovery = state.discoveries.find(
        (item) => item.artifactId === action.payload.artifactId,
      );
      if (!discovery || discovery.choiceId) return;
      discovery.choiceId = action.payload.choiceId;
      (Object.keys(action.payload.effects) as Array<keyof NarrativeState>).forEach(
        (axis) => {
          state.narrativeState[axis] = Math.max(
            -8,
            Math.min(8, state.narrativeState[axis] + (action.payload.effects[axis] ?? 0)),
          );
        },
      );
    },
    setActiveArtifact(state, action: PayloadAction<string | null>) {
      state.activeArtifactId = action.payload;
    },
    setExperiencePhase(state, action: PayloadAction<ExperiencePhase>) {
      state.experiencePhase = action.payload;
      if (action.payload === "scanning") state.completedAt = null;
    },
    finishJourney: {
      reducer(state, action: PayloadAction<number>) {
        state.completedAt = action.payload;
        state.experiencePhase = "ending";
      },
      prepare(completedAt = Date.now()) {
        return { payload: completedAt };
      },
    },
    hydrateJourney(state, action: PayloadAction<PersistedJourney>) {
      state.sessionId = action.payload.sessionId;
      state.startedAt = action.payload.startedAt;
      state.completedAt = action.payload.completedAt;
      state.discoveries = action.payload.discoveries;
      state.narrativeState = { ...(action.payload.narrativeState ?? neutralNarrativeState) };
      const firstDiscovery = action.payload.discoveries[0];
      state.creatureForm = action.payload.creatureForm
        ?? (firstDiscovery
          ? pickAquaticForm(`${action.payload.sessionId ?? "anonymous"}:${firstDiscovery.artifactId}:${firstDiscovery.discoveredAt}`)
          : null);
      state.activeArtifactId = null;
      state.experiencePhase = action.payload.sessionId ? "scanning" : "intro";
    },
    resetJourney() {
      return { ...initialJourneyState };
    },
  },
});

export const {
  artifactCollected,
  artifactDetected,
  artifactRevisited,
  choiceMade,
  finishJourney,
  hydrateJourney,
  resetJourney,
  setActiveArtifact,
  setExperiencePhase,
  startJourney,
} = journeySlice.actions;

export const journeyReducer = journeySlice.reducer;
