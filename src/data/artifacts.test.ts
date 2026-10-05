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
      ["book", "#202020"],
      ["skateboard", "#8B5E3C"],
      ["sphere", "#555555"],
      ["tower", "#51477F"],
      ["pillar", "#B44772"],
      ["fork", "#28374F"],
      ["dodecahedron", "#2D7F88"],
    ]);
  });

  it("gives every artifact a distinct creature part", () => {
    expect(new Set(artifacts.map(({ creaturePart }) => creaturePart.id)).size).toBe(13);
    expect(
      artifacts.find(({ id }) => id === "grand-hotel-bald-cockatoo")?.creaturePart,
    ).toMatchObject({ id: "cockatoo-beak", label: "Cockatoo beak" });
  });
});
