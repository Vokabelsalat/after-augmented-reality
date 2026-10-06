// Checks that public/targets/exhibition.mind was compiled from the exported
// constellation PNGs in exhibitionId order, so target index N resolves to the
// artifact with targetIndex N. Each compiled target keeps a downscaled
// grayscale copy of its image, which is correlated against every PNG.
import { readFileSync } from "node:fs";
import { decode } from "@msgpack/msgpack";
import { createCanvas, loadImage } from "canvas";
import { artifacts } from "../src/data/artifacts.ts";

const bundle = decode(readFileSync("public/targets/exhibition.mind"));

function normalize(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - mean);
  const length = Math.sqrt(centered.reduce((sum, value) => sum + value * value, 0)) || 1;
  return centered.map((value) => value / length);
}

async function grayscale(file, width, height) {
  const image = await loadImage(file);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  return Float64Array.from({ length: width * height }, (_, index) =>
    (pixels[index * 4] + pixels[index * 4 + 1] + pixels[index * 4 + 2]) / 3,
  );
}

let mismatches = bundle.dataList.length === artifacts.length ? 0 : 1;
if (mismatches) {
  console.error(`Bundle has ${bundle.dataList.length} targets, artifacts.ts has ${artifacts.length}.`);
}

const { width, height } = bundle.dataList[0].trackingData[0];
const references = await Promise.all(
  artifacts.map(async (artifact) => ({
    artifact,
    pixels: normalize(
      await grayscale(`public/targets/${artifact.exhibitionId}-${artifact.id}.png`, width, height),
    ),
  })),
);

bundle.dataList.forEach((target, index) => {
  const compiled = normalize(Float64Array.from(target.trackingData[0].data));
  const [best] = references
    .map(({ artifact, pixels }) => ({
      artifact,
      score: compiled.reduce((sum, value, offset) => sum + value * pixels[offset], 0),
    }))
    .sort((a, b) => b.score - a.score);
  const expected = artifacts.find(({ targetIndex }) => targetIndex === index);
  const ok = best.artifact === expected;
  if (!ok) mismatches += 1;
  const trackingPoints = target.trackingData.map(({ points }) => points.length).join("/");
  console.log(
    `${ok ? "ok      " : "MISMATCH"} target ${index} → ${best.artifact.exhibitionId} ${best.artifact.title} (${best.score.toFixed(3)}), tracking points ${trackingPoints}`,
  );
});

process.exitCode = mismatches ? 1 : 0;
