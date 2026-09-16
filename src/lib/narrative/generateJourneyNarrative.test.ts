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
      "between-page-and-screen",
      "finding-frida",
      "emperor",
    ]);
    const first = generateJourneyNarrative(path, artifacts);
    const second = generateJourneyNarrative(path, artifacts);

    expect(first).toEqual(second);
    expect(first).toEqual([
      "You began with interface.",
      "Then memory crossed the path as an archive,",
      "asking its growing body to return.",
      "Embodiment arrived last,",
      "carrying reach into what remains.",
      "Three parts now move as one.",
    ]);
  });

  it("changes when discovery order changes", () => {
    const machineFirst = generateJourneyNarrative(
      discoveries(["between-page-and-screen", "finding-frida"]),
      artifacts,
    );
    const memoryFirst = generateJourneyNarrative(
      discoveries(["finding-frida", "between-page-and-screen"]),
      artifacts,
    );

    expect(machineFirst[0]).toBe("You began with interface.");
    expect(memoryFirst[0]).toBe("You began with memory.");
    expect(machineFirst).not.toEqual(memoryFirst);
  });

  it("uses a compact single-part form", () => {
    expect(
      generateJourneyNarrative(discoveries(["finding-frida"]), artifacts),
    ).toEqual([
      "You began with memory.",
      "An archive loosened from the surface,",
      "asking you to return.",
      "One new part travels with you.",
    ]);
  });

  it("acknowledges a repeated theme", () => {
    const secondMemory: ExhibitionArtifact = {
      ...artifacts[0],
      id: "memory-return",
      title: "Memory Returns",
    };
    const lines = generateJourneyNarrative(
      discoveries(["finding-frida", "between-page-and-screen", "memory-return"]),
      [...artifacts, secondMemory],
    );

    expect(lines).toContain("Memory returned, changing its echo.");
  });
});
