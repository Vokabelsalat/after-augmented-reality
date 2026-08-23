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
      { targetIndex: 0, posterImageSrc: "/images/poster-0.jpeg" },
      { targetIndex: 1, posterImageSrc: "/images/poster-1.jpeg" },
      { targetIndex: 2, posterImageSrc: "/images/poster-2.jpeg" },
    ]);
  });
});
