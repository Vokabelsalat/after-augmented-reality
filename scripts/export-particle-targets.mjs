// Renders every artifact's white-background constellation to the small PNG
// that MindAR compiles into public/targets/exhibition.mind. These images only
// feed the compiler: the bundle size grows with their resolution, so they stay
// small. Print files come from `npm run targets:print` instead. The gallery
// keeps the dark preview, which is not exported.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import { artifacts } from "../src/data/artifacts.ts";
import { TARGET_ASPECT, drawConstellationTarget, targetFileName } from "./constellation-target.mjs";

/** Pixel width of the compiled target images; see the README before changing it. */
export const COMPILE_WIDTH = 400;

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "../public/targets");
const width = COMPILE_WIDTH;
const height = Math.round(COMPILE_WIDTH / TARGET_ASPECT);

mkdirSync(outputDirectory, { recursive: true });
for (const artifact of artifacts) {
  const canvas = createCanvas(width, height);
  drawConstellationTarget(canvas.getContext("2d"), artifact, width, height);
  const file = join(outputDirectory, targetFileName(artifact, "png"));
  writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`${artifact.particleForm.padEnd(13)} ${file} (${width}×${height})`);
}
