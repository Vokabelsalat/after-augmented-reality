import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import { generateJourneyNarrative } from "@/lib/narrative/generateJourneyNarrative";
import type { Discovery } from "@/store/journeySlice";
import type { ExhibitionArtifact } from "@/types/exhibition";

function discoveries(ids: string[]): Discovery[] {
  return ids.map((artifactId, index) => ({
    artifactId,
    sequence: index + 1,
    discoveredAt: 100 + index,
  }));
}

describe("generateJourneyNarrative", () => {
  it("is deterministic for the same path", () => {
    const path = discoveries([
      "machine-voice",
      "memory-fragment",
      "body-space",
    ]);
    const first = generateJourneyNarrative(path, artifacts);
    const second = generateJourneyNarrative(path, artifacts);

    expect(first).toEqual(second);
    expect(first).toEqual([
      "You began with machine.",
      "Then memory crossed the path as a trace,",
      "asking the fragments to return.",
      "Body arrived last,",
      "carrying distance into what remains.",
      "Three fragments travel with you.",
    ]);
  });

  it("changes when discovery order changes", () => {
    const machineFirst = generateJourneyNarrative(
      discoveries(["machine-voice", "memory-fragment"]),
      artifacts,
    );
    const memoryFirst = generateJourneyNarrative(
      discoveries(["memory-fragment", "machine-voice"]),
      artifacts,
    );

    expect(machineFirst[0]).toBe("You began with machine.");
    expect(memoryFirst[0]).toBe("You began with memory.");
    expect(machineFirst).not.toEqual(memoryFirst);
  });

  it("uses a compact single-fragment form", () => {
    expect(
      generateJourneyNarrative(discoveries(["memory-fragment"]), artifacts),
    ).toEqual([
      "You began with memory.",
      "A trace loosened from the surface,",
      "asking you to return.",
      "One fragment travels with you.",
    ]);
  });

  it("acknowledges a repeated theme", () => {
    const secondMemory: ExhibitionArtifact = {
      ...artifacts[0],
      id: "memory-return",
      title: "Memory Returns",
    };
    const lines = generateJourneyNarrative(
      discoveries(["memory-fragment", "machine-voice", "memory-return"]),
      [...artifacts, secondMemory],
    );

    expect(lines).toContain("Memory returned, changing its echo.");
  });
});
