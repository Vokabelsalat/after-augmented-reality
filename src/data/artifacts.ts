import type { ExhibitionArtifact } from "@/types/exhibition";

type VisualFamily = Pick<
  ExhibitionArtifact,
  "particleForm" | "color" | "posterImageSrc"
>;

const visualFamilies: Record<"memory" | "machine" | "body", VisualFamily> = {
  memory: {
    particleForm: "memory",
    color: "#FF7557",
    posterImageSrc: "/images/melting-eye.jpeg",
  },
  machine: {
    particleForm: "machine",
    color: "#58D6FF",
    posterImageSrc: "/images/eye.jpeg",
  },
  body: {
    particleForm: "body",
    color: "#C69CFF",
    posterImageSrc: "/images/hands.jpeg",
  },
};

type ArtifactSource = Omit<
  ExhibitionArtifact,
  "particleForm" | "color" | "posterImageSrc"
> & {
  visualFamily: keyof typeof visualFamilies;
};

const exhibitionSources: ArtifactSource[] = [
  {
    id: "finding-frida",
    targetIndex: 0,
    title: "Finding Frida",
    artist: "Hilde K. Kjøs",
    visualFamily: "memory",
    theme: "memory",
    shortText:
      "Finding Frida is a documentary VR experience where past and present intertwine in an exploration of art, family and the power of human creativity. Photorealistic 3D scans, dreamlike projections and animated artwork blend with a soundscape of reworked foley and an original musical score. Voice-over drawn from interviews with Frida Hansen and contemporary historical sources seeks authenticity within a dreamlike world while shedding new light on a forgotten female artist. Central to the work is the value of role models, and how VR allows resonance to travel back and forth through time.",
    narrativeWords: ["remember", "archive", "return", "resonate"],
    creaturePart: {
      id: "memory-crown",
      label: "Memory scales",
      description: "Iridescent scales for carrying images between past and present.",
    },
  },
  {
    id: "historically-yours",
    targetIndex: 1,
    title: "Historically Yours",
    artist: "Lina Harder",
    visualFamily: "memory",
    theme: "memory",
    shortText: "Description forthcoming.",
    narrativeWords: ["remember", "record", "revisit", "inherit"],
    creaturePart: {
      id: "archive-ears",
      label: "Archive gills",
      description: "Frilled gills tuned to voices that history almost lost.",
    },
  },
  {
    id: "from-ingrid-to-bergen",
    targetIndex: 2,
    title: "From Ingrid to Bergen",
    artist: "Pedro Velho",
    visualFamily: "memory",
    theme: "memory",
    shortText: "Description forthcoming.",
    narrativeWords: ["trace", "route", "carry", "return"],
    creaturePart: {
      id: "route-tail",
      label: "Ribbon tail",
      description: "A streaming tail that remembers every turn in the route.",
    },
  },
  {
    id: "your-update-has-failed",
    targetIndex: 3,
    title: "Your Update Has Failed",
    artist: "Sérgio Galvão Roxo",
    visualFamily: "machine",
    theme: "interface",
    shortText: "Description forthcoming.",
    narrativeWords: ["update", "error", "restart", "persist"],
    creaturePart: {
      id: "signal-antenna",
      label: "Signal lure",
      description: "A glowing angler lure that keeps searching after failure.",
    },
  },
  {
    id: "grand-hotel-bald-cockatoo",
    targetIndex: 4,
    title: "The Grand Hotel Bald Cockatoo",
    artist: "Scott Rettberg, Caitlin Fisher, Roderick Coover",
    visualFamily: "machine",
    theme: "worldmaking",
    shortText: "Description forthcoming.",
    narrativeWords: ["enter", "corridor", "wander", "transform"],
    creaturePart: {
      id: "cockatoo-beak",
      label: "Cockatoo beak",
      description: "A bright beak made for calling into strange hotels.",
    },
  },
  {
    id: "glass-like-fabric",
    targetIndex: 5,
    title: "Glass Like Fabric",
    artist: "Jason Nelson",
    visualFamily: "machine",
    theme: "interface",
    shortText: "Description forthcoming.",
    narrativeWords: ["touch", "surface", "refract", "fold"],
    creaturePart: {
      id: "glass-wings",
      label: "Glass fins",
      description: "Translucent fins that fold light into new surfaces.",
    },
  },
  {
    id: "between-page-and-screen",
    targetIndex: 6,
    title: "Between Page and Screen",
    artist: "Amaranth Borsuk, Brad Bouse",
    visualFamily: "machine",
    theme: "interface",
    shortText:
      "An unlikely marriage of print and digital, Between Page and Screen chronicles a love affair between two characters, P and S. The book has no words, only inscrutable black and white geometric patterns that, when coupled with a webcam, conjure the written word. Reflected on screen, the reader sees themself with open book in hand, language springing alive and shape-shifting with each turn of the page. The story unfolds through a playful and cryptic exchange of letters between P and S as they struggle to define their relationship. Rich with innuendo, anagrams, etymological and sonic affinities between words, Between Page and Screen revels in language and the act of reading.",
    narrativeWords: ["read", "letter", "decode", "respond"],
    creaturePart: {
      id: "page-fins",
      label: "Page fin",
      description: "A folded dorsal fin poised between print, screen and motion.",
    },
  },
  {
    id: "bybanen-slop-surfer",
    targetIndex: 7,
    title: "Bybanen Slop Surfer",
    artist: "Colin Richard Robinson",
    visualFamily: "body",
    theme: "embodiment",
    shortText: "Description forthcoming.",
    narrativeWords: ["move", "balance", "glide", "arrive"],
    creaturePart: {
      id: "surfer-feet",
      label: "Surfer fins",
      description: "Balanced pelvic fins ready to glide through the city.",
    },
  },
  {
    id: "emperor",
    targetIndex: 8,
    title: "Emperor",
    artist: "Marion Burger, Ilan Cohen",
    visualFamily: "body",
    theme: "embodiment",
    shortText:
      "Emperor is an interactive narrative experience that invites us to travel inside the brain of a father suffering from aphasia. Alongside his daughter, we journey into the father’s mental space, imagined as a hand-drawn monochrome landscape, as she seeks to learn more about his inner self, now obscured by illness.",
    narrativeWords: ["speak", "silence", "reach", "remember"],
    creaturePart: {
      id: "inner-eye",
      label: "Inner eye",
      description: "An extra eye for finding a way through an inner world.",
    },
  },
  {
    id: "grand-hotel-galactic-center",
    targetIndex: 9,
    title: "The Grand Hotel Galactic Center",
    artist: "Scott Robert Rettberg",
    visualFamily: "machine",
    theme: "worldmaking",
    shortText: "Description forthcoming.",
    narrativeWords: ["orbit", "signal", "navigate", "connect"],
    creaturePart: {
      id: "orbit-ring",
      label: "Orbit markings",
      description: "Luminous bands that keep distant worlds in conversation.",
    },
  },
  {
    id: "her-name-was-gisberta",
    targetIndex: 10,
    title: "Her Name Was Gisberta",
    artist: "Sérgio Galvão Roxo",
    visualFamily: "body",
    theme: "agency",
    shortText:
      "Her Name Was Gisberta is a VR/2D documentary that portrays the life and death of Gisberta Salce, a Brazilian trans woman murdered by 14 young men in Porto in 2006. Drawing on virtual-reality perspective-taking, the project was created as a tool for education, social intervention and activism against transphobia.",
    narrativeWords: ["witness", "presence", "remember", "resist"],
    creaturePart: {
      id: "heart-plume",
      label: "Heart scale",
      description: "A bright central scale for presence, memory and resistance.",
    },
  },
  {
    id: "missing-10-hours",
    targetIndex: 11,
    title: "Missing 10 Hours",
    artist: "Fanni Fazakas",
    visualFamily: "body",
    theme: "agency",
    shortText:
      "Missing 10 Hours is a narrative VR experience created with survivors of substance abuse. Visitors become a bystander whose choices influence the story, navigating whether to help a young woman named Mara or become complicit in the actions of a perpetrator. Its multiplayer structure amplifies the impact of each decision across a night-time party that moves from excessive drinking and invasions of privacy to police intervention and a final revelation.",
    narrativeWords: ["choose", "choice", "intervene", "answer"],
    creaturePart: {
      id: "helping-arms",
      label: "Helping feelers",
      description: "Long sensory fins that make the choice to reach out.",
    },
  },
  {
    id: "goliath",
    targetIndex: 12,
    title: "Goliath",
    artist: "Anagram",
    visualFamily: "machine",
    theme: "worldmaking",
    shortText:
      "Through mind-bending animation, Goliath: Playing with Reality explores the limits of reality and the true story of a man diagnosed with schizophrenia. Echo guides visitors through the realities of Goliath, who spent years isolated in psychiatric institutions before finding connection in multiplayer games. Heartfelt dialogue, mesmerising visuals and symbolic interactions reveal his story across multiple worlds.",
    narrativeWords: ["play", "world", "connect", "return"],
    creaturePart: {
      id: "goliath-horns",
      label: "Reality comb",
      description: "A dorsal comb tuned into more than one reality.",
    },
  },
];

export const artifacts: ExhibitionArtifact[] = exhibitionSources.map(
  ({ visualFamily, ...artifact }) => ({
    ...artifact,
    ...visualFamilies[visualFamily],
  }),
);

export const artifactById = new Map(
  artifacts.map((artifact) => [artifact.id, artifact]),
);

export const artifactByTargetIndex = new Map(
  artifacts.map((artifact) => [artifact.targetIndex, artifact]),
);
