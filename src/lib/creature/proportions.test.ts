import { describe, expect, it } from "vitest";
import { creatureProportions, isCreatureProportions } from "@/lib/creature/proportions";

describe("creatureProportions", () => {
  it("draws the same valid proportions for the same seed", () => {
    expect(creatureProportions("visitor-1")).toEqual(creatureProportions("visitor-1"));
    expect(isCreatureProportions(creatureProportions("visitor-1"))).toBe(true);
  });

  it("stretches each axis independently across visitors", () => {
    const drawn = Array.from({ length: 400 }, (_, index) => creatureProportions(`visitor-${index}`));
    expect(drawn.every(isCreatureProportions)).toBe(true);
    for (const axis of ["x", "y", "z"] as const) {
      const values = drawn.map((proportions) => proportions[axis]);
      expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.2);
    }
    const tallAndShort = drawn.filter((proportions) => proportions.y > 1.08 && proportions.x < 0.94);
    expect(tallAndShort.length).toBeGreaterThan(0);
  });
});

describe("isCreatureProportions", () => {
  it.each([
    ["a missing axis", { x: 1, y: 1 }],
    ["a stretch beyond the range", { x: 1.5, y: 1, z: 1 }],
    ["a squash beyond the range", { x: 1, y: 0.5, z: 1 }],
    ["a non-number", { x: "1", y: 1, z: 1 }],
  ])("rejects %s", (_, value) => {
    expect(isCreatureProportions(value)).toBe(false);
  });
});
