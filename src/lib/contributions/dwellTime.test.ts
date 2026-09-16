import { describe, expect, it } from "vitest";
import {
  calculateDwellTimes,
  dwellTimeReference,
  glyphScaleFromDwellMs,
} from "@/lib/contributions/dwellTime";

describe("contribution dwell time", () => {
  it("measures each scan until the next scan and the final scan until completion", () => {
    expect(
      calculateDwellTimes(
        [{ discoveredAt: 1_000 }, { discoveredAt: 11_000 }, { discoveredAt: 41_000 }],
        101_000,
      ),
    ).toEqual([10_000, 30_000, 60_000]);
  });

  it("maps longer dwell times to larger, bounded glyphs", () => {
    const short = glyphScaleFromDwellMs(5_000);
    const medium = glyphScaleFromDwellMs(60_000);
    const long = glyphScaleFromDwellMs(30 * 60_000);

    expect(short).toBeLessThan(medium);
    expect(medium).toBeLessThan(long);
    expect(glyphScaleFromDwellMs(0)).toBe(short);
    expect(glyphScaleFromDwellMs(24 * 60 * 60_000)).toBe(long);
    expect(glyphScaleFromDwellMs()).toBe(1);
  });

  it("amplifies small differences within the same story", () => {
    const reference = dwellTimeReference([20_000, 25_000]);
    const shorter = glyphScaleFromDwellMs(20_000, reference);
    const longer = glyphScaleFromDwellMs(25_000, reference);

    expect(longer - shorter).toBeGreaterThan(0.1);
    expect(dwellTimeReference([undefined, undefined])).toBeUndefined();
  });
});
