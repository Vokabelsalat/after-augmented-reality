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
  // MindAR adds a window resize listener in its constructor and never removes it, so every
  // stopped or failed camera attempt kept resizing a dead instance and threw once the camera
  // had never started. The listener now lives from start() to stop(), and resize() waits for
  // the tracker.
  {
    old: 'window.addEventListener("resize", this.resize.bind(this));',
    replacement: "this._onResize = this.resize.bind(this);",
    description: "resize listener kept for removal",
  },
  {
    // The indentation keeps this from matching again inside its own replacement.
    old: "    this.ui.showLoading(), await this._startVideo(), await this._startAR();",
    replacement:
      '    window.removeEventListener("resize", this._onResize), window.addEventListener("resize", this._onResize), this.ui.showLoading(), await this._startVideo(), await this._startAR();',
    description: "resize listener added when the camera starts",
  },
  {
    old: "    this.controller.stopProcessVideo(), this.video.srcObject.getTracks().forEach(function(t) {",
    replacement:
      '    window.removeEventListener("resize", this._onResize), this.controller.stopProcessVideo(), this.video.srcObject.getTracks().forEach(function(t) {',
    description: "resize listener removed when the camera stops",
  },
  {
    old: "    if (!n)\n      return;",
    replacement: "    if (!n || !this.controller)\n      return;",
    description: "resize skipped until the tracker exists",
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
