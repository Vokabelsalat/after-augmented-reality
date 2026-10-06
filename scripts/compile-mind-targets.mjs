// Compiles the exported constellation PNGs into public/targets/exhibition.mind
// with MindAR's offline compiler. The dark targets come first in exhibitionId
// order, followed by the -white targets in the same order, so MindAR index N
// and N + artifacts.length both resolve to the artifact with targetIndex N.
import { writeFileSync } from "node:fs";
import { loadImage } from "canvas";
import { OfflineCompiler } from "mind-ar/src/image-target/offline-compiler.js";
import { artifacts } from "../src/data/artifacts.ts";

const ordered = [...artifacts].sort((a, b) => a.targetIndex - b.targetIndex);
const sources = ["", "-white"].flatMap((suffix) =>
  ordered.map((artifact) => ({
    artifact,
    file: `public/targets/${artifact.exhibitionId}-${artifact.id}${suffix}.png`,
  })),
);
const images = await Promise.all(sources.map(({ file }) => loadImage(file)));

const compiler = new OfflineCompiler();
let reported = -10;
const data = await compiler.compileImageTargets(images, (percent) => {
  if (percent - reported < 10) return;
  reported = percent;
  console.log(`compiling ${Math.round(percent)}%`);
});

data.forEach(({ trackingData }, index) => {
  const points = trackingData.map(({ points }) => points.length).join("/");
  console.log(`target ${index} ${sources[index].file}: tracking points ${points}`);
});

writeFileSync("public/targets/exhibition.mind", Buffer.from(compiler.exportData()));
console.log("wrote public/targets/exhibition.mind");
