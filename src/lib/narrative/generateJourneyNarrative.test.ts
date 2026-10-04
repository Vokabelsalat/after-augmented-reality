import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import { generateJourneyNarrative } from "@/lib/narrative/generateJourneyNarrative";
import type { Discovery } from "@/store/journeySlice";

function discoveries(ids: string[]): Discovery[] {
  return ids.map((artifactId, index) => ({
    artifactId,
    sequence: index + 1,
    discoveredAt: 100 + index,
  }));
}

describe("generateJourneyNarrative", () => {
  it("is deterministic", () => {
    const path = discoveries(["between-page-and-screen", "finding-frida", "emperor"]);
    expect(generateJourneyNarrative(path, artifacts)).toEqual(
      generateJourneyNarrative(path, artifacts),
    );
  });

  it("creates one concise one-to-three-line stanza per encounter", () => {
    const lines = generateJourneyNarrative(
      discoveries(["grand-hotel-bald-cockatoo", "emperor"]),
      artifacts,
    );

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => {
      const stanzaLines = line.split("\n");
      return stanzaLines.length >= 1 && stanzaLines.length <= 3
        && stanzaLines.every((sentence) => /^[A-Z].*\.$/.test(sentence));
    })).toBe(true);
    expect(lines.join("\n")).not.toContain("—");
  });

  it("preserves the scanned route without an introduction or conclusion", () => {
    const letterFirst = generateJourneyNarrative(
      discoveries(["between-page-and-screen", "finding-frida"]),
      artifacts,
    );
    const archiveFirst = generateJourneyNarrative(
      discoveries(["finding-frida", "between-page-and-screen"]),
      artifacts,
    );

    expect(letterFirst).toHaveLength(2);
    expect(letterFirst[0]).toMatch(/QR shells/i);
    expect(archiveFirst[0]).toMatch(/photograph scales/i);
  });

  it("varies its language between visits while remaining stable within a visit", () => {
    const versions = new Set(
      Array.from({ length: 24 }, (_, offset) => {
        const path = discoveries(["finding-frida", "historically-yours", "emperor"])
          .map((discovery) => ({ ...discovery, discoveredAt: discovery.discoveredAt + offset * 1_000 }));
        return generateJourneyNarrative(path, artifacts).join("\n\n");
      }),
    );

    expect(versions.size).toBeGreaterThan(12);
  });

  it("varies stanza length between one and three lines", () => {
    const lineCounts = new Set(
      Array.from({ length: 80 }, (_, offset) => generateJourneyNarrative([
        {
          artifactId: "grand-hotel-bald-cockatoo",
          sequence: 1,
          discoveredAt: 1_000 + offset,
        },
      ], artifacts)[0].split("\n").length),
    );

    expect(lineCounts).toEqual(new Set([1, 2, 3]));
  });

  it("keeps every stop in a longer path", () => {
    const path = discoveries([
      "finding-frida",
      "historically-yours",
      "from-ingrid-to-bergen",
      "your-update-has-failed",
      "between-page-and-screen",
    ]);

    expect(generateJourneyNarrative(path, artifacts)).toHaveLength(path.length);
  });

  it("waits quietly before the first scan", () => {
    expect(generateJourneyNarrative([], artifacts)).toEqual(["The fishbowl waits."]);
  });
});
