// Renders every artifact's particle constellation to a dark target and a
// matching -white.png target with the same painter as the gallery.
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
const pixelRatio = 2;
const variants = [
  { suffix: "", background: "#031015", colorKey: "color", surface: "dark" },
  { suffix: "-white", background: "#FFFFFF", colorKey: "alternativeColor", surface: "light" },
];

function renderFormation(artifact, variant) {
  const canvas = createCanvas(width * pixelRatio, height * pixelRatio);
  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = variant.background;
  context.fillRect(0, 0, width, height);

  const constellation = prepareConstellation(
    createArtifactFormationPositions(artifact, constellationParticleCount),
    artifact[variant.colorKey],
    variant.surface,
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
  for (const variant of variants) {
    const file = join(
      outputDirectory,
      `${artifact.exhibitionId}-${artifact.id}${variant.suffix}.png`,
    );
    writeFileSync(file, renderFormation(artifact, variant));
    console.log(`${artifact.particleForm.padEnd(13)} ${file}`);
  }
}
