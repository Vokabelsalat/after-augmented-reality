import { describe, expect, it } from "vitest";
import {
  aquaticForms,
  creatureSizeScale,
  creatureSpeedFactor,
  creatureSpeedHoldSeconds,
  isAquaticForm,
  pickAquaticForm,
} from "@/lib/creature/aquaticForms";

describe("aquatic creature forms", () => {
  it("picks a stable form for the same first encounter", () => {
    expect(pickAquaticForm("session:artwork:100")).toBe(
      pickAquaticForm("session:artwork:100"),
    );
  });

  it("distributes different sessions across every available form", () => {
    const selected = new Set(
      Array.from({ length: 200 }, (_, index) => pickAquaticForm(`session-${index}`)),
    );

    expect(selected).toEqual(new Set(aquaticForms));
  });

  it("validates values received from persistence and the contribution API", () => {
    expect(isAquaticForm("jellyfish")).toBe(true);
    expect(isAquaticForm("eel")).toBe(false);
    expect(isAquaticForm("seagull")).toBe(false);
  });

  it("assigns stable, visibly different creature sizes", () => {
    expect(creatureSizeScale("visitor-12")).toBe(creatureSizeScale("visitor-12"));
    const sizes = new Set(
      Array.from({ length: 100 }, (_, index) => creatureSizeScale(`visitor-${index}`)),
    );
    expect(sizes.size).toBe(5);
    expect(Math.min(...sizes)).toBeLessThan(0.8);
    expect(Math.max(...sizes)).toBeGreaterThan(1.2);
  });
});

describe("creatureSpeedFactor", () => {
  const ids = Array.from({ length: 600 }, (_, index) => `public-${index}`);

  it("gives each visitor a stable speed", () => {
    expect(creatureSpeedFactor("public-1")).toBe(creatureSpeedFactor("public-1"));
  });

  it("spreads visitors over all three speed levels", () => {
    const factors = ids.map((id) => creatureSpeedFactor(id));
    expect(factors.some((factor) => factor < 0.62)).toBe(true);
    expect(factors.some((factor) => factor > 0.88 && factor < 1.12)).toBe(true);
    expect(factors.some((factor) => factor > 1.42)).toBe(true);
    expect(factors.every((factor) => factor >= 0.55 * 0.9 && factor <= 1.6 * 1.1)).toBe(true);
  });

  it("does not tie speed to size", () => {
    const smallest = ids.filter((id) => creatureSizeScale(id) === 0.72);
    const levels = new Set(smallest.map((id) => Math.round(creatureSpeedFactor(id) * 2)));
    expect(levels.size).toBeGreaterThanOrEqual(3);
  });
});

describe("changing pace", () => {
  it("moves each creature through different speed levels over time", () => {
    const levels = Array.from({ length: 12 }, (_, change) => creatureSpeedFactor("public-7", change));
    expect(new Set(levels.map((factor) => (factor < 0.7 ? "drifting" : factor > 1.3 ? "darting" : "steady"))).size).toBeGreaterThan(1);
    expect(creatureSpeedFactor("public-7", 3)).toBe(creatureSpeedFactor("public-7", 3));
  });

  it("holds each pace for 6 to 18 seconds", () => {
    const holds = Array.from({ length: 200 }, (_, change) => creatureSpeedHoldSeconds("public-7", change));
    expect(holds.every((seconds) => seconds >= 6 && seconds <= 18)).toBe(true);
    expect(Math.max(...holds) - Math.min(...holds)).toBeGreaterThan(8);
  });
});
