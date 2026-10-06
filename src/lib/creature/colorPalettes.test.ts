import { describe, expect, it } from "vitest";
import { creatureColorPalette, isCreatureColorPalette } from "@/lib/creature/colorPalettes";

describe("creatureColorPalette", () => {
  it("keeps an individual creature's colors stable", () => {
    expect(creatureColorPalette("creature-42")).toEqual(
      creatureColorPalette("creature-42"),
    );
  });

  it("varies colors between individuals of the same species", () => {
    const whalePalettes = new Set(
      Array.from({ length: 24 }, (_, index) =>
        JSON.stringify(creatureColorPalette(`whale-${index}`)),
      ),
    );

    expect(whalePalettes.size).toBeGreaterThan(4);
  });

  it("accepts encoded palettes and rejects malformed colors", () => {
    expect(isCreatureColorPalette(creatureColorPalette("creature-42"))).toBe(true);
    expect(isCreatureColorPalette({ ...creatureColorPalette("creature-42"), fin: "orange" })).toBe(false);
  });
});
