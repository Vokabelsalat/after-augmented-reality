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
  it("is deterministic and uses the curated artwork storylets", () => {
    const path = discoveries(["between-page-and-screen", "finding-frida", "emperor"]);
    const first = generateJourneyNarrative(path, artifacts);
    const second = generateJourneyNarrative(path, artifacts);

    expect(first).toEqual(second);
    expect(first).toHaveLength(5);
    expect(first.join(" ")).toContain("P sent a letter through the glass");
    expect(first.join(" ")).toContain("photograph");
    expect(first.join(" ")).toContain("word descended");
  });

  it("preserves encounter order", () => {
    const letterFirst = generateJourneyNarrative(
      discoveries(["between-page-and-screen", "finding-frida"]),
      artifacts,
    );
    const archiveFirst = generateJourneyNarrative(
      discoveries(["finding-frida", "between-page-and-screen"]),
      artifacts,
    );

    expect(letterFirst[1]).toContain("letter");
    expect(archiveFirst[1]).toContain("photograph");
    expect(letterFirst).not.toEqual(archiveFirst);
  });

  it("uses a compact single-encounter form", () => {
    const lines = generateJourneyNarrative(discoveries(["finding-frida"]), artifacts);

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("photograph");
  });

  it("changes its ending with the dominant narrative state", () => {
    const path = discoveries(["finding-frida", "between-page-and-screen", "emperor"]);
    const openEnding = generateJourneyNarrative(path, artifacts, {
      openness: 8, memory: 0, agency: 0, coherence: 0, voice: 0,
    });
    const fragmentedEnding = generateJourneyNarrative(path, artifacts, {
      openness: 0, memory: 0, agency: 0, coherence: -8, voice: 0,
    });

    expect(openEnding.at(-1)).not.toEqual(fragmentedEnding.at(-1));
  });

  it("compresses longer paths to a short poetic ending", () => {
    const lines = generateJourneyNarrative(
      discoveries([
        "finding-frida",
        "historically-yours",
        "from-ingrid-to-bergen",
        "your-update-has-failed",
        "between-page-and-screen",
      ]),
      artifacts,
    );

    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatch(/aquarium/i);
  });
});
