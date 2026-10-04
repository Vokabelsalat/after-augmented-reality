import * as THREE from "three";
import type { AquaticForm } from "@/lib/creature/aquaticForms";

export const CREATURE_MODEL_OVERRIDES_KEY = "after-augmented-reality:creature-model-overrides:v1";

export type SavedNodeTransform = {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
};

export type CreatureModelOverrides = Partial<Record<AquaticForm, Record<string, SavedNodeTransform>>>;

export function meshKey(root: THREE.Object3D, target: THREE.Object3D) {
  let index = 0;
  let result: string | null = null;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || result) return;
    if (object === target) result = `mesh-${index}`;
    index += 1;
  });
  return result;
}

export function loadCreatureModelOverrides(): CreatureModelOverrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CREATURE_MODEL_OVERRIDES_KEY) ?? "{}") as CreatureModelOverrides;
  } catch {
    return {};
  }
}

export function saveCreatureModelOverrides(form: AquaticForm, changes: Record<string, SavedNodeTransform>) {
  const current = loadCreatureModelOverrides();
  const next = { ...current, [form]: { ...current[form], ...changes } };
  window.localStorage.setItem(CREATURE_MODEL_OVERRIDES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("creature-model-overrides-updated", { detail: { form } }));
}

export function clearCreatureModelOverrides(form: AquaticForm) {
  const current = loadCreatureModelOverrides();
  delete current[form];
  window.localStorage.setItem(CREATURE_MODEL_OVERRIDES_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("creature-model-overrides-updated", { detail: { form } }));
}

export function applyCreatureModelOverrides(root: THREE.Object3D, form: AquaticForm) {
  const overrides = loadCreatureModelOverrides()[form];
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
