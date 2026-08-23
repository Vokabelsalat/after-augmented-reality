import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const mindarBrowserBuild = fileURLToPath(
  new URL(
    "../node_modules/mind-ar/dist/mindar-image-three.prod.js",
    import.meta.url,
  ),
);

let source = readFileSync(mindarBrowserBuild, "utf8");

const patches = [
  {
    old: "sRGBEncoding as Si",
    replacement: "SRGBColorSpace as Si",
    description: "current Three.js color-space export",
  },
  {
    old: "this.renderer.outputEncoding = Si",
    replacement: "this.renderer.outputColorSpace = Si",
    description: "current Three.js renderer color-space property",
  },
  {
    old: '      const e = require("fs");\n      this.input = e.readFileSync(this.input.slice(7));',
    replacement:
      '      throw new Error("File URL inputs are unavailable in the browser-only MindAR adapter");',
    description: "browser-only TensorFlow IO branch",
  },
];

let changed = false;
for (const patch of patches) {
  if (source.includes(patch.old)) {
    source = source.replace(patch.old, patch.replacement);
    changed = true;
  } else if (!source.includes(patch.replacement)) {
    throw new Error(
      `MindAR compatibility patch could not find ${patch.description}. Check the pinned mind-ar version.`,
    );
  }
}

if (changed) writeFileSync(mindarBrowserBuild, source);

console.log(
  changed
    ? "Applied MindAR browser compatibility patch."
    : "MindAR browser compatibility patch already applied.",
);
