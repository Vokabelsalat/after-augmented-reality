"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { aquaticPalette, TraitMarks } from "@/components/creature/AquaticModelShared";
import type { AquaticModelProps } from "@/components/creature/AquaticCreatureModel";
import type { AquaticForm } from "@/lib/creature/aquaticForms";

type AdditionalForm = Exclude<AquaticForm, "fish" | "crab" | "jellyfish" | "octopus">;

function LivingGroup({
  children,
  animated,
  scale,
  motion = "glide",
  position = [0, 0, 0],
}: {
  children: ReactNode;
  animated?: boolean;
  scale: number;
  motion?: "glide" | "bob" | "coil" | "pulse";
  position?: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (animated === false || !ref.current) return;
    const time = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(time * (motion === "bob" ? 1.45 : 0.85)) * (motion === "bob" ? 0.09 : 0.045);
    ref.current.rotation.z = Math.sin(time * (motion === "coil" ? 1.35 : 0.62)) * (motion === "coil" ? 0.075 : 0.035);
    if (motion === "pulse") {
      const breath = 1 + Math.sin(time * 1.6) * 0.035;
      ref.current.scale.set(scale * breath, scale * breath, scale);
    }
  });

  return <group ref={ref} scale={scale} position={position}>{children}</group>;
}

function PairOfEyes({ x = 0.34, y = 0.25, z = 0.55 }: { x?: number; y?: number; z?: number }) {
  return [-1, 1].map((side) => (
    <group key={side} position={[side * x, y, z]}>
      <mesh scale={[0.12, 0.15, 0.08]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshToonMaterial color="#F3F0E8" />
      </mesh>
      <mesh position={[0, 0, 0.075]} scale={[0.045, 0.07, 0.03]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#071015" />
      </mesh>
    </group>
  ));
}

function TurtleModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  return (
    <LivingGroup animated={props.animated} scale={props.scale}>
      <mesh scale={[1.18, 0.78, 0.38]}>
        <sphereGeometry args={[0.9, 30, 22]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      <mesh position={[0, 0.03, 0.24]} scale={[0.92, 0.58, 0.18]}>
        <sphereGeometry args={[0.92, 24, 18]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      {[0.46, 0.8].map((ring, index) => (
        <mesh key={ring} position={[0, 0.03, 0.43]} scale={[ring * 1.18, ring * 0.78, 0.06]}>
          <torusGeometry args={[0.72, 0.035 + index * 0.01, 7, 24]} />
          <meshToonMaterial color={colors.light} />
        </mesh>
      ))}
      <mesh position={[1.12, 0.02, 0]} scale={[0.46, 0.38, 0.34]}>
        <sphereGeometry args={[0.75, 22, 16]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <group position={[1.25, 0.12, 0.29]} scale={0.7}>{PairOfEyes({ x: 0.16, y: 0, z: 0.16 })}</group>
      {[-1, 1].flatMap((side) => [-1, 1].map((front) => (
        <mesh key={`${side}-${front}`} position={[front * 0.62, side * 0.68, -0.02]} rotation={[0, 0, side * (front > 0 ? -0.58 : 0.58)]} scale={[0.48, 0.2, 0.09]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshToonMaterial color={colors.accent} />
        </mesh>
      )))}
      <mesh position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.2, 0.34, 0.12]}>
        <coneGeometry args={[1, 1, 12]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <TraitMarks pieces={props.pieces} form="turtle" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function RayModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  const tail = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.75, -0.05, 0),
    new THREE.Vector3(-1.45, -0.12, 0),
    new THREE.Vector3(-2.15, 0.05, 0),
    new THREE.Vector3(-2.75, -0.1, 0),
  ]), []);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="glide">
      <mesh scale={[1.72, 0.72, 0.16]}>
        <sphereGeometry args={[0.82, 30, 20]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, side * 0.54, 0]} rotation={[0, 0, side * 0.08]} scale={[1.1, 0.52, 0.08]}>
          <sphereGeometry args={[0.9, 24, 14]} />
          <meshToonMaterial color={side > 0 ? colors.light : colors.dark} />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[tail, 26, 0.035, 7, false]} />
        <meshToonMaterial color={colors.accent} />
      </mesh>
      {PairOfEyes({ x: 0.3, y: 0.18, z: 0.2 })}
      <TraitMarks pieces={props.pieces} form="ray" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function StarfishModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="bob">
      {Array.from({ length: 5 }, (_, index) => {
        const angle = index * Math.PI * 0.4;
        return (
          <mesh key={index} position={[Math.sin(angle) * 0.7, Math.cos(angle) * 0.7, 0]} rotation={[0, 0, -angle]} scale={[0.38, 0.92, 0.16]}>
            <capsuleGeometry args={[0.44, 0.92, 8, 14]} />
            <meshToonMaterial color={index % 2 ? colors.body : colors.accent} />
          </mesh>
        );
      })}
      <mesh scale={[0.7, 0.7, 0.24]}>
        <sphereGeometry args={[0.72, 22, 16]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <TraitMarks pieces={props.pieces} form="starfish" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function SeahorseModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  const body = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 1.2, 0),
    new THREE.Vector3(-0.18, 0.62, 0),
    new THREE.Vector3(0.05, 0.02, 0),
    new THREE.Vector3(-0.18, -0.62, 0),
    new THREE.Vector3(0.12, -1.1, 0),
  ]), []);
  const tail = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, -1.1, 0),
    new THREE.Vector3(0.58, -1.45, 0),
    new THREE.Vector3(0.72, -1.05, 0),
    new THREE.Vector3(0.48, -0.9, 0),
  ]), []);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="bob">
      <mesh><tubeGeometry args={[body, 34, 0.22, 10, false]} /><meshToonMaterial color={colors.body} /></mesh>
      <mesh><tubeGeometry args={[tail, 24, 0.11, 9, false]} /><meshToonMaterial color={colors.accent} /></mesh>
      <mesh position={[0.18, 1.27, 0]} scale={[0.46, 0.38, 0.3]}>
        <sphereGeometry args={[0.72, 20, 16]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <mesh position={[0.6, 1.25, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.09, 0.46, 0.09]}>
        <cylinderGeometry args={[1, 0.72, 1, 9]} />
        <meshToonMaterial color={colors.accent} />
      </mesh>
      <mesh position={[0.27, 1.36, 0.28]} scale={0.075}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshBasicMaterial color="#071015" />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => (
        <mesh key={index} position={[-0.26, 0.72 - index * 0.28, -0.02]} rotation={[0, 0, -0.5]} scale={[0.12, 0.28, 0.06]}>
          <coneGeometry args={[1, 1, 8]} />
          <meshToonMaterial color={colors.dark} />
        </mesh>
      ))}
      <TraitMarks pieces={props.pieces} form="seahorse" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function EelModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  const body = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.1, -0.35, 0),
    new THREE.Vector3(-1.2, 0.28, 0),
    new THREE.Vector3(-0.25, -0.22, 0),
    new THREE.Vector3(0.8, 0.25, 0),
    new THREE.Vector3(1.75, 0.05, 0),
  ]), []);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="coil">
      <mesh><tubeGeometry args={[body, 42, 0.24, 12, false]} /><meshToonMaterial color={colors.body} /></mesh>
      <mesh position={[1.88, 0.05, 0]} scale={[0.48, 0.35, 0.3]}>
        <sphereGeometry args={[0.72, 22, 16]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <mesh position={[2.08, 0.15, 0.27]} scale={0.065}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshBasicMaterial color="#071015" />
      </mesh>
      <mesh position={[-2.24, -0.38, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.24, 0.52, 0.08]}>
        <coneGeometry args={[1, 1, 10]} />
        <meshToonMaterial color={colors.accent} />
      </mesh>
      <TraitMarks pieces={props.pieces} form="eel" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function SealModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  return (
    <LivingGroup animated={props.animated} scale={props.scale}>
      <mesh scale={[1.38, 0.66, 0.46]}>
        <sphereGeometry args={[0.9, 28, 20]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <mesh position={[1.12, 0.2, 0]} scale={[0.62, 0.54, 0.5]}>
        <sphereGeometry args={[0.72, 24, 18]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <mesh position={[1.5, 0.03, 0.33]} scale={[0.24, 0.16, 0.12]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.25, side * 0.55, -0.02]} rotation={[0, 0, side * -0.46]} scale={[0.62, 0.2, 0.1]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshToonMaterial color={colors.accent} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`tail-${side}`} position={[-1.35, side * 0.2, 0]} rotation={[0, 0, side * 0.5]} scale={[0.5, 0.18, 0.1]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshToonMaterial color={colors.dark} />
        </mesh>
      ))}
      <group position={[1.12, 0, 0]}>
        {PairOfEyes({ x: 0.22, y: 0.36, z: 0.4 })}
      </group>
      <TraitMarks pieces={props.pieces} form="seal" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ClamModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="pulse">
      {[-1, 1].map((side) => (
        <group key={side} position={[0, side * 0.28, 0]} rotation={[side * -0.2, 0, 0]}>
          <mesh scale={[1.22, 0.58, 0.28]}>
            <sphereGeometry args={[0.88, 28, 18]} />
            <meshToonMaterial color={side > 0 ? colors.body : colors.dark} />
          </mesh>
          {[-0.72, -0.36, 0, 0.36, 0.72].map((x) => (
            <mesh key={x} position={[x, 0, 0.25]} scale={[0.035, 0.42, 0.035]}>
              <cylinderGeometry args={[1, 1, 1, 7]} />
              <meshToonMaterial color={colors.light} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0, 0.36]} scale={0.24}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color="#F4EAF3" emissive={colors.accent} emissiveIntensity={0.36} roughness={0.12} />
      </mesh>
      <TraitMarks pieces={props.pieces} form="clam" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function PufferfishModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="pulse">
      <mesh scale={[0.92, 0.86, 0.72]}>
        <sphereGeometry args={[1, 28, 22]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.93, Math.sin(angle) * 0.86, 0]} rotation={[0, 0, angle - Math.PI / 2]} scale={[0.09, 0.28 + (index % 3) * 0.05, 0.09]}>
            <coneGeometry args={[1, 1, 8]} />
            <meshToonMaterial color={index % 2 ? colors.light : colors.accent} />
          </mesh>
        );
      })}
      {PairOfEyes({ x: 0.32, y: 0.22, z: 0.72 })}
      <mesh position={[0, -0.13, 0.78]} rotation={[Math.PI / 2, 0, 0]} scale={[0.12, 0.12, 0.05]}>
        <torusGeometry args={[1, 0.22, 7, 16]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      <TraitMarks pieces={props.pieces} form="pufferfish" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

export function AdditionalAquaticModel({ form, ...props }: AquaticModelProps & { form: AdditionalForm }) {
  if (form === "turtle") return <TurtleModel {...props} />;
  if (form === "ray") return <RayModel {...props} />;
  if (form === "starfish") return <StarfishModel {...props} />;
  if (form === "seahorse") return <SeahorseModel {...props} />;
  if (form === "eel") return <EelModel {...props} />;
  if (form === "seal") return <SealModel {...props} />;
  if (form === "clam") return <ClamModel {...props} />;
  return <PufferfishModel {...props} />;
}
