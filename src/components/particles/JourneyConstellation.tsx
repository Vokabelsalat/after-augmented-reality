"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { artifactById } from "@/data/artifacts";
import type { Discovery } from "@/store/journeySlice";
import { createConstellationGeometry } from "@/components/particles/particleGeometry";
import {
  constellationFragmentShader,
  constellationVertexShader,
} from "@/components/particles/particleShaders";

type JourneyConstellationProps = {
  discoveries: Discovery[];
  variant?: "miniature" | "full";
};

function ConstellationScene({
  discoveries,
  variant,
}: Required<JourneyConstellationProps>) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const artifacts = useMemo(
    () =>
      discoveries
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .flatMap((discovery) => {
          const artifact = artifactById.get(discovery.artifactId);
          return artifact ? [artifact] : [];
        }),
    [discoveries],
  );
  const geometry = useMemo(
    () =>
      createConstellationGeometry(
        artifacts,
        variant === "miniature" ? 120 : 430,
      ),
    [artifacts, variant],
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
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        vertexShader: constellationVertexShader,
        fragmentShader: constellationFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPointSize: { value: variant === "miniature" ? 2.5 : 2.15 },
          uMotion: { value: reducedMotion ? 0 : 1 },
        },
      }),
    [reducedMotion, variant],
  );
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#D8D5CC",
        transparent: true,
        opacity: variant === "miniature" ? 0.2 : 0.28,
        blending: THREE.AdditiveBlending,
      }),
    [variant],
  );

  useEffect(
    () => () => {
      geometry.particleGeometry.dispose();
      geometry.lineGeometry.dispose();
      material.dispose();
      lineMaterial.dispose();
    },
    [geometry, lineMaterial, material],
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.12) * 0.025;
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.08;
    }
  });

  if (artifacts.length === 0) return null;

  return (
    <group ref={groupRef} scale={variant === "miniature" ? 0.86 : 1}>
      <points geometry={geometry.particleGeometry}>
        <primitive ref={materialRef} object={material} attach="material" />
      </points>
      <lineSegments
        geometry={geometry.lineGeometry}
        material={lineMaterial}
      />
    </group>
  );
}

export function JourneyConstellation({
  discoveries,
  variant = "full",
}: JourneyConstellationProps) {
  const label =
    discoveries.length === 0
      ? "Your journey is empty"
      : `Particle constellation representing ${discoveries.length} discovered ${discoveries.length === 1 ? "fragment" : "fragments"} in visit order`;

  return (
    <div className="relative size-full" role="img" aria-label={label}>
      {discoveries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-xs leading-5 tracking-[0.16em] text-white/35 uppercase">
          Your first fragment<br />will appear here
        </div>
      )}
      <Canvas
        frameloop={variant === "miniature" ? "demand" : "always"}
        camera={{
          position: [0, 0, variant === "miniature" ? 6.5 : 6.8],
          fov: variant === "miniature" ? 58 : 50,
          near: 0.1,
          far: 50,
        }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      >
        <AdaptiveDpr pixelated />
        <ConstellationScene discoveries={discoveries} variant={variant} />
      </Canvas>
    </div>
  );
}
