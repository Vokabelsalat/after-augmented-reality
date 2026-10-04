import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import { aquaticForms } from "@/lib/creature/aquaticForms";
import {
  createSyntheticDataset,
  SYNTHETIC_FEATURED_FORMS,
  SYNTHETIC_VISITOR_COUNT,
} from "@/lib/development/syntheticDataset";

describe("createSyntheticDataset", () => {
  const cycleStart = "2026-10-02T22:00:00.000Z";

  it("builds a deterministic full exhibition day", () => {
    const first = createSyntheticDataset(cycleStart);
    const second = createSyntheticDataset(cycleStart);

    expect(first).toEqual(second);
    expect(first).toHaveLength(SYNTHETIC_VISITOR_COUNT);
    expect(new Set(first.map((visitor) => visitor.createdAt)).size).toBe(first.length);
    expect(first.map((visitor) => visitor.createdAt)).toEqual(
      first.map((visitor) => visitor.createdAt).slice().sort(),
    );
  });

  it("covers every creature form and creates varied paths and poems", () => {
    const dataset = createSyntheticDataset(cycleStart);
    const knownArtifacts = new Set(artifacts.map((artifact) => artifact.id));

    expect(new Set(dataset.map((visitor) => visitor.creatureForm))).toEqual(
      new Set(aquaticForms),
    );
    expect(new Set(dataset.map((visitor) => visitor.parts.length)).size).toBeGreaterThan(3);
    expect(new Set(dataset.map((visitor) => visitor.narrative.join("\n"))).size).toBeGreaterThan(18);
    expect(dataset.every((visitor) => visitor.parts.every((part) => knownArtifacts.has(part.artifactId)))).toBe(true);
    expect(dataset.every((visitor) => visitor.parts.every((part) => (part.dwellMs ?? 0) >= 35_000))).toBe(true);
    expect(dataset.every((visitor) => visitor.narrative.length === visitor.parts.length)).toBe(true);
  });

  it("features the new marine species in the test aquarium", () => {
    const dataset = createSyntheticDataset(cycleStart);

    expect(dataset.slice(0, SYNTHETIC_FEATURED_FORMS.length).map((visitor) => visitor.creatureForm)).toEqual(
      [...SYNTHETIC_FEATURED_FORMS],
    );
    const includedForms = new Set(dataset.map((visitor) => visitor.creatureForm));
    SYNTHETIC_FEATURED_FORMS.forEach((form) => expect(includedForms.has(form)).toBe(true));
  });
});
