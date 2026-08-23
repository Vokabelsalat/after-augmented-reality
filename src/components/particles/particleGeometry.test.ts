import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import { createArtifactFormationPositions } from "@/components/particles/particleGeometry";

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
});
