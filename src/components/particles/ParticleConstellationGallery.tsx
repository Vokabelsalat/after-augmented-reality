"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  constellationParticleCount,
  frameConstellation,
  initialOrientation,
  paintConstellation,
  prepareConstellation,
  type Constellation,
  type ConstellationFraming,
  type Orientation,
} from "@/components/particles/constellationPainter";
import { createArtifactFormationPositions } from "@/components/particles/particleGeometry";
import type { ParticleFormId } from "@/types/exhibition";

export type ParticlePreviewArtifact = {
  id: string;
  exhibitionId: number;
  title: string;
  color: string;
  alternativeColor: string;
  particleForm: ParticleFormId;
};

type PreparedArtifact = ParticlePreviewArtifact & {
  constellation: Constellation;
  // Framed once at the initial angle so dragging does not rescale the shape.
  framing: ConstellationFraming;
};

const dragRadiansPerPixel = 0.01;
const maxPitch = Math.PI / 2;
const exportWidth = 400;
const exportHeight = 300;
const exportPixelRatio = 4;
type PreviewSurface = "dark" | "light";

const previewBackgrounds: Record<PreviewSurface, string> = {
  dark: "#031015",
  light: "#FFFFFF",
};

function foregroundColor(artifact: ParticlePreviewArtifact, surface: PreviewSurface) {
  return surface === "light" ? artifact.alternativeColor : artifact.color;
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
  paintConstellation(
    context,
    width,
    height,
    artifact.constellation,
    orientation,
    artifact.framing,
  );
}

function exportFormation(
  artifact: PreparedArtifact,
  orientation: Orientation,
  surface: PreviewSurface,
) {
  const canvas = document.createElement("canvas");
  canvas.width = exportWidth * exportPixelRatio;
  canvas.height = exportHeight * exportPixelRatio;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(exportPixelRatio, 0, 0, exportPixelRatio, 0, 0);
  context.fillStyle = previewBackgrounds[surface];
  context.fillRect(0, 0, exportWidth, exportHeight);
  paintConstellation(
    context,
    exportWidth,
    exportHeight,
    artifact.constellation,
    orientation,
    frameConstellation(artifact.constellation, orientation),
  );

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artifact.exhibitionId}-${artifact.id}${surface === "light" ? "-white" : ""}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, "image/png");
}

export function ParticleConstellationGallery({
  artifacts,
}: {
  artifacts: ParticlePreviewArtifact[];
}) {
  const [surface, setSurface] = useState<PreviewSurface>("dark");
  const canvasByArtifact = useRef(new Map<string, HTMLCanvasElement>());
  const orientationByArtifact = useRef(new Map<string, Orientation>());
  const dragRef = useRef<{ id: string; pointerId: number; x: number; y: number } | null>(
    null,
  );
  const preparedArtifacts = useMemo<PreparedArtifact[]>(
    () =>
      artifacts.map((artifact) => {
        const constellation = prepareConstellation(
          createArtifactFormationPositions(artifact, constellationParticleCount),
          foregroundColor(artifact, surface),
          surface,
        );
        return {
          ...artifact,
          constellation,
          framing: frameConstellation(constellation, initialOrientation),
        };
      }),
    [artifacts, surface],
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
    <div>
      <div className="mb-6 flex flex-col gap-4 border-y border-white/25 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-white/72">
          <b className="text-white">Target preview.</b> Background and foreground colors change together.
        </p>
        <div className="grid grid-cols-2" role="group" aria-label="Target background">
          {(["dark", "light"] as const).map((option) => {
            const active = surface === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSurface(option)}
                aria-pressed={active}
                className={`min-h-12 border px-6 text-sm transition-colors ${
                  active
                    ? "border-[var(--phosphor)] bg-[var(--phosphor)] text-[#031015]"
                    : "border-white/40 bg-[var(--abyss)] text-white hover:border-white"
                }`}
              >
                {option === "dark" ? "Black background" : "White background"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-white/25 sm:grid-cols-2 lg:grid-cols-4">
      {preparedArtifacts.map((artifact) => (
        <article
          key={artifact.id}
          className="border-b border-white/25 sm:border-r lg:[&:nth-child(4n)]:border-r-0"
        >
          <div
            className="relative aspect-[4/3] overflow-hidden border-b border-white/15 transition-colors"
            style={{ backgroundColor: previewBackgrounds[surface] }}
          >
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
              aria-label={`${artifact.exhibitionId} ${artifact.title}: ${artifact.particleForm} particle formation in ${foregroundColor(artifact, surface)} on a ${surface === "light" ? "white" : "black"} background`}
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
                style={{ backgroundColor: foregroundColor(artifact, surface) }}
                aria-hidden="true"
              />
              <span>{artifact.particleForm}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{foregroundColor(artifact, surface)}</span>
              <button
                type="button"
                onClick={() => exportFormation(artifact, orientationFor(artifact.id), surface)}
                className="ml-auto min-h-10 border border-white/40 px-4 transition-colors hover:border-white hover:bg-white/[0.06]"
              >
                Export {surface === "light" ? "white" : "dark"} PNG
              </button>
            </div>
          </div>
        </article>
      ))}
      </div>
    </div>
  );
}
