import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";
import { narrativeSentenceTemplates, narrativeWordBanks } from "@/data/narrativeLexicon";
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
  it("is deterministic and keeps the artworks visible in the generated route", () => {
    const path = discoveries(["between-page-and-screen", "finding-frida", "emperor"]);
    const first = generateJourneyNarrative(path, artifacts);
    const second = generateJourneyNarrative(path, artifacts);

    expect(first).toEqual(second);
    expect(first).toHaveLength(5);
    expect(first[1]).toMatch(/Between Page and Screen|letter|correspondence/i);
    expect(first[2]).toMatch(/Finding Frida|photograph|archive coral/i);
    expect(first[3]).toMatch(/Emperor|word|deep-sea signal/i);
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

    expect(letterFirst[1]).toMatch(/Between Page and Screen|letter|correspondence/i);
    expect(archiveFirst[1]).toMatch(/Finding Frida|photograph|archive coral/i);
    expect(letterFirst).not.toEqual(archiveFirst);
  });

  it("uses a compact single-encounter form", () => {
    const lines = generateJourneyNarrative(discoveries(["finding-frida"]), artifacts);

    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/Finding Frida|photograph|archive coral/i);
  });

  it("varies its wording between visits while remaining stable within a visit", () => {
    const versions = new Set(
      Array.from({ length: 24 }, (_, offset) => {
        const path = discoveries(["finding-frida", "historically-yours", "emperor"])
          .map((discovery) => ({ ...discovery, discoveredAt: discovery.discoveredAt + offset * 1_000 }));
        return generateJourneyNarrative(path, artifacts).join("\n");
      }),
    );

    expect(versions.size).toBeGreaterThan(12);
  });

  it("can weave a visitor choice into an encounter", () => {
    const versions = Array.from({ length: 40 }, (_, offset) => generateJourneyNarrative([
      {
        artifactId: "your-update-has-failed",
        sequence: 1,
        discoveredAt: 1_000 + offset,
        choiceId: "change",
      },
    ], artifacts).join(" "));

    expect(versions.some((narrative) => narrative.includes("let it change"))).toBe(true);
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
    expect(lines[0]).toMatch(/aquarium|tank|catalogue|archive|classification machine|glass chamber/i);
    expect(lines.join(" ")).not.toMatch(/\{\w+\}/);
  });

  it("exposes substantial editable word banks and sentence templates", () => {
    expect(Object.values(narrativeWordBanks).every((words) => words.length >= 6)).toBe(true);
    expect(narrativeSentenceTemplates.opening.length).toBeGreaterThanOrEqual(5);
    expect(narrativeSentenceTemplates.encounter.length).toBeGreaterThanOrEqual(6);
  });
});
