"use client";

import { useCallback, useSyncExternalStore } from "react";

const MERGE_STATIC_MESHES_KEY = "after-augmented-reality:merge-static-meshes";
const changeEvent = "render-settings-updated";
// Used when the browser blocks storage, so the switch still works until the page reloads.
let mergeStaticMeshesFallback = true;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function readMergeStaticMeshes() {
  try {
    return window.localStorage.getItem(MERGE_STATIC_MESHES_KEY) !== "off";
  } catch {
    return mergeStaticMeshesFallback;
  }
}

/** Whether the aquarium merges each creature's still parts. On unless switched off in this browser. */
export function useMergeStaticMeshes() {
  const enabled = useSyncExternalStore(subscribe, readMergeStaticMeshes, () => true);
  const setEnabled = useCallback((next: boolean) => {
    mergeStaticMeshesFallback = next;
    try {
      window.localStorage.setItem(MERGE_STATIC_MESHES_KEY, next ? "on" : "off");
    } catch {
      // The fallback above carries the choice.
    }
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  return [enabled, setEnabled] as const;
}
