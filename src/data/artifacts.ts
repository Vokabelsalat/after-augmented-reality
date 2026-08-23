import type { ExhibitionArtifact } from "@/types/exhibition";

export const artifacts: ExhibitionArtifact[] = [
  {
    id: "memory-fragment",
    targetIndex: 0,
    posterImageSrc: "/images/boston.jpeg",
    posterAspectRatio: 3239 / 2240,
    title: "Fragment of Memory",
    artist: "Artist One",
    theme: "memory",
    color: "#FF7557",
    shortText: "Every act of remembering rewrites what came before.",
    narrativeWords: ["remember", "trace", "return", "echo"],
  },
  {
    id: "machine-voice",
    targetIndex: 1,
    posterImageSrc: "/images/algarve.jpeg",
    posterAspectRatio: 1643 / 2493,
    title: "The Machine Speaks",
    artist: "Artist Two",
    theme: "machine",
    color: "#58D6FF",
    shortText: "A signal becomes a voice when somebody chooses to answer.",
    narrativeWords: ["signal", "repeat", "respond", "voice"],
  },
  {
    id: "body-space",
    targetIndex: 2,
    posterImageSrc: "/images/torro.jpeg",
    posterAspectRatio: 2199 / 3079,
    title: "A Body in Space",
    artist: "Artist Three",
    theme: "body",
    color: "#C69CFF",
    shortText: "Distance is measured by the body that moves through it.",
    narrativeWords: ["move", "touch", "distance", "remain"],
  },
];

export const artifactById = new Map(
  artifacts.map((artifact) => [artifact.id, artifact]),
);

export const artifactByTargetIndex = new Map(
  artifacts.map((artifact) => [artifact.targetIndex, artifact]),
);
