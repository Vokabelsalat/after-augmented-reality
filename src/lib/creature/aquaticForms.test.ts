import { describe, expect, it } from "vitest";
import {
  aquaticForms,
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
});
