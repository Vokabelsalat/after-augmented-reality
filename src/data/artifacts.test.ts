import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";

describe("artifact target image configuration", () => {
  it("maps the full exhibition in CSV order to unique target indices", () => {
    expect(artifacts).toHaveLength(13);
    expect(artifacts.map(({ targetIndex }) => targetIndex)).toEqual(
      Array.from({ length: 13 }, (_, index) => index),
    );
    expect(artifacts[0].title).toBe("Finding Frida");
    expect(artifacts[12].title).toBe("Goliath");
  });

  it("reuses only the three established visual families", () => {
    expect(new Set(artifacts.map(({ posterImageSrc }) => posterImageSrc))).toEqual(
      new Set([
        "/images/melting-eye.jpeg",
        "/images/eye.jpeg",
        "/images/hands.jpeg",
      ]),
    );
    expect(new Set(artifacts.map(({ theme }) => theme))).toEqual(
      new Set(["memory", "interface", "worldmaking", "embodiment", "agency"]),
    );
    expect(
      artifacts.every(
        ({ particleForm, color }) =>
          (particleForm === "memory" && color === "#FF7557") ||
          (particleForm === "machine" && color === "#58D6FF") ||
          (particleForm === "body" && color === "#C69CFF"),
      ),
    ).toBe(true);
  });
});
