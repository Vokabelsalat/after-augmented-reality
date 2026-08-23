import type { ThemeDefinition, ThemeId } from "@/types/exhibition";

export const themes: Record<ThemeId, ThemeDefinition> = {
  memory: {
    id: "memory",
    label: "Memory",
    color: "#FF7557",
    description: "What returns differently each time it is recalled.",
  },
  machine: {
    id: "machine",
    label: "Machine",
    color: "#58D6FF",
    description: "Signals, systems, and voices that answer back.",
  },
  body: {
    id: "body",
    label: "Body",
    color: "#C69CFF",
    description: "The sensing form that carries every encounter.",
  },
  language: {
    id: "language",
    label: "Language",
    color: "#F2E85C",
    description: "Words as material, interruption, and shared space.",
  },
  place: {
    id: "place",
    label: "Place",
    color: "#6DE2A0",
    description: "Where a path gathers meaning through attention.",
  },
};
