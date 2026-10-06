// Compiles the exported constellation PNGs into public/targets/exhibition.mind
// with MindAR's offline compiler. Only the -white targets are compiled, in
// exhibitionId order, so MindAR index N is the artifact with targetIndex N.
import { writeFileSync } from "node:fs";
import { loadImage } from "canvas";
import { OfflineCompiler } from "mind-ar/src/image-target/offline-compiler.js";
import { artifacts } from "../src/data/artifacts.ts";

const ordered = [...artifacts].sort((a, b) => a.targetIndex - b.targetIndex);
const sources = ordered.map((artifact) => ({
  artifact,
  file: `public/targets/${artifact.exhibitionId}-${artifact.id}-white.png`,
}));
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
