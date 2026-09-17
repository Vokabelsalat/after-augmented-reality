export const visualizationDesigns = ["constellation", "creature", "fish"] as const;

export type VisualizationDesign = (typeof visualizationDesigns)[number];

function isVisualizationDesign(value: string | undefined): value is VisualizationDesign {
  return visualizationDesigns.some((design) => design === value);
}

const configuredDesign = process.env.NEXT_PUBLIC_VISUALIZATION_DESIGN;

/**
 * One switch for every representation of a visitor path.
 *
 * - constellation: the original node-link particle glyphs from `main`
 * - creature: the assembled upright forms from `new_form`
 * - fish: the articulated swimming forms from `fishies`
 */
export const visualizationDesign: VisualizationDesign = isVisualizationDesign(configuredDesign)
  ? configuredDesign
  : "fish";

export const visualizationCopy = {
  constellation: {
    singular: "story",
    plural: "stories",
    personalTitle: "My Journey",
    collectiveTitle: "COLLECTIVE FIELD",
    collectivePlace: "field",
    finish: "Finish my story",
  },
  creature: {
    singular: "creature",
    plural: "creatures",
    personalTitle: "My Creature",
    collectiveTitle: "COLLECTIVE HABITAT",
    collectivePlace: "habitat",
    finish: "Finish my creature",
  },
  fish: {
    singular: "fish",
    plural: "fish",
    personalTitle: "My Fish",
    collectiveTitle: "COLLECTIVE AQUARIUM",
    collectivePlace: "aquarium",
    finish: "Finish my fish",
  },
} as const satisfies Record<VisualizationDesign, {
  singular: string;
  plural: string;
  personalTitle: string;
  collectiveTitle: string;
  collectivePlace: string;
  finish: string;
}>;

export const activeVisualizationCopy = visualizationCopy[visualizationDesign];
