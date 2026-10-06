// Renders every artifact's particle constellation to
// public/targets/<exhibitionId>-<id>.png, using the same projection as
// ParticleConstellationGallery's static frame.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import { createArtifactFormationPositions } from "../src/components/particles/particleGeometry.ts";
import { artifacts } from "../src/data/artifacts.ts";

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "../public/targets");
const previewParticleCount = 620;
const width = 400;
const height = 300;
const pixelRatio = 4;
const background = "#031015";

function colorChannels(color) {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function renderFormation(artifact) {
  const canvas = createCanvas(width * pixelRatio, height * pixelRatio);
  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "lighter";

  const rotation = 0.5;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const tiltCosine = Math.cos(-0.16);
  const tiltSine = Math.sin(-0.16);
  const baseScale = Math.min(width, height) * 0.34;
  const [red, green, blue] = colorChannels(artifact.color);
  const positions = createArtifactFormationPositions(artifact, previewParticleCount);

  for (let offset = 0; offset < positions.length; offset += 3) {
    const x = positions[offset];
    const y = positions[offset + 1] - 0.32;
    const z = positions[offset + 2] - 0.35;
    const rotatedX = x * cosine + z * sine;
    const rotatedZ = -x * sine + z * cosine;
    const rotatedY = y * tiltCosine - rotatedZ * tiltSine;
    const depth = y * tiltSine + rotatedZ * tiltCosine;
    const perspective = 2.8 / (2.8 + depth);
    const screenX = width / 2 + rotatedX * baseScale * perspective;
    const screenY = height / 2 - rotatedY * baseScale * perspective;
    const radius = Math.max(0.75, 1.25 * perspective);
    const alpha = Math.min(0.92, Math.max(0.28, 0.58 + depth * 0.2));

    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    context.beginPath();
    context.arc(screenX, screenY, radius, 0, Math.PI * 2);
    context.fill();
  }

  return canvas.toBuffer("image/png");
}

mkdirSync(outputDirectory, { recursive: true });
for (const artifact of artifacts) {
  const file = join(outputDirectory, `${artifact.exhibitionId}-${artifact.id}.png`);
  writeFileSync(file, renderFormation(artifact));
  console.log(`${artifact.particleForm.padEnd(13)} ${file}`);
}
