import { readFileSync } from "node:fs";
import { decode } from "@msgpack/msgpack";
import { describe, expect, it } from "vitest";
import { artifacts } from "@/data/artifacts";

describe("artifact target image configuration", () => {
  it("maps the full exhibition in CSV order to unique target indices", () => {
    expect(artifacts).toHaveLength(16);
    expect(artifacts.map(({ exhibitionId }) => exhibitionId)).toEqual(
      Array.from({ length: 16 }, (_, index) => index + 1),
    );
    expect(artifacts.map(({ targetIndex }) => targetIndex)).toEqual(
      Array.from({ length: 16 }, (_, index) => index),
    );
    expect(artifacts[0].title).toBe("Finding Frida");
    expect(artifacts[12].title).toBe("Goliath");
    expect(artifacts[15].title).toBe("Fiery Sparks of Light");
  });

  it("keeps the three poster families while assigning artwork-specific particles", () => {
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
    expect(artifacts.map(({ particleForm, color }) => [particleForm, color])).toEqual([
      ["torus", "#356B4B"],
      ["triad", "#6C3F61"],
      ["tree", "#597D8C"],
      ["cuboid", "#79A83B"],
      ["nest", "#D5A62E"],
      ["prism", "#C4473D"],
      ["book", "#ffffff"],
      ["skateboard", "#8B5E3C"],
      ["brain", "#555555"],
      ["hotel", "#51477F"],
      ["pillar", "#B44772"],
      ["butterfly", "#28374F"],
      ["dodecahedron", "#2D7F88"],
      ["crystal", "#8CB6C7"],
      ["hourglass", "#C19D65"],
      ["spiral", "#E45D3E"],
    ]);
  });

  it("gives every artifact a distinct creature part", () => {
    expect(new Set(artifacts.map(({ creaturePart }) => creaturePart.id)).size).toBe(16);
    expect(
      artifacts.find(({ id }) => id === "grand-hotel-bald-cockatoo")?.creaturePart,
    ).toMatchObject({ id: "cockatoo-beak", label: "Cockatoo beak" });
  });

  it("includes complete aquarium metadata for every artifact", () => {
    artifacts.forEach((artifact) => {
      expect(artifact.marineType).toBeTruthy();
      expect(artifact.classification).toBeTruthy();
      expect(artifact.visualTraits).toHaveLength(2);
      expect(artifact.storylet).toBeTruthy();
      expect(artifact.choice.options).toHaveLength(2);
    });
  });
});

describe("compiled MindAR bundle", () => {
  it("contains one target per artifact", () => {
    const bundle = decode(readFileSync("public/targets/exhibition.mind")) as {
      dataList: unknown[];
    };
    expect(bundle.dataList).toHaveLength(artifacts.length);
  });
});
