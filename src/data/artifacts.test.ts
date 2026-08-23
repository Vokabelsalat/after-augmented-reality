import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";

describe("artifact target image configuration", () => {
  it("connects every MindAR target index to its matching source image", () => {
    expect(
      artifacts.map(({ targetIndex, posterImageSrc, posterAspectRatio }) => ({
        targetIndex,
        posterImageSrc,
        posterAspectRatio,
      })),
    ).toEqual([
      {
        targetIndex: 0,
        posterImageSrc: "/images/boston.jpeg",
        posterAspectRatio: 3239 / 2240,
      },
      {
        targetIndex: 1,
        posterImageSrc: "/images/algarve.jpeg",
        posterAspectRatio: 1643 / 2493,
      },
      {
        targetIndex: 2,
        posterImageSrc: "/images/torro.jpeg",
        posterAspectRatio: 2199 / 3079,
      },
    ]);
  });
});
