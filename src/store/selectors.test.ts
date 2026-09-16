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
    store.dispatch(artifactDetected("emperor", 10));
    store.dispatch(artifactDetected("finding-frida", 20));
    const state = store.getState();

    expect(selectDiscoveryCount(state)).toBe(2);
    expect(
      selectDiscoveredArtifacts(state).map(({ artifact }) => artifact.id),
    ).toEqual(["emperor", "finding-frida"]);
    expect(selectHasDiscovered("emperor")(state)).toBe(true);
    expect(selectHasDiscovered("between-page-and-screen")(state)).toBe(false);
  });
});
