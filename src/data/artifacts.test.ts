import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";

describe("artifact target image configuration", () => {
  it("connects every MindAR target index to its matching source image", () => {
    expect(
      artifacts.map(({ targetIndex, posterImageSrc }) => ({
        targetIndex,
        posterImageSrc,
      })),
    ).toEqual([
      {
        targetIndex: 0,
        posterImageSrc: "/images/boston.jpeg",
      },
      {
        targetIndex: 1,
        posterImageSrc: "/images/algarve.jpeg",
      },
      {
        targetIndex: 2,
        posterImageSrc: "/images/torro.jpeg",
      },
    ]);
  });
});
