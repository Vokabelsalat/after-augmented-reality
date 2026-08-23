import type { AppStore } from "@/store";
import type { Discovery, PersistedJourney } from "@/store/journeySlice";

export const JOURNEY_STORAGE_KEY = "say-hi:journey:v1";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isDiscovery(value: unknown): value is Discovery {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Discovery>;
  return (
    typeof candidate.artifactId === "string" &&
    typeof candidate.sequence === "number" &&
    typeof candidate.discoveredAt === "number"
  );
}

export function loadJourney(storage: StorageLike): PersistedJourney | null {
  try {
    const raw = storage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PersistedJourney>;

    if (
      !Array.isArray(value.discoveries) ||
      !value.discoveries.every(isDiscovery) ||
      (value.sessionId !== null && typeof value.sessionId !== "string") ||
      (value.startedAt !== null && typeof value.startedAt !== "number")
    ) {
      return null;
    }

    return {
      sessionId: value.sessionId ?? null,
      startedAt: value.startedAt ?? null,
      discoveries: value.discoveries
        .slice()
        .sort((a, b) => a.sequence - b.sequence),
    };
  } catch {
    return null;
  }
}

export function saveJourney(
  storage: StorageLike,
  journey: PersistedJourney,
) {
  storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journey));
}

export function clearJourney(storage: StorageLike) {
  storage.removeItem(JOURNEY_STORAGE_KEY);
}

export function subscribeToJourneyPersistence(
  store: AppStore,
  storage: StorageLike,
) {
  let previous = "";
  return store.subscribe(() => {
    const { sessionId, startedAt, discoveries } = store.getState().journey;
    if (!sessionId && startedAt === null && discoveries.length === 0) {
      previous = "";
      storage.removeItem(JOURNEY_STORAGE_KEY);
      return;
    }
    const serialized = JSON.stringify({ sessionId, startedAt, discoveries });
    if (serialized === previous) return;
    previous = serialized;
    storage.setItem(JOURNEY_STORAGE_KEY, serialized);
  });
}
