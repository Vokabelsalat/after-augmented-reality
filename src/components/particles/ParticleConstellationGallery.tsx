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
  /** Saved turn of the constellation for its target image. */
  orientation: Orientation;
};

type PreparedArtifact = ParticlePreviewArtifact & {
  constellation: Constellation;
};

type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; count: number }
  | { state: "error"; message: string };

const dragRadiansPerPixel = 0.01;
const maxPitch = Math.PI / 2;
const degrees = (radians = 0) => `${Math.round((radians * 180) / Math.PI)}°`;
const sameOrientation = (a: Orientation, b: Orientation) =>
  Math.abs(a.yaw - b.yaw) < 1e-4 &&
  Math.abs(a.pitch - b.pitch) < 1e-4 &&
  Math.abs((a.roll ?? 0) - (b.roll ?? 0)) < 1e-4;
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
  framing: ConstellationFraming,
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
    framing,
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
  const [surface, setSurface] = useState<PreviewSurface>("light");
  const canvasByArtifact = useRef(new Map<string, HTMLCanvasElement>());
  const orientationByArtifact = useRef(new Map<string, Orientation>());
  // Each target is framed to fill the image at its own orientation. While a
  // drag is running the framing stays fixed, so the shape does not jump.
  const framingByArtifact = useRef(new Map<string, ConstellationFraming>());
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    x: number;
    y: number;
    roll: boolean;
  } | null>(null);
  const [savedOrientations, setSavedOrientations] = useState(
    () => new Map(artifacts.map(({ id, orientation }) => [id, orientation])),
  );
  const [changedIds, setChangedIds] = useState<Set<string>>(() => new Set());
  const [shownOrientations, setShownOrientations] = useState(
    () => new Map(artifacts.map(({ id, orientation }) => [id, orientation])),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });
  const preparedArtifacts = useMemo<PreparedArtifact[]>(
    () =>
      artifacts.map((artifact) => ({
        ...artifact,
        constellation: prepareConstellation(
          createArtifactFormationPositions(artifact, constellationParticleCount),
          foregroundColor(artifact, surface),
          surface,
        ),
      })),
    [artifacts, surface],
  );

  const orientationFor = (id: string) =>
    orientationByArtifact.current.get(id) ?? savedOrientations.get(id) ?? initialOrientation;

  const framingFor = (artifact: PreparedArtifact) => {
    let framing = framingByArtifact.current.get(artifact.id);
    if (!framing) {
      framing = frameConstellation(artifact.constellation, orientationFor(artifact.id));
      framingByArtifact.current.set(artifact.id, framing);
    }
    return framing;
  };

  const redraw = (artifact: PreparedArtifact) => {
    const canvas = canvasByArtifact.current.get(artifact.id);
    if (canvas) drawFormation(canvas, artifact, orientationFor(artifact.id), framingFor(artifact));
  };

  const refit = (artifact: PreparedArtifact) => {
    framingByArtifact.current.delete(artifact.id);
    redraw(artifact);
  };

  const showOrientation = (id: string, orientation: Orientation) => {
    setShownOrientations((current) => new Map(current).set(id, orientation));
    setChangedIds((current) => {
      const next = new Set(current);
      const saved = savedOrientations.get(id) ?? initialOrientation;
      if (sameOrientation(orientation, saved)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    framingByArtifact.current.clear();
    const redrawAll = () => preparedArtifacts.forEach(redraw);
    const resizeObserver = new ResizeObserver(redrawAll);
    canvasByArtifact.current.forEach((canvas) => resizeObserver.observe(canvas));
    redrawAll();
    return () => resizeObserver.disconnect();
    // redraw only reads refs and saved orientations, which reset the canvases themselves.
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
      roll: event.shiftKey,
    };
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
    artifact: PreparedArtifact,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== artifact.id || drag.pointerId !== event.pointerId) return;
    const { yaw, pitch, roll = 0 } = orientationFor(artifact.id);
    const dx = (event.clientX - drag.x) * dragRadiansPerPixel;
    const dy = (event.clientY - drag.y) * dragRadiansPerPixel;
    orientationByArtifact.current.set(
      artifact.id,
      drag.roll
        ? { yaw, pitch, roll: roll - dx }
        : {
            yaw: yaw + dx,
            pitch: Math.min(maxPitch, Math.max(-maxPitch, pitch - dy)),
            roll,
          },
    );
    drag.x = event.clientX;
    drag.y = event.clientY;
    redraw(artifact);
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLCanvasElement>,
    artifact: PreparedArtifact,
  ) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    // Show the shape framed exactly as its target image will be.
    refit(artifact);
    showOrientation(artifact.id, orientationFor(artifact.id));
  };

  const revert = (artifact: PreparedArtifact) => {
    const saved = savedOrientations.get(artifact.id) ?? initialOrientation;
    orientationByArtifact.current.set(artifact.id, saved);
    refit(artifact);
    showOrientation(artifact.id, saved);
  };

  const saveLayout = async () => {
    setSaveStatus({ state: "saving" });
    const orientations = Object.fromEntries(
      artifacts.map(({ id }) => [id, orientationFor(id)]),
    );
    try {
      const response = await fetch("/api/development/constellation-orientations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orientations }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? `Saving failed (${response.status}).`);
      setSaveStatus({ state: "saved", count: changedIds.size });
      setSavedOrientations(new Map(Object.entries(orientations)));
      setChangedIds(new Set());
    } catch (error) {
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Saving failed.",
      });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 border-y border-white/25 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-6 text-white/72">
          <p>
            <b className="text-white">Target layout.</b> Drag to turn a constellation, Shift-drag to roll it. Each preview is framed like its target image.
          </p>
          <p aria-live="polite">
            {saveStatus.state === "saving" && "Saving the layout…"}
            {saveStatus.state === "saved" && (
              <>Saved. Run <code className="font-mono text-white">npm run targets:build</code> to regenerate the targets and exhibition.mind.</>
            )}
            {saveStatus.state === "error" && <span className="text-[#ff8a7a]">{saveStatus.message}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveLayout}
          disabled={changedIds.size === 0 || saveStatus.state === "saving"}
          className="min-h-12 border border-[var(--phosphor)] px-6 text-sm text-white transition-colors enabled:hover:bg-[var(--phosphor)] enabled:hover:text-[#031015] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/45"
        >
          {changedIds.size === 0
            ? "Layout saved"
            : `Save layout (${changedIds.size} changed)`}
        </button>
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
              className="absolute inset-0 size-full cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(event) => handlePointerDown(event, artifact)}
              onPointerMove={(event) => handlePointerMove(event, artifact)}
              onPointerUp={(event) => handlePointerEnd(event, artifact)}
              onPointerCancel={(event) => handlePointerEnd(event, artifact)}
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
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foam)]">
              <span className="font-mono tabular-nums">
                {(() => {
                  const { yaw, pitch, roll } = shownOrientations.get(artifact.id) ?? artifact.orientation;
                  return `yaw ${degrees(yaw)} · pitch ${degrees(pitch)} · roll ${degrees(roll)}`;
                })()}
              </span>
              {changedIds.has(artifact.id) && (
                <button
                  type="button"
                  onClick={() => revert(artifact)}
                  className="min-h-10 border border-white/40 px-4 transition-colors hover:border-white hover:bg-white/[0.06]"
                >
                  Revert
                </button>
              )}
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
