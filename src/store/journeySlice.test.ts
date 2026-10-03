import { describe, expect, it } from "vitest";
import {
  artifactCollected,
  artifactDetected,
  artifactRevisited,
  finishJourney,
  journeyReducer,
  resetJourney,
  setActiveArtifact,
  startJourney,
} from "@/store/journeySlice";

describe("journeySlice", () => {
  it("starts a reproducible journey session", () => {
    const state = journeyReducer(
      undefined,
      startJourney({ sessionId: "session-test", startedAt: 100 }),
    );

    expect(state).toMatchObject({
      sessionId: "session-test",
      startedAt: 100,
      experiencePhase: "scanning",
      discoveries: [],
    });
  });

  it("discovers artifacts in order", () => {
    let state = journeyReducer(
      undefined,
      startJourney({ sessionId: "session-test", startedAt: 100 }),
    );
    state = journeyReducer(state, artifactDetected("machine-voice", 200));
    state = journeyReducer(state, artifactDetected("body-space", 300));

    expect(state.discoveries).toEqual([
      { artifactId: "machine-voice", discoveredAt: 200, sequence: 1 },
      { artifactId: "body-space", discoveredAt: 300, sequence: 2 },
    ]);
    expect(state.activeArtifactId).toBe("body-space");
    expect(state.experiencePhase).toBe("revealing");
    expect(state.creatureForm).not.toBeNull();
  });

  it("chooses the aquatic form at the first scan and keeps it for the journey", () => {
    let state = journeyReducer(
      undefined,
      startJourney({ sessionId: "session-creature", startedAt: 100 }),
    );
    state = journeyReducer(state, artifactDetected("first-work", 200));
    const firstForm = state.creatureForm;
    state = journeyReducer(state, artifactDetected("second-work", 300));

    expect(firstForm).not.toBeNull();
    expect(state.creatureForm).toBe(firstForm);
  });

  it("lets a scan shape the narrative without requiring a choice", () => {
    const state = journeyReducer(
      undefined,
      artifactDetected("grand-hotel-bald-cockatoo", 200),
    );

    expect(state.discoveries[0]).not.toHaveProperty("choiceId");
    expect(state.narrativeState).toMatchObject({
      openness: 2,
      coherence: -2,
      voice: 1,
    });
  });

  it("ignores duplicate scans without changing sequence or active state", () => {
    let state = journeyReducer(undefined, artifactDetected("memory-fragment", 100));
    state = journeyReducer(state, artifactCollected("memory-fragment"));
    state = journeyReducer(state, setActiveArtifact(null));
    state = journeyReducer(state, artifactDetected("memory-fragment", 999));

    expect(state.discoveries).toEqual([
      { artifactId: "memory-fragment", discoveredAt: 100, sequence: 1 },
    ]);
    expect(state.activeArtifactId).toBeNull();
  });

  it("reopens a discovered artifact without adding another discovery", () => {
    let state = journeyReducer(undefined, artifactDetected("memory-fragment", 100));
    state = journeyReducer(state, artifactCollected("memory-fragment"));
    state = journeyReducer(state, setActiveArtifact(null));
    state = journeyReducer(state, artifactRevisited("memory-fragment"));

    expect(state.discoveries).toEqual([
      { artifactId: "memory-fragment", discoveredAt: 100, sequence: 1 },
    ]);
    expect(state.activeArtifactId).toBe("memory-fragment");
    expect(state.experiencePhase).toBe("revealing");
  });

  it("resets all persistent and transient journey data", () => {
    const discovered = journeyReducer(
      undefined,
      artifactDetected("memory-fragment", 100),
    );
    const reset = journeyReducer(discovered, resetJourney());

    expect(reset).toMatchObject({
      sessionId: null,
      startedAt: null,
      completedAt: null,
      discoveries: [],
      activeArtifactId: null,
      experiencePhase: "intro",
      creatureForm: null,
    });
  });

  it("records when the visitor finishes the story", () => {
    const state = journeyReducer(
      journeyReducer(undefined, artifactDetected("memory-fragment", 100)),
      finishJourney(1_500),
    );

    expect(state.completedAt).toBe(1_500);
    expect(state.experiencePhase).toBe("ending");
  });
});
