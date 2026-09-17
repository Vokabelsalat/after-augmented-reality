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
    expect(first).toHaveLength(5);
    expect(first.join(" ")).toMatch(/interface/i);
    expect(first.join(" ")).toMatch(/memory/i);
    expect(first.join(" ")).toMatch(/embodiment/i);
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

    expect(machineFirst[0]).toMatch(/interface/i);
    expect(memoryFirst[0]).toMatch(/memory/i);
    expect(machineFirst).not.toEqual(memoryFirst);
  });

  it("uses a compact single-part form", () => {
    const lines = generateJourneyNarrative(
      discoveries(["finding-frida"]),
      artifacts,
    );

    expect(lines).toHaveLength(3);
    expect(lines.join(" ")).toMatch(/memory/i);
    expect(lines.join(" ")).toContain("Finding Frida");
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

    expect(lines.at(-1)).toMatch(/memory.*(return|surface)/i);
  });

  it("varies its sentence structures across related paths", () => {
    const relatedPaths = [
      ["finding-frida", "historically-yours", "from-ingrid-to-bergen"],
      ["historically-yours", "from-ingrid-to-bergen", "finding-frida"],
      ["from-ingrid-to-bergen", "finding-frida", "historically-yours"],
      ["finding-frida", "from-ingrid-to-bergen", "historically-yours"],
    ].map((path) => generateJourneyNarrative(discoveries(path), artifacts));

    expect(new Set(relatedPaths.map((lines) => lines[0])).size).toBeGreaterThanOrEqual(3);
    expect(new Set(relatedPaths.map((lines) => lines.at(-1))).size).toBeGreaterThanOrEqual(2);
  });
});
