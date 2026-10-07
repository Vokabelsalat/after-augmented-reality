import type * as THREE from "three";

export type DetailRecipe = {
  /** Segments around the shape at full detail, which the needed detail is measured against. */
  segmentsAround: number;
  /** Builds the same shape with its segment counts scaled by `detail` (0–1). */
  build: (detail: number) => THREE.BufferGeometry;
};

// A WeakMap rather than userData, so clones and converted copies do not inherit the recipe.
const recipes = new WeakMap<THREE.BufferGeometry, DetailRecipe>();

/**
 * Builds a hand-made geometry at full detail and remembers how to rebuild it with fewer segments,
 * so the aquarium can lower its detail like it does for built-in shapes.
 */
export function withDetailRecipe(segmentsAround: number, build: (detail: number) => THREE.BufferGeometry) {
  const geometry = build(1);
  recipes.set(geometry, { segmentsAround, build });
  return geometry;
}

export function detailRecipeOf(geometry: THREE.BufferGeometry) {
  return recipes.get(geometry);
}
