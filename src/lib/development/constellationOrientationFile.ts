import type { Orientation } from "@/components/particles/constellationPainter";

export const CONSTELLATION_ORIENTATIONS_FILE = "src/data/constellationOrientations.ts";

const round = (value: number) => Math.round(value * 10000) / 10000;

/** Source of src/data/constellationOrientations.ts, one entry per artifact id. */
export function formatConstellationOrientations(orientations: Record<string, Orientation>) {
  const entries = Object.entries(orientations)
    .map(
      ([id, { yaw, pitch, roll = 0 }]) =>
        `  ${JSON.stringify(id)}: { yaw: ${round(yaw)}, pitch: ${round(pitch)}, roll: ${round(roll)} },`,
    )
    .join("\n");
  return `// Saved from the constellation gallery (/particles) during development.
// How each artifact's constellation is turned for its printed target, the
// compiled MindAR bundle and the scanner's assembly animation. After saving,
// run \`npm run targets:build\` to regenerate the targets.
import type { Orientation } from "@/components/particles/constellationPainter";

export const constellationOrientations: Record<string, Orientation> = {
${entries}
};
`;
}
