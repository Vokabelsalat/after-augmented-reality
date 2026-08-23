import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
};

export type JourneyState = {
  sessionId: string | null;
  startedAt: number | null;
  discoveries: Discovery[];
  activeArtifactId: string | null;
  experiencePhase: ExperiencePhase;
};

export type PersistedJourney = Pick<
  JourneyState,
  "sessionId" | "startedAt" | "discoveries"
>;

export const initialJourneyState: JourneyState = {
  sessionId: null,
  startedAt: null,
  discoveries: [],
  activeArtifactId: null,
  experiencePhase: "intro",
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

        state.discoveries.push({
          artifactId,
          discoveredAt,
          sequence: state.discoveries.length + 1,
        });
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
    setActiveArtifact(state, action: PayloadAction<string | null>) {
      state.activeArtifactId = action.payload;
    },
    setExperiencePhase(state, action: PayloadAction<ExperiencePhase>) {
      state.experiencePhase = action.payload;
    },
    hydrateJourney(state, action: PayloadAction<PersistedJourney>) {
      state.sessionId = action.payload.sessionId;
      state.startedAt = action.payload.startedAt;
      state.discoveries = action.payload.discoveries;
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
  hydrateJourney,
  resetJourney,
  setActiveArtifact,
  setExperiencePhase,
  startJourney,
} = journeySlice.actions;

export const journeyReducer = journeySlice.reducer;
