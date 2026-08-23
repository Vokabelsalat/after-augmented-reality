import { describe, expect, it } from "vitest";
import {
  artifactCollected,
  artifactDetected,
  artifactRevisited,
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
      discoveries: [],
      activeArtifactId: null,
      experiencePhase: "intro",
    });
  });
});
