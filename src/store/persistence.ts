import type { AppStore } from "@/store";
import { isAquaticForm } from "@/lib/creature/aquaticForms";
import type { Discovery, PersistedJourney } from "@/store/journeySlice";

export const JOURNEY_STORAGE_KEY = "say-hi:journey:v1";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isNarrativeState(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["openness", "memory", "agency", "coherence", "voice"].every(
    (axis) => typeof candidate[axis] === "number" && Number.isFinite(candidate[axis]),
  );
}

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
      (value.startedAt !== null && typeof value.startedAt !== "number") ||
      (value.completedAt != null && typeof value.completedAt !== "number") ||
      (value.creatureForm !== undefined && value.creatureForm !== null && !isAquaticForm(value.creatureForm)) ||
      (value.narrativeState !== undefined && !isNarrativeState(value.narrativeState))
    ) {
      return null;
    }

    return {
      sessionId: value.sessionId ?? null,
      startedAt: value.startedAt ?? null,
      completedAt: value.completedAt ?? null,
      ...(value.creatureForm ? { creatureForm: value.creatureForm } : {}),
      ...(value.narrativeState ? { narrativeState: value.narrativeState } : {}),
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
    const { sessionId, startedAt, completedAt, discoveries, narrativeState, creatureForm } = store.getState().journey;
    if (!sessionId && startedAt === null && discoveries.length === 0) {
      previous = "";
      storage.removeItem(JOURNEY_STORAGE_KEY);
      return;
    }
    const serialized = JSON.stringify({ sessionId, startedAt, completedAt, discoveries, narrativeState, creatureForm });
    if (serialized === previous) return;
    previous = serialized;
    storage.setItem(JOURNEY_STORAGE_KEY, serialized);
  });
}
