// Renders every artifact's particle constellation to
// public/targets/<exhibitionId>-<id>.png with the same painter as
// ParticleConstellationGallery's initial frame.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import {
  constellationParticleCount,
  frameConstellation,
  initialOrientation,
  paintConstellation,
  prepareConstellation,
} from "../src/components/particles/constellationPainter.ts";
import { createArtifactFormationPositions } from "../src/components/particles/particleGeometry.ts";
import { artifacts } from "../src/data/artifacts.ts";

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "../public/targets");
const width = 400;
const height = 300;
const pixelRatio = 4;
const background = "#031015";

function renderFormation(artifact) {
  const canvas = createCanvas(width * pixelRatio, height * pixelRatio);
  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const constellation = prepareConstellation(
    createArtifactFormationPositions(artifact, constellationParticleCount),
    artifact.color,
  );
  paintConstellation(
    context,
    width,
    height,
    constellation,
    initialOrientation,
    frameConstellation(constellation, initialOrientation),
  );

  return canvas.toBuffer("image/png");
}

mkdirSync(outputDirectory, { recursive: true });
for (const artifact of artifacts) {
  const file = join(outputDirectory, `${artifact.exhibitionId}-${artifact.id}.png`);
  writeFileSync(file, renderFormation(artifact));
  console.log(`${artifact.particleForm.padEnd(13)} ${file}`);
}
