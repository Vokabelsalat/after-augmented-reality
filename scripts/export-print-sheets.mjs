// Lays out the exported constellation targets as A4 print sheets for tracking
// tests: the -white targets in exhibitionId order, six targets per page.
import { writeFileSync } from "node:fs";
import { createCanvas, loadImage } from "canvas";
import { artifacts } from "../src/data/artifacts.ts";

// A4 portrait in PDF points.
const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 36;
const columns = 2;
const rows = 3;
const gutter = 24;
const labelHeight = 18;
const imageWidth = (pageWidth - margin * 2 - gutter * (columns - 1)) / columns;
const imageHeight = imageWidth * 0.75;

const ordered = [...artifacts].sort((a, b) => a.targetIndex - b.targetIndex);
const sheets = [
  { suffix: "-white", indexOffset: 0, output: "public/targets/print-white.pdf" },
];

for (const sheet of sheets) {
  const canvas = createCanvas(pageWidth, pageHeight, "pdf");
  const context = canvas.getContext("2d");
  const perPage = columns * rows;

  for (const [index, artifact] of ordered.entries()) {
    if (index > 0 && index % perPage === 0) context.addPage();
    const slot = index % perPage;
    const x = margin + (slot % columns) * (imageWidth + gutter);
    const y = margin + Math.floor(slot / columns) * (imageHeight + labelHeight + gutter);
    const image = await loadImage(
      `public/targets/${artifact.exhibitionId}-${artifact.id}${sheet.suffix}.png`,
    );
    context.drawImage(image, x, y, imageWidth, imageHeight);
    context.strokeStyle = "#999999";
    context.lineWidth = 0.5;
    context.strokeRect(x, y, imageWidth, imageHeight);
    context.fillStyle = "#333333";
    context.font = "9px sans-serif";
    context.fillText(
      `${artifact.exhibitionId}  ${artifact.title}  (target ${artifact.targetIndex + sheet.indexOffset})`,
      x,
      y + imageHeight + 12,
    );
  }

  writeFileSync(sheet.output, canvas.toBuffer());
  console.log(`wrote ${sheet.output}`);
}
