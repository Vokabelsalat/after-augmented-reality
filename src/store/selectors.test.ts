import { describe, expect, it } from "vitest";
import { makeStore } from "@/store";
import { artifactDetected } from "@/store/journeySlice";
import {
  selectDiscoveredArtifacts,
  selectDiscoveryCount,
  selectHasDiscovered,
} from "@/store/selectors";

describe("journey selectors", () => {
  it("maps ordered discoveries back to typed artifact configuration", () => {
    const store = makeStore();
    store.dispatch(artifactDetected("body-space", 10));
    store.dispatch(artifactDetected("memory-fragment", 20));
    const state = store.getState();

    expect(selectDiscoveryCount(state)).toBe(2);
    expect(
      selectDiscoveredArtifacts(state).map(({ artifact }) => artifact.id),
    ).toEqual(["body-space", "memory-fragment"]);
    expect(selectHasDiscovered("body-space")(state)).toBe(true);
    expect(selectHasDiscovered("machine-voice")(state)).toBe(false);
  });
});
