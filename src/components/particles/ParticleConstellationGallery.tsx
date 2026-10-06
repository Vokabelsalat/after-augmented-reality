"use client";

import { useEffect, useMemo, useRef } from "react";
import { createArtifactFormationPositions } from "@/components/particles/particleGeometry";
import type { ParticleFormId } from "@/types/exhibition";

export type ParticlePreviewArtifact = {
  id: string;
  exhibitionId: number;
  title: string;
  color: string;
  particleForm: ParticleFormId;
};

type PreparedArtifact = ParticlePreviewArtifact & {
  positions: Float32Array;
  rgb: [number, number, number];
};

type Orientation = { yaw: number; pitch: number };

const previewParticleCount = 620;
const initialOrientation: Orientation = { yaw: 0.5, pitch: -0.16 };
const dragRadiansPerPixel = 0.01;
const maxPitch = Math.PI / 2;
const exportWidth = 400;
const exportHeight = 300;
const exportPixelRatio = 4;
const exportBackground = "#031015";

function colorChannels(color: string): [number, number, number] {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawFormation(
  canvas: HTMLCanvasElement,
  artifact: PreparedArtifact,
  orientation: Orientation,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  const targetWidth = Math.round(width * pixelRatio);
  const targetHeight = Math.round(height * pixelRatio);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  paintFormation(context, width, height, artifact, orientation);
}

function paintFormation(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  artifact: PreparedArtifact,
  orientation: Orientation,
) {
  context.globalCompositeOperation = "lighter";

  const cosine = Math.cos(orientation.yaw);
  const sine = Math.sin(orientation.yaw);
  const tiltCosine = Math.cos(orientation.pitch);
  const tiltSine = Math.sin(orientation.pitch);
  const baseScale = Math.min(width, height) * 0.34;
  const [red, green, blue] = artifact.rgb;
  const positions = artifact.positions;

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

  context.globalCompositeOperation = "source-over";
}

function exportFormation(artifact: PreparedArtifact, orientation: Orientation) {
  const canvas = document.createElement("canvas");
  canvas.width = exportWidth * exportPixelRatio;
  canvas.height = exportHeight * exportPixelRatio;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(exportPixelRatio, 0, 0, exportPixelRatio, 0, 0);
  context.fillStyle = exportBackground;
  context.fillRect(0, 0, exportWidth, exportHeight);
  paintFormation(context, exportWidth, exportHeight, artifact, orientation);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artifact.exhibitionId}-${artifact.id}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
}

export function ParticleConstellationGallery({
  artifacts,
}: {
  artifacts: ParticlePreviewArtifact[];
}) {
  const canvasByArtifact = useRef(new Map<string, HTMLCanvasElement>());
  const orientationByArtifact = useRef(new Map<string, Orientation>());
  const dragRef = useRef<{ id: string; pointerId: number; x: number; y: number } | null>(
    null,
  );
  const preparedArtifacts = useMemo<PreparedArtifact[]>(
    () =>
      artifacts.map((artifact) => ({
        ...artifact,
        positions: createArtifactFormationPositions(artifact, previewParticleCount),
        rgb: colorChannels(artifact.color),
      })),
    [artifacts],
  );

  const orientationFor = (id: string) =>
    orientationByArtifact.current.get(id) ?? initialOrientation;

  const redraw = (artifact: PreparedArtifact) => {
    const canvas = canvasByArtifact.current.get(artifact.id);
    if (canvas) drawFormation(canvas, artifact, orientationFor(artifact.id));
  };

  useEffect(() => {
    const redrawAll = () => preparedArtifacts.forEach(redraw);
    const resizeObserver = new ResizeObserver(redrawAll);
    canvasByArtifact.current.forEach((canvas) => resizeObserver.observe(canvas));
    redrawAll();
    return () => resizeObserver.disconnect();
    // redraw only reads refs, so it is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparedArtifacts]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
    artifact: PreparedArtifact,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: artifact.id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
    artifact: PreparedArtifact,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== artifact.id || drag.pointerId !== event.pointerId) return;
    const { yaw, pitch } = orientationFor(artifact.id);
    orientationByArtifact.current.set(artifact.id, {
      yaw: yaw + (event.clientX - drag.x) * dragRadiansPerPixel,
      pitch: Math.min(
        maxPitch,
        Math.max(-maxPitch, pitch - (event.clientY - drag.y) * dragRadiansPerPixel),
      ),
    });
    drag.x = event.clientX;
    drag.y = event.clientY;
    redraw(artifact);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return (
    <div className="grid grid-cols-1 border-t border-white/25 sm:grid-cols-2 lg:grid-cols-4">
      {preparedArtifacts.map((artifact) => (
        <article
          key={artifact.id}
          className="border-b border-white/25 sm:border-r lg:[&:nth-child(4n)]:border-r-0"
        >
          <div className="relative aspect-[4/3] overflow-hidden border-b border-white/15">
            <canvas
              ref={(node) => {
                if (node) canvasByArtifact.current.set(artifact.id, node);
                else canvasByArtifact.current.delete(artifact.id);
              }}
              className="absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing"
              onPointerDown={(event) => handlePointerDown(event, artifact)}
              onPointerMove={(event) => handlePointerMove(event, artifact)}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              role="img"
              aria-label={`${artifact.exhibitionId} ${artifact.title}: ${artifact.particleForm} particle formation in ${artifact.color}`}
            />
          </div>
          <div className="flex min-h-28 flex-col justify-between gap-4 p-4 sm:p-5">
            <h2 className="flex gap-3 font-display text-xl leading-tight text-[var(--foam)]">
              <span className="tabular-nums">{artifact.exhibitionId}</span>
              <span>{artifact.title}</span>
            </h2>
            <div className="flex items-center gap-3 text-sm text-[var(--foam)]">
              <span
                className="size-3 shrink-0 rounded-full border border-white/40"
                style={{ backgroundColor: artifact.color }}
                aria-hidden="true"
              />
              <span>{artifact.particleForm}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{artifact.color}</span>
              <button
                type="button"
                onClick={() => exportFormation(artifact, orientationFor(artifact.id))}
                className="ml-auto border-b border-white/50 pb-0.5 transition-colors hover:border-white"
              >
                Export PNG
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
