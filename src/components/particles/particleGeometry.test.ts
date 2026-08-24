import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import {
  createArtifactFormationPositions,
  createNarrativeGeometry,
} from "@/components/particles/particleGeometry";

describe("artifact particle formations", () => {
  it("is deterministic for the same artifact and particle count", () => {
    const first = createArtifactFormationPositions(artifacts[0], 128);
    const second = createArtifactFormationPositions(artifacts[0], 128);

    expect(Array.from(first)).toEqual(Array.from(second));
  });

  it("creates a distinct finite shape for every configured artifact", () => {
    const formations = artifacts.map((artifact) =>
      createArtifactFormationPositions(artifact, 128),
    );

    formations.forEach((formation) => {
      expect(formation).toHaveLength(128 * 3);
      expect(Array.from(formation).every(Number.isFinite)).toBe(true);
    });
    expect(Array.from(formations[0])).not.toEqual(Array.from(formations[1]));
    expect(Array.from(formations[1])).not.toEqual(Array.from(formations[2]));
    expect(Array.from(formations[2])).not.toEqual(Array.from(formations[0]));
  });

  it("starts as a circle and releases every particle toward the edges", () => {
    const geometry = createNarrativeGeometry(artifacts[0], 180);
    const source = geometry.getAttribute("aSource");
    const release = geometry.getAttribute("aRelease");
    let particlesOnRim = 0;

    for (let index = 0; index < source.count; index += 1) {
      const sourceRadius = Math.hypot(source.getX(index), source.getY(index));
      const releaseRadius = Math.hypot(release.getX(index), release.getY(index));
      if (sourceRadius > 0.98) particlesOnRim += 1;
      expect(sourceRadius).toBeLessThanOrEqual(1.08);
      expect(releaseRadius).toBeGreaterThanOrEqual(3.2);
    }

    expect(particlesOnRim).toBeGreaterThanOrEqual(55);
    geometry.dispose();
  });
});
