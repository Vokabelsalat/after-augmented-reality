import { describe, expect, it } from "vitest";
import {
  aggregateContributionDwellTimes,
  artifactPlanLabel,
  collectiveActivityIntensities,
} from "@/lib/contributions/heatmap";
import type { ExhibitionContribution } from "@/types/contribution";

function contribution(
  id: number,
  parts: ExhibitionContribution["parts"],
): ExhibitionContribution {
  return {
    id,
    publicId: `public-${id}`,
    creatureForm: "fish",
    creaturePalette: {
      body: "#34789a",
      head: "#285a7a",
      belly: "#c8d9d3",
      fin: "#d5b43d",
      marking: "#183b55",
    },
    creaturePattern: { kind: "plain", density: 1, orientation: "along", contrast: 0.5, seed: 1 },
    creatureProportions: { x: 1, y: 1, z: 1 },
    parts,
    narrative: [],
    createdAt: "2026-09-17T00:00:00.000Z",
  };
}

function part(artifactId: string, dwellMs?: number) {
  return {
    artifactId,
    partId: "memory-crown" as const,
    label: "Test part",
    sequence: 1,
    theme: "memory" as const,
    color: "#fff",
    dwellMs,
  };
}

describe("collective heat-map aggregation", () => {
  it("converts artwork titles to the labels used by the exhibition plan", () => {
    expect(artifactPlanLabel("The Grand Hotel Bald Cockatoo")).toBe(
      "the-grand-hotel-bald-cockatoo",
    );
    expect(artifactPlanLabel("Between Page & Screen")).toBe(
      "between-page-and-screen",
    );
  });

  it("combines dwell time and visit counts across every contribution", () => {
    const result = aggregateContributionDwellTimes(
      [
        contribution(1, [part("first", 10_000), part("second", 20_000)]),
        contribution(2, [part("first", 30_000)]),
      ],
      ["first", "second", "unvisited"],
    );

    expect(result).toEqual([
      {
        artifactId: "first",
        totalDwellMs: 40_000,
        visitCount: 2,
        averageDwellMs: 20_000,
      },
      {
        artifactId: "second",
        totalDwellMs: 20_000,
        visitCount: 1,
        averageDwellMs: 20_000,
      },
      {
        artifactId: "unvisited",
        totalDwellMs: 0,
        visitCount: 0,
        averageDwellMs: 0,
      },
    ]);
  });

  it("ignores missing, invalid, and unknown dwell-time entries", () => {
    const result = aggregateContributionDwellTimes(
      [
        contribution(1, [
          part("first"),
          part("first", Number.NaN),
          part("first", -1),
          part("not-in-exhibition", 50_000),
        ]),
      ],
      ["first"],
    );

    expect(result[0]).toMatchObject({ totalDwellMs: 0, visitCount: 0 });
  });

  it("combines visit frequency and dwell time into a bounded intensity", () => {
    const intensities = collectiveActivityIntensities([
      { artifactId: "quiet", totalDwellMs: 20_000, visitCount: 1, averageDwellMs: 20_000 },
      { artifactId: "popular", totalDwellMs: 120_000, visitCount: 8, averageDwellMs: 15_000 },
      { artifactId: "unvisited", totalDwellMs: 0, visitCount: 0, averageDwellMs: 0 },
    ]);

    expect(intensities.get("popular")).toBe(1);
    expect(intensities.get("quiet")).toBeGreaterThan(0);
    expect(intensities.get("quiet")).toBeLessThan(1);
    expect(intensities.get("unvisited")).toBe(0);
  });
});
