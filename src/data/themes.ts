import type { ThemeDefinition, ThemeId } from "@/types/exhibition";

export const themes: Record<ThemeId, ThemeDefinition> = {
  memory: {
    id: "memory",
    label: "Memory",
    color: "#FF7557",
    description: "Archives, histories, role models, and what returns through time.",
  },
  interface: {
    id: "interface",
    label: "Interface",
    color: "#58D6FF",
    description: "Encounters shaped by screens, systems, text, and digital material.",
  },
  worldmaking: {
    id: "worldmaking",
    label: "Worldmaking",
    color: "#58D6FF",
    description: "Constructed realities, play, and the worlds entered through stories.",
  },
  embodiment: {
    id: "embodiment",
    label: "Embodiment",
    color: "#C69CFF",
    description: "Movement, perception, illness, and experience carried by the body.",
  },
  agency: {
    id: "agency",
    label: "Agency",
    color: "#C69CFF",
    description: "Choice, responsibility, solidarity, and the possibility of intervention.",
  },
};
