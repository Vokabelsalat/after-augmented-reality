"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { withDetailRecipe } from "@/lib/creature/geometryDetail";

type Vector3Tuple = [number, number, number];

export type ClawPose = {
  /** Raise of the upper arm from the shoulder, in radians. */
  shoulder?: number;
  /** Bend at the elbow, in radians. */
  elbow?: number;
  /** Tilt of the pincer at the wrist, in radians. */
  wrist?: number;
  /** Swing of the whole arm toward the viewer (negative) or away from it. */
  yaw?: number;
};

export type ClawProps = {
  /** 1 builds a right claw reaching along +x, -1 mirrors it into a left claw. */
  side?: 1 | -1;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number;
  /** Arm segments. */
  color: string;
  /** Palm and fingers. Defaults to `color`. */
  shellColor?: string;
  /** Knuckles and the bumps on the palm. Defaults to `color`. */
  jointColor?: string;
  /** The fingertips fade into this colour. Defaults to `jointColor`. */
  tipColor?: string;
  /** Length of the arm relative to the pincer. */
  reach?: number;
  /** Size of the palm and fingers relative to the arm. */
  pincerSize?: number;
  pose?: ClawPose;
  animated?: boolean;
  /** Offset in pinch cycles, so claws on one creature do not snap in unison. */
  phase?: number;
  /** Pinch cycles per second. */
  pinchSpeed?: number;
  /** How far the movable finger opens, in radians. */
  maxOpen?: number;
  /** Strength of the idle arm sway, 0 keeps the arm still while it pinches. */
  sway?: number;
  /** When set, the claw uses a lit, glowing material like creature traits instead of toon shading. */
  glow?: number;
};

const defaultPose: Required<ClawPose> = { shoulder: 0.5, elbow: 0.75, wrist: -0.55, yaw: 0 };

function easeInOutSine(value: number) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

/**
 * One pinch: the finger parts slowly, hesitates, snaps shut and rebounds.
 * `open` runs from 0 (closed) to 1 (fully open); `recoil` is the jolt the snap sends up the arm.
 */
export function pinchCycle(cycle: number) {
  const progress = cycle - Math.floor(cycle);
  if (progress < 0.45) return { open: easeInOutSine(progress / 0.45), recoil: 0 };
  if (progress < 0.62) {
    const hold = (progress - 0.45) / 0.17;
    return { open: 1 - Math.sin(hold * Math.PI * 3) * 0.04, recoil: 0 };
  }
  if (progress < 0.68) {
    const snap = (progress - 0.62) / 0.06;
    return { open: 1 - snap * snap * snap, recoil: 0 };
  }
  const after = (progress - 0.68) / 0.32;
  const damping = Math.exp(-after * 6);
  return {
    open: Math.max(0, Math.sin(after * Math.PI * 3) * damping * 0.18),
    recoil: Math.sin(after * Math.PI * 2) * damping,
  };
}

function ClawSurface({ color, glow, vertexColors = false }: { color: string; glow?: number; vertexColors?: boolean }) {
  if (glow === undefined) return <meshToonMaterial color={vertexColors ? "#FFFFFF" : color} vertexColors={vertexColors} />;
  return (
    <meshStandardMaterial
      color={vertexColors ? "#FFFFFF" : color}
      vertexColors={vertexColors}
      emissive={color}
      emissiveIntensity={glow}
      roughness={0.38}
    />
  );
}

// The finger lies along +x and hooks toward +y at its tip, where the opposite finger sits.
function fingerShape(length: number, width: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -width / 2);
  shape.quadraticCurveTo(length * 0.62, -width * 0.72, length, width * 0.38);
  shape.quadraticCurveTo(length * 0.52, width * 0.12, 0, width / 2);
  shape.closePath();
  return shape;
}

/** A point on the finger's gripping edge; 0 is the tip, 1 the base. */
function innerEdgePoint(length: number, width: number, along: number) {
  const tip = new THREE.Vector2(length, width * 0.38);
  const control = new THREE.Vector2(length * 0.52, width * 0.12);
  const base = new THREE.Vector2(0, width / 2);
  const rest = 1 - along;
  return tip
    .multiplyScalar(rest * rest)
    .add(control.multiplyScalar(2 * rest * along))
    .add(base.multiplyScalar(along * along));
}

/** `detail` scales the curve and bevel segments, for claws shown small. */
function fingerGeometry(length: number, width: number, shellColor: string, tipColor: string, detail = 1) {
  const depth = width * 0.7;
  const extruded = new THREE.ExtrudeGeometry(fingerShape(length, width), {
    depth,
    steps: 1,
    curveSegments: Math.max(3, Math.round(14 * detail)),
    bevelEnabled: true,
    bevelThickness: depth * 0.35,
    bevelSize: width * 0.16,
    bevelSegments: Math.max(1, Math.round(3 * detail)),
  });
  extruded.translate(0, 0, -depth / 2);
  // Fade the last part of the finger into the tip colour.
  const shell = new THREE.Color(shellColor);
  const tip = new THREE.Color(tipColor);
  const mixed = new THREE.Color();
  const positions = extruded.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  for (let index = 0; index < positions.count; index += 1) {
    const fade = THREE.MathUtils.smoothstep(positions.getX(index), length * 0.6, length * 0.88);
    mixed.copy(shell).lerp(tip, fade).toArray(colors, index * 3);
  }
  extruded.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return extruded;
}

function ClawFinger({
  length,
  width,
  shellColor,
  tipColor,
  glow,
}: {
  length: number;
  width: number;
  shellColor: string;
  tipColor: string;
  glow?: number;
}) {
  const geometry = useMemo(
    () => withDetailRecipe(14, (detail) => fingerGeometry(length, width, shellColor, tipColor, detail)),
    [length, width, shellColor, tipColor],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry}>
        <ClawSurface color={shellColor} glow={glow} vertexColors />
      </mesh>
      {[0.3, 0.5, 0.7].map((along) => {
        const point = innerEdgePoint(length, width, along);
        return (
          <mesh key={along} position={[point.x, point.y + width * 0.2, 0]} scale={[width * 0.15, width * 0.34, width * 0.15]}>
            <coneGeometry args={[1, 1, 6]} />
            <ClawSurface color={shellColor} glow={glow} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * An articulated crustacean claw: upper arm, forearm and a pincer whose movable finger
 * opens and snaps shut. Its origin is the shoulder joint, so it can be mounted on any body.
 */
export function Claw({
  side = 1,
  position,
  rotation,
  scale = 1,
  color,
  shellColor = color,
  jointColor = color,
  tipColor = jointColor,
  reach = 1,
  pincerSize = 1,
  pose,
  animated = true,
  phase = 0,
  pinchSpeed = 0.45,
  maxOpen = 0.75,
  sway = 1,
  glow,
}: ClawProps) {
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const movableFingerRef = useRef<THREE.Group>(null);
  const fixedFingerRef = useRef<THREE.Group>(null);
  const resting = { ...defaultPose, ...pose };
  const closedAngle = -0.1;

  const upperArm = 0.38 * reach;
  const forearm = 0.28 * reach;
  const armRadius = 0.075;

  useFrame(({ clock }) => {
    if (!animated) return;
    const time = clock.elapsedTime;
    const swing = phase * Math.PI * 2;
    const { open, recoil } = pinchCycle(time * pinchSpeed + phase);
    if (shoulderRef.current) shoulderRef.current.rotation.z = resting.shoulder + Math.sin(time * 1.7 + swing) * 0.14 * sway;
    if (elbowRef.current) elbowRef.current.rotation.z = resting.elbow + Math.sin(time * 1.25 + swing + 1.1) * 0.1 * sway - open * 0.08;
    if (wristRef.current) wristRef.current.rotation.z = resting.wrist + Math.sin(time * 2.1 + swing) * 0.06 * sway + open * 0.1 + recoil * 0.12;
    if (movableFingerRef.current) movableFingerRef.current.rotation.z = closedAngle + open * maxOpen;
    if (fixedFingerRef.current) fixedFingerRef.current.rotation.z = -open * maxOpen * 0.12;
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group scale={[side, 1, 1]}>
        <group ref={shoulderRef} rotation={[0, resting.yaw, resting.shoulder]}>
          <mesh scale={armRadius * 1.25}>
            <sphereGeometry args={[1, 12, 10]} />
            <ClawSurface color={jointColor} glow={glow} />
          </mesh>
          <mesh position={[upperArm / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.82]}>
            <cylinderGeometry args={[armRadius * 0.82, armRadius, upperArm, 10]} />
            <ClawSurface color={color} glow={glow} />
          </mesh>

          <group ref={elbowRef} position={[upperArm, 0, 0]} rotation={[0, 0, resting.elbow]}>
            <mesh scale={armRadius * 1.1}>
              <sphereGeometry args={[1, 12, 10]} />
              <ClawSurface color={jointColor} glow={glow} />
            </mesh>
            <mesh position={[forearm / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[armRadius * 0.9, armRadius * 0.78, forearm, 10]} />
              <ClawSurface color={color} glow={glow} />
            </mesh>

            <group ref={wristRef} position={[forearm, 0, 0]} rotation={[0, 0, resting.wrist]}>
              <group scale={pincerSize}>
                <mesh scale={armRadius * 1.05}>
                  <sphereGeometry args={[1, 12, 10]} />
                  <ClawSurface color={jointColor} glow={glow} />
                </mesh>
                <mesh position={[0.22, 0.01, 0]} scale={[0.27, 0.19, 0.15]}>
                  <sphereGeometry args={[1, 20, 14]} />
                  <ClawSurface color={shellColor} glow={glow} />
                </mesh>
                {[0.12, 0.22, 0.32].map((x, index) => (
                  <mesh key={x} position={[x, 0.17 - Math.abs(index - 1) * 0.03, 0.05]} scale={0.022}>
                    <sphereGeometry args={[1, 8, 6]} />
                    <ClawSurface color={jointColor} glow={glow} />
                  </mesh>
                ))}
                <group ref={fixedFingerRef} position={[0.4, -0.06, 0]}>
                  <ClawFinger length={0.3} width={0.11} shellColor={shellColor} tipColor={tipColor} glow={glow} />
                </group>
                <group ref={movableFingerRef} position={[0.36, 0.08, 0]} rotation={[0, 0, closedAngle + (animated ? 0 : maxOpen * 0.25)]}>
                  <group scale={[1, -1, 1]}>
                    <ClawFinger length={0.33} width={0.1} shellColor={shellColor} tipColor={tipColor} glow={glow} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** A mirrored left and right claw. `offset` places the right shoulder; the left one mirrors it. */
export function ClawPair({
  offset,
  phase = 0,
  ...claw
}: Omit<ClawProps, "side" | "position"> & { offset: Vector3Tuple }) {
  return (
    <>
      {([-1, 1] as const).map((side) => (
        <Claw
          key={side}
          side={side}
          position={[side * offset[0], offset[1], offset[2]]}
          phase={phase + (side > 0 ? 0.37 : 0)}
          {...claw}
        />
      ))}
    </>
  );
}
