// Draws one artifact's white-background constellation target. The painter
// scales with the canvas, so the compiled MindAR image, the A4 test sheet and
// the large print files all show exactly the same picture at different sizes.
import {
  constellationParticleCount,
  frameConstellation,
  initialOrientation,
  paintConstellation,
  prepareConstellation,
} from "../src/components/particles/constellationPainter.ts";
import { createArtifactFormationPositions } from "../src/components/particles/particleGeometry.ts";

/** Width to height of every target. */
export const TARGET_ASPECT = 4 / 3;

export function targetFileName(artifact, extension) {
  return `${artifact.exhibitionId}-${artifact.id}-white.${extension}`;
}

/** Paints the target into the rectangle at (x, y) of the given size. */
export function drawConstellationTarget(context, artifact, width, height, x = 0, y = 0) {
  const constellation = prepareConstellation(
    createArtifactFormationPositions(artifact, constellationParticleCount),
    artifact.alternativeColor,
    "light",
  );
  context.save();
  context.translate(x, y);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  paintConstellation(
    context,
    width,
    height,
    constellation,
    initialOrientation,
    frameConstellation(constellation, initialOrientation),
  );
  context.restore();
}
