"use client";

import { useCallback, useSyncExternalStore } from "react";

const MERGE_STATIC_MESHES_KEY = "after-augmented-reality:merge-static-meshes";
const REDUCE_GEOMETRY_DETAIL_KEY = "after-augmented-reality:reduce-geometry-detail";
const changeEvent = "render-settings-updated";
// Used when the browser blocks storage, so a switch still works until the page reloads.
const fallbacks = new Map<string, boolean>();

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

/** A setting that is on unless switched off in this browser. */
function useBrowserSwitch(key: string) {
  const read = useCallback(() => {
    try {
      return window.localStorage.getItem(key) !== "off";
    } catch {
      return fallbacks.get(key) ?? true;
    }
  }, [key]);
  const enabled = useSyncExternalStore(subscribe, read, () => true);
  const setEnabled = useCallback((next: boolean) => {
    fallbacks.set(key, next);
    try {
      window.localStorage.setItem(key, next ? "on" : "off");
    } catch {
      // The fallback above carries the choice.
    }
    window.dispatchEvent(new Event(changeEvent));
  }, [key]);
  return [enabled, setEnabled] as const;
}

/** Whether the aquarium merges each creature's still parts. */
export function useMergeStaticMeshes() {
  return useBrowserSwitch(MERGE_STATIC_MESHES_KEY);
}

/** Whether the aquarium builds rounded shapes with only as many segments as their size needs. */
export function useReduceGeometryDetail() {
  return useBrowserSwitch(REDUCE_GEOMETRY_DETAIL_KEY);
}
