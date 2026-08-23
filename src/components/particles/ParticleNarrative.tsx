"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { revealTiming, type RevealPhase } from "@/lib/animation/revealMachine";
import type { ExhibitionArtifact } from "@/types/exhibition";
import { createNarrativeGeometry } from "@/components/particles/particleGeometry";
import {
  narrativeFragmentShader,
  narrativeVertexShader,
} from "@/components/particles/particleShaders";

export type ParticleMode =
  | "poster"
  | "release"
  | "cluster"
  | "constellation"
  | "ar-release";

type ParticleNarrativeProps = {
  artifact: ExhibitionArtifact;
  phase: RevealPhase;
  mode?: ParticleMode;
  quality?: "low" | "medium" | "high";
};

const phaseIndex: Record<RevealPhase, number> = {
  idle: 0,
  attached: 0,
  release: 1,
  formation: 2,
  "content-reveal": 3,
  complete: 3,
};

const phaseDuration: Record<RevealPhase, number> = {
  idle: 1,
  attached: revealTiming.attached,
  release: revealTiming.release,
  formation: revealTiming.formation,
  "content-reveal": revealTiming.uiReveal,
  complete: revealTiming.uiReveal,
};

function ParticleField({
  artifact,
  phase,
  count,
}: {
  artifact: ExhibitionArtifact;
  phase: RevealPhase;
  count: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const phaseStartedAt = useRef(0);
  const geometry = useMemo(
    () => createNarrativeGeometry(artifact, count),
    [artifact, count],
  );
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: narrativeVertexShader,
        fragmentShader: narrativeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uPhase: { value: 0 },
          uPointSize: { value: 6.0 },
          uMotion: { value: reducedMotion ? 0 : 1 },
          uColor: { value: new THREE.Color(artifact.color) },
        },
      }),
    [artifact.color, reducedMotion],
  );

  useEffect(() => {
    phaseStartedAt.current = performance.now();
    const shader = materialRef.current;
    if (shader) {
      shader.uniforms.uPhase.value = phaseIndex[phase];
      shader.uniforms.uProgress.value = phase === "complete" ? 1 : 0;
    }
  }, [phase]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    const shader = materialRef.current;
    if (!shader) return;
    shader.uniforms.uTime.value = clock.elapsedTime;
    if (phase === "complete") {
      shader.uniforms.uProgress.value = 1;
      return;
    }
    const elapsed = performance.now() - phaseStartedAt.current;
    const duration = reducedMotion ? 80 : phaseDuration[phase];
    shader.uniforms.uProgress.value = Math.min(elapsed / duration, 1);
  });

  return (
    <points geometry={geometry}>
      <primitive ref={materialRef} object={material} attach="material" />
    </points>
  );
}

export function ParticleNarrative({
  artifact,
  phase,
  mode = "ar-release",
  quality = "medium",
}: ParticleNarrativeProps) {
  const count = quality === "high" ? 4200 : quality === "low" ? 1900 : 3000;
  const effectivePhase =
    mode === "poster"
      ? "attached"
      : mode === "release"
        ? "release"
        : mode === "cluster" || mode === "constellation"
          ? "formation"
          : phase;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 52, near: 0.1, far: 100 }}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      >
        <AdaptiveDpr pixelated />
        <ParticleField
          key={artifact.id}
          artifact={artifact}
          phase={effectivePhase}
          count={count}
        />
      </Canvas>
    </div>
  );
}
