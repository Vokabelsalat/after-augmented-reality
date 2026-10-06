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
  it("concatenates each artifact phrase in encounter order", () => {
    const lines = generateJourneyNarrative(
      discoveries(["grand-hotel-bald-cockatoo", "emperor"]),
      artifacts,
    );

    expect(lines).toEqual([
      "A hotel nested inside the tank and printed a fortune for the tide.",
      "A word descended beyond reach. A hand-drawn light followed it down.",
    ]);
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
    expect(letterFirst[0]).toBe(
      "P sent a letter through the glass. S answered from the water.",
    );
    expect(archiveFirst[0]).toBe(
      "A photograph sank into the substrate. By morning, it had grown roots.",
    );
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
