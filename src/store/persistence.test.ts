import { describe, expect, it } from "vitest";
import { makeStore } from "@/store";
import { artifactDetected, startJourney } from "@/store/journeySlice";
import {
  JOURNEY_STORAGE_KEY,
  clearJourney,
  loadJourney,
  saveJourney,
  subscribeToJourneyPersistence,
} from "@/store/persistence";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("journey persistence", () => {
  it("round-trips the serializable journey fields", () => {
    const storage = new MemoryStorage();
    const persisted = {
      sessionId: "session-test",
      startedAt: 100,
      discoveries: [
        { artifactId: "memory-fragment", sequence: 1, discoveredAt: 200 },
      ],
    };

    saveJourney(storage, persisted);
    expect(loadJourney(storage)).toEqual(persisted);
  });

  it("rejects malformed local data instead of crashing hydration", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      JOURNEY_STORAGE_KEY,
      JSON.stringify({ sessionId: 42, discoveries: "not-an-array" }),
    );

    expect(loadJourney(storage)).toBeNull();
  });

  it("subscribes to store changes and can clear the saved journey", () => {
    const storage = new MemoryStorage();
    const store = makeStore();
    const unsubscribe = subscribeToJourneyPersistence(store, storage);

    store.dispatch(startJourney({ sessionId: "session-live", startedAt: 10 }));
    store.dispatch(artifactDetected("body-space", 20));
    unsubscribe();

    expect(loadJourney(storage)?.discoveries[0]).toEqual({
      artifactId: "body-space",
      discoveredAt: 20,
      sequence: 1,
    });
    clearJourney(storage);
    expect(loadJourney(storage)).toBeNull();
  });
});
