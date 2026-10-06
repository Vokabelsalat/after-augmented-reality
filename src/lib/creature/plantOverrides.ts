import * as THREE from "three";
import type { PlantKind } from "@/components/collective/AquariumDioramaPlants";
import type { SavedNodeTransform } from "@/lib/creature/modelOverrides";

export const PLANT_MODEL_OVERRIDES_KEY = "after-augmented-reality:plant-model-overrides:v1";

export type PlantModelOverrides = Partial<Record<PlantKind, Record<string, SavedNodeTransform>>>;

export function loadPlantModelOverrides(): PlantModelOverrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PLANT_MODEL_OVERRIDES_KEY) ?? "{}") as PlantModelOverrides;
  } catch {
    return {};
  }
}

export function savePlantModelOverrides(kind: PlantKind, changes: Record<string, SavedNodeTransform>) {
  const current = loadPlantModelOverrides();
  const next = { ...current, [kind]: { ...current[kind], ...changes } };
  window.localStorage.setItem(PLANT_MODEL_OVERRIDES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("plant-model-overrides-updated", { detail: { kind } }));
}

export function clearPlantModelOverrides(kind: PlantKind) {
  const current = loadPlantModelOverrides();
  delete current[kind];
  window.localStorage.setItem(PLANT_MODEL_OVERRIDES_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("plant-model-overrides-updated", { detail: { kind } }));
}

export function applyPlantModelOverrides(root: THREE.Object3D, kind: PlantKind) {
  const overrides = loadPlantModelOverrides()[kind];
  if (!overrides) return;
  let index = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const transform = overrides[`mesh-${index}`];
    index += 1;
    if (!transform) return;
    object.position.set(transform.x, transform.y, transform.z);
    object.scale.set(transform.scaleX, transform.scaleY, transform.scaleZ);
    object.rotation.set(
      THREE.MathUtils.degToRad(transform.rotationX),
      THREE.MathUtils.degToRad(transform.rotationY),
      THREE.MathUtils.degToRad(transform.rotationZ),
    );
  });
}
