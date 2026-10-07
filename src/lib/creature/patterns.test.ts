import { describe, expect, it } from "vitest";
import {
  creaturePattern,
  creaturePatternKinds,
  isCreaturePattern,
  patternForTraitCount,
} from "@/lib/creature/patterns";

describe("creaturePattern", () => {
  it("draws the same valid pattern for the same seed", () => {
    expect(creaturePattern("visitor-1")).toEqual(creaturePattern("visitor-1"));
    expect(isCreaturePattern(creaturePattern("visitor-1"))).toBe(true);
  });

  it("varies across visitors and uses every kind", () => {
    const patterns = Array.from({ length: 400 }, (_, index) => creaturePattern(`visitor-${index}`));
    expect(patterns.every(isCreaturePattern)).toBe(true);
    expect(new Set(patterns.map((pattern) => pattern.kind))).toEqual(new Set(creaturePatternKinds));
    expect(new Set(patterns.map((pattern) => pattern.density))).toEqual(new Set([1, 2, 3]));
    expect(new Set(patterns.map((pattern) => pattern.orientation))).toEqual(new Set(["along", "around"]));
  });
});

describe("isCreaturePattern", () => {
  const valid = { kind: "spots", density: 2, orientation: "along", contrast: 0.6, seed: 42 };

  it("accepts a well-formed pattern", () => {
    expect(isCreaturePattern(valid)).toBe(true);
  });

  it.each([
    ["an unknown kind", { ...valid, kind: "tartan" }],
    ["a density out of range", { ...valid, density: 4 }],
    ["an unknown orientation", { ...valid, orientation: "diagonal" }],
    ["a contrast below the range", { ...valid, contrast: 0.1 }],
    ["a fractional seed", { ...valid, seed: 1.5 }],
    ["a missing field", { kind: "spots", density: 2, orientation: "along", contrast: 0.6 }],
  ])("rejects %s", (_, value) => {
    expect(isCreaturePattern(value)).toBe(false);
  });
});

describe("patternForTraitCount", () => {
  const spots = { kind: "spots", density: 2, orientation: "along", contrast: 0.6, seed: 42 } as const;

  it("keeps the first specimen plain and reveals the pattern with the second trait", () => {
    expect(patternForTraitCount(spots, 0)?.kind).toBe("plain");
    expect(patternForTraitCount(spots, 1)?.kind).toBe("plain");
    expect(patternForTraitCount(spots, 2)).toEqual(spots);
    expect(patternForTraitCount(spots, 7)).toEqual(spots);
  });

  it("stays plain before the second trait even without a stored pattern", () => {
    expect(patternForTraitCount(undefined, 1)?.kind).toBe("plain");
    expect(patternForTraitCount(undefined, 2)).toBeUndefined();
  });
});
