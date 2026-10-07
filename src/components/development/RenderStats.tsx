"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const updateEverySeconds = 0.5;
const numberFormat = new Intl.NumberFormat("en-GB");

export type RenderStatsReport = { fps: number; meshes: number; drawCalls: number };

export function formatRenderStats({ fps, meshes, drawCalls }: RenderStatsReport) {
  return `${fps} fps · ${numberFormat.format(meshes)} meshes · ${numberFormat.format(drawCalls)} draws`;
}

/**
 * Measures the canvas it is placed in and reports frames per second, visible meshes and
 * draw calls twice a second.
 */
export function RenderStats({ onReport }: { onReport: (report: RenderStatsReport) => void }) {
  const frames = useRef(0);
  const windowStart = useRef<number | null>(null);

  useFrame(({ camera, clock, gl, scene }) => {
    const now = clock.elapsedTime;
    windowStart.current ??= now;
    frames.current += 1;
    const elapsed = now - windowStart.current;
    if (elapsed < updateEverySeconds) return;

    let meshes = 0;
    // Counts what the camera draws, so meshes moved off its layers (like merged originals) are left out.
    scene.traverseVisible((object) => {
      if ((object as { isMesh?: boolean }).isMesh && object.layers.test(camera.layers)) meshes += 1;
    });
    onReport({
      fps: Math.round(frames.current / elapsed),
      meshes,
      // `info` still holds the previous frame here, since it resets when a render starts.
      drawCalls: gl.info.render.calls,
    });
    frames.current = 0;
    windowStart.current = now;
  });

  return null;
}
