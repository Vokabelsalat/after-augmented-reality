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
  grounded = false,
}: {
  children: ReactNode;
  animated?: boolean;
  scale: number;
  motion?: "glide" | "bob" | "coil" | "pulse";
  position?: [number, number, number];
  grounded?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (animated === false || !ref.current) return;
    const time = clock.elapsedTime;
    ref.current.position.y = grounded ? position[1] : position[1] + Math.sin(time * (motion === "bob" ? 1.45 : 0.85)) * (motion === "bob" ? 0.09 : 0.045);
    ref.current.rotation.z = Math.sin(time * (motion === "coil" ? 1.35 : 0.62)) * (motion === "coil" ? 0.075 : 0.035);
    if (motion === "pulse") {
      const breath = 1 + Math.sin(time * 1.6) * 0.035;
      ref.current.scale.set(scale * breath, scale * breath, scale);
    }
  });

  return <group ref={ref} scale={scale} position={position}>{children}</group>;
}

function MovingPart({ children, animated, phase, base = 0, amount = 0.1, speed = 1.2 }: { children: ReactNode; animated?: boolean; phase: number; base?: number; amount?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (animated === false || !ref.current) return;
    ref.current.rotation.z = base + Math.sin(clock.elapsedTime * speed + phase) * amount;
  });
  return <group ref={ref} rotation={[0, 0, base]}>{children}</group>;
}

function MovingPupil({ position, scale, animated, phase = 0 }: { position: [number, number, number]; scale: number | [number, number, number]; animated?: boolean; phase?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (animated === false || !ref.current) return;
    ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.65 + phase) * 0.035;
    ref.current.position.y = position[1] + Math.cos(clock.elapsedTime * 0.52 + phase) * 0.025;
  });
  return <mesh ref={ref} position={position} scale={scale}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#071015" /></mesh>;
}

function PairOfEyes({ x = 0.34, y = 0.25, z = 0.55, animated }: { x?: number; y?: number; z?: number; animated?: boolean }) {
  return [-1, 1].map((side) => (
    <group key={side} position={[side * x, y, z]}>
      <mesh scale={[0.12, 0.15, 0.08]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshToonMaterial color="#F3F0E8" />
      </mesh>
      <MovingPupil position={[0, 0, 0.075]} scale={[0.045, 0.07, 0.03]} animated={animated} phase={side * 0.2} />
    </group>
  ));
}

function TurtleModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
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
      <group position={[1.25, 0.12, 0.29]} scale={0.7}>{PairOfEyes({ x: 0.16, y: 0, z: 0.16, animated: props.animated })}</group>
      {[-1, 1].flatMap((side) => [-1, 1].map((front) => (
        <MovingPart key={`${side}-${front}`} animated={props.animated} phase={side * 0.8 + front} base={side * (front > 0 ? -0.58 : 0.58)} amount={0.12} speed={1.45}>
          <mesh position={[front * 0.62, side * 0.68, -0.02]} scale={[0.48, 0.2, 0.09]}><sphereGeometry args={[1, 18, 12]} /><meshToonMaterial color={colors.accent} /></mesh>
        </MovingPart>
      )))}
      <mesh position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.2, 0.34, 0.12]}>
        <coneGeometry args={[1, 1, 12]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="turtle" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function RayModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
  const disc = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.82, 0);
    shape.bezierCurveTo(-0.72, 0.5, -0.3, 0.94, 0.2, 1.08);
    shape.bezierCurveTo(0.7, 0.96, 1.18, 0.46, 1.42, 0.04);
    shape.bezierCurveTo(1.18, -0.46, 0.7, -0.96, 0.2, -1.08);
    shape.bezierCurveTo(-0.3, -0.94, -0.72, -0.5, -0.82, 0);
    return shape;
  }, []);
  const tail = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 0, 0.02),
    new THREE.Vector3(-1.55, -0.08, 0.01),
    new THREE.Vector3(-2.4, 0.08, 0),
    new THREE.Vector3(-3.35, -0.06, -0.01),
  ]), []);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="glide">
      <mesh position={[0, 0, -0.12]}>
        <extrudeGeometry args={[disc, { depth: 0.18, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.1, bevelThickness: 0.08, curveSegments: 28 }]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <mesh position={[0.42, 0, 0.1]} scale={[0.92, 0.54, 0.16]}>
        <sphereGeometry args={[0.92, 28, 18]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0.12, side * 0.93, 0.04]}
          rotation={[side * 0.18, 0, side * -0.2]}
          scale={[0.68, 0.2, 0.08]}
        >
          <sphereGeometry args={[1, 18, 12]} />
          <meshToonMaterial color={colors.dark} />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[tail, 40, 0.028, 7, false]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`eye-${side}`} position={[0.75, side * 0.24, 0.31]}>
          <mesh scale={[0.105, 0.075, 0.06]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshToonMaterial color="#F3F0E8" />
          </mesh>
          <MovingPupil position={[0.025, 0, 0.055]} scale={[0.042, 0.034, 0.025]} animated={props.animated} phase={side * 0.25} />
        </group>
      ))}
      {[-1, 1].flatMap((side) => [0, 1, 2].map((index) => (
        <mesh
          key={`gill-${side}-${index}`}
          position={[0.38 - index * 0.12, side * (0.24 + index * 0.055), 0.275]}
          rotation={[0, 0, side * 0.18]}
          scale={[0.08, 0.018, 0.012]}
        >
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshBasicMaterial color={colors.dark} />
        </mesh>
      )))}
      <mesh position={[0.72, 0, 0.29]} rotation={[Math.PI / 2, 0, 0]} scale={[0.12, 0.08, 0.04]}>
        <torusGeometry args={[1, 0.16, 7, 18]} />
        <meshBasicMaterial color={colors.dark} />
      </mesh>
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="ray" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function StarfishModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
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
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="starfish" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function SeahorseModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
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
      <MovingPupil position={[0.27, 1.36, 0.28]} scale={0.075} animated={props.animated} />
      {Array.from({ length: 5 }, (_, index) => (
        <mesh key={index} position={[-0.26, 0.72 - index * 0.28, -0.02]} rotation={[0, 0, -0.5]} scale={[0.12, 0.28, 0.06]}>
          <coneGeometry args={[1, 1, 8]} />
          <meshToonMaterial color={colors.dark} />
        </mesh>
      ))}
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="seahorse" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ArticulatedSealTail({
  animated,
  colors,
}: {
  animated?: boolean;
  colors: ReturnType<typeof aquaticPalette>;
}) {
  const connectorRef = useRef<THREE.Group>(null);
  const finsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (animated === false) return;
    const swim = clock.elapsedTime * 1.5;
    if (connectorRef.current) connectorRef.current.rotation.z = Math.sin(swim) * 0.16;
    if (finsRef.current) finsRef.current.rotation.z = Math.sin(swim - 0.7) * 0.12;
  });

  return (
    <group ref={connectorRef} position={[-1.05, 0, 0]}>
      <mesh
        name="Seal tail connector"
        position={[-0.32, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[0.14, 0.64, 0.16]}
      >
        <cylinderGeometry args={[0.5, 1, 1, 14]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <group ref={finsRef} position={[-0.64, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh
            name={`Seal tail fin ${side < 0 ? "lower" : "upper"}`}
            key={side}
            position={[-0.24, side * 0.2, 0]}
            rotation={[0, 0, side * 0.5]}
            scale={[0.5, 0.18, 0.1]}
          >
            <sphereGeometry args={[1, 16, 10]} />
            <meshToonMaterial color={colors.dark} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SealModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
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
        <MovingPart key={side} animated={props.animated} phase={side} base={side * -0.46} amount={0.11} speed={1.5}>
          <mesh position={[0.25, side * 0.55, -0.02]} scale={[0.62, 0.2, 0.1]}><sphereGeometry args={[1, 18, 12]} /><meshToonMaterial color={colors.accent} /></mesh>
        </MovingPart>
      ))}
      <ArticulatedSealTail animated={props.animated} colors={colors} />
      <group position={[1.12, 0, 0]}>
        {PairOfEyes({ x: 0.22, y: 0.36, z: 0.4, animated: props.animated })}
      </group>
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="seal" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ShrimpModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
  const antennae = useMemo(() => [-1, 1].map((side) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.02, side * 0.18, 0.18),
    new THREE.Vector3(1.55, side * 0.45, 0.12),
    new THREE.Vector3(2.05, side * 0.62, 0),
  ])), []);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="coil">
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={`segment-${index}`} position={[-0.62 + index * 0.3, Math.sin(index * 0.42) * 0.12, 0]} scale={[0.34, 0.46 - index * 0.025, 0.32]}>
          <sphereGeometry args={[1, 18, 14]} />
          <meshToonMaterial color={index % 2 ? colors.body : colors.light} />
        </mesh>
      ))}
      <mesh position={[1.12, 0.18, 0]} scale={[0.48, 0.42, 0.35]}><sphereGeometry args={[1, 20, 16]} /><meshToonMaterial color={colors.accent} /></mesh>
      {antennae.map((curve, index) => <mesh key={`antenna-${index}`}><tubeGeometry args={[curve, 18, 0.022, 6, false]} /><meshToonMaterial color={colors.light} /></mesh>)}
      {[-1, 1].map((side) => <MovingPupil key={side} position={[1.28, side * 0.23, 0.3]} scale={0.075} animated={props.animated} phase={side} />)}
      {Array.from({ length: 5 }, (_, index) => [-1, 1].map((side) => (
        <MovingPart key={`leg-${index}-${side}`} animated={props.animated} phase={index * 0.55 + side} base={side * 0.42} amount={0.16} speed={2.1}>
          <mesh position={[-0.25 + index * 0.28, side * 0.48, -0.08]} rotation={[0, 0, side * 0.55]} scale={[0.035, 0.34, 0.035]}><cylinderGeometry args={[1, 0.65, 1, 7]} /><meshToonMaterial color={colors.dark} /></mesh>
        </MovingPart>
      )))}
      {[-1, 1].map((side) => <mesh key={`tail-${side}`} position={[-1.02, side * 0.28, 0]} rotation={[0, 0, side * 0.42]} scale={[0.48, 0.22, 0.08]}><sphereGeometry args={[1, 14, 10]} /><meshToonMaterial color={colors.accent} /></mesh>)}
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="shrimp" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ArticulatedMammalTail({
  animated,
  colors,
  whale,
}: {
  animated?: boolean;
  colors: ReturnType<typeof aquaticPalette>;
  whale: boolean;
}) {
  const stemRef = useRef<THREE.Group>(null);
  const flukesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (animated === false) return;
    const swim = clock.elapsedTime * (whale ? 1.15 : 1.65);
    if (stemRef.current) stemRef.current.rotation.z = Math.sin(swim) * (whale ? 0.16 : 0.2);
    if (flukesRef.current) flukesRef.current.rotation.z = Math.sin(swim - 0.72) * (whale ? 0.14 : 0.18);
  });

  const stemLength = whale ? 1.02 : 0.88;
  return (
    <group ref={stemRef}>
      <mesh position={[-stemLength * 0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[whale ? 0.105 : 0.085, stemLength, whale ? 0.14 : 0.11]}>
        <cylinderGeometry args={[0.42, 1, 1, 14]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <group ref={flukesRef} position={[-stemLength, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[-0.22, side * (whale ? 0.28 : 0.23), 0]} rotation={[0, 0, side * 0.52]} scale={[whale ? 0.72 : 0.57, whale ? 0.22 : 0.18, 0.085]}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshToonMaterial color={colors.dark} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function MarineMammalModel({ kind, ...props }: AquaticModelProps & { kind: "narwhal" | "dolphin" | "whale" }) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
  const whale = kind === "whale";
  const dolphin = kind === "dolphin";
  const bodyLength = whale ? 1.72 : dolphin ? 1.38 : 1.46;
  const bodyHeight = whale ? 0.72 : dolphin ? 0.52 : 0.58;
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="glide">
      <mesh scale={[bodyLength, bodyHeight, whale ? 0.62 : 0.48]}><sphereGeometry args={[1, 32, 22]} /><meshToonMaterial color={colors.body} /></mesh>
      <mesh position={[0.42, -bodyHeight * 0.42, 0.28]} scale={[bodyLength * 0.7, bodyHeight * 0.42, 0.3]}><sphereGeometry args={[1, 24, 16]} /><meshToonMaterial color={colors.light} /></mesh>
      <mesh position={[bodyLength * 0.92, dolphin ? -0.05 : 0.03, 0]} scale={[dolphin ? 0.58 : 0.42, dolphin ? 0.16 : 0.26, dolphin ? 0.2 : 0.28]}><sphereGeometry args={[1, 20, 14]} /><meshToonMaterial color={colors.light} /></mesh>
      <mesh position={[0.05, bodyHeight * 0.92, -0.03]} rotation={[0, 0, -0.22]} scale={[whale ? 0.42 : 0.34, whale ? 0.52 : 0.46, 0.09]}><coneGeometry args={[1, 1, 12]} /><meshToonMaterial color={colors.dark} /></mesh>
      {[-1, 1].map((side) => (
        <MovingPart key={`flipper-${side}`} animated={props.animated} phase={side} base={side * -0.52} amount={0.12} speed={1.2}>
          <mesh position={[0.36, side * bodyHeight * 0.8, -0.06]} scale={[whale ? 0.78 : 0.58, whale ? 0.2 : 0.14, 0.08]}><sphereGeometry args={[1, 18, 12]} /><meshToonMaterial color={colors.accent} /></mesh>
        </MovingPart>
      ))}
      {dolphin ? [-1, 1].map((side) => (
        <MovingPart key={`fluke-${side}`} animated={props.animated} phase={side * 0.7} base={side * 0.62} amount={0.1} speed={1.05}>
          <mesh position={[-bodyLength * 1.04, side * 0.28, 0]} scale={[0.55, 0.2, 0.1]}><sphereGeometry args={[1, 18, 12]} /><meshToonMaterial color={colors.dark} /></mesh>
        </MovingPart>
      )) : (
        <group position={[-bodyLength * 0.93, 0, 0]}>
          <ArticulatedMammalTail animated={props.animated} colors={colors} whale={whale} />
        </group>
      )}
      <MovingPupil position={[bodyLength * 0.67, 0.17, whale ? 0.54 : 0.43]} scale={whale ? 0.07 : 0.075} animated={props.animated} />
      {kind === "narwhal" && <mesh position={[bodyLength * 1.28, 0.13, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.11, 1.05, 0.11]}><coneGeometry args={[1, 1, 12]} /><meshToonMaterial color="#F3F0E8" /></mesh>}
      {whale && <mesh position={[bodyLength * 0.72, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.06, 0.06, 0.04]}><torusGeometry args={[1, 0.3, 7, 14]} /><meshBasicMaterial color={colors.dark} /></mesh>}
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form={kind} highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ClamModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="pulse" grounded={props.grounded}>
      {[-1, 1].map((side) => (
        <MovingPart key={side} animated={props.animated} phase={side} base={side * -0.2} amount={0.08} speed={0.9}>
        <group position={[0, side * 0.28, 0]}>
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
        </MovingPart>
      ))}
      <mesh position={[0, 0, 0.36]} scale={0.24}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color="#F4EAF3" emissive={colors.accent} emissiveIntensity={0.36} roughness={0.12} />
      </mesh>
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="clam" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

function ArticulatedPufferfishTail({
  animated,
  colors,
}: {
  animated?: boolean;
  colors: ReturnType<typeof aquaticPalette>;
}) {
  const connectorRef = useRef<THREE.Group>(null);
  const finsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (animated === false) return;
    const swim = clock.elapsedTime * 1.75;
    if (connectorRef.current) connectorRef.current.rotation.z = Math.sin(swim) * 0.18;
    if (finsRef.current) finsRef.current.rotation.z = Math.sin(swim - 0.68) * 0.14;
  });

  return (
    <group ref={connectorRef} position={[-0.98, 0, -0.02]}>
      <mesh
        name="Pufferfish tail connector"
        position={[-0.3, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[0.13, 0.6, 0.14]}
      >
        <cylinderGeometry args={[0.48, 1, 1, 14]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      <group ref={finsRef} position={[-0.6, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh
            name={`Pufferfish tail fin ${side < 0 ? "lower" : "upper"}`}
            key={side}
            position={[-0.22, side * 0.22, 0]}
            rotation={[0, 0, side * 0.54]}
            scale={[0.52, 0.24, 0.09]}
          >
            <sphereGeometry args={[1, 18, 12]} />
            <meshToonMaterial color={colors.accent} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PufferfishModel(props: AquaticModelProps) {
  const colors = aquaticPalette(props.pieces, props.baseSeed);
  return (
    <LivingGroup animated={props.animated} scale={props.scale} motion="pulse">
      <mesh scale={[1.16, 0.82, 0.62]}>
        <sphereGeometry args={[1, 28, 22]} />
        <meshToonMaterial color={colors.body} />
      </mesh>
      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 1.15, Math.sin(angle) * 0.82, 0]} rotation={[0, 0, angle - Math.PI / 2]} scale={[0.085, 0.25 + (index % 3) * 0.045, 0.085]}>
            <coneGeometry args={[1, 1, 8]} />
            <meshToonMaterial color={index % 2 ? colors.light : colors.accent} />
          </mesh>
        );
      })}
      <ArticulatedPufferfishTail animated={props.animated} colors={colors} />
      <mesh position={[-0.2, 0.82, -0.04]} rotation={[0, 0, -0.16]} scale={[0.34, 0.38, 0.08]}>
        <coneGeometry args={[1, 1, 12]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      <mesh position={[0.05, -0.74, -0.02]} rotation={[0, 0, Math.PI + 0.18]} scale={[0.28, 0.34, 0.08]}>
        <coneGeometry args={[1, 1, 12]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      <mesh position={[0.08, -0.08, 0.62]} rotation={[0.18, 0, -0.18]} scale={[0.38, 0.18, 0.07]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshToonMaterial color={colors.light} />
      </mesh>
      <group position={[0.62, 0.25, 0.58]}>
        <mesh scale={[0.15, 0.17, 0.09]}>
          <sphereGeometry args={[1, 14, 12]} />
          <meshToonMaterial color="#F3F0E8" />
        </mesh>
        <MovingPupil position={[0.035, 0, 0.085]} scale={[0.06, 0.075, 0.035]} animated={props.animated} />
      </group>
      <mesh position={[1.08, -0.08, 0.48]} scale={[0.12, 0.12, 0.05]}>
        <torusGeometry args={[1, 0.22, 7, 16]} />
        <meshToonMaterial color={colors.dark} />
      </mesh>
      <TraitMarks pieces={props.pieces} baseSeed={props.baseSeed} form="pufferfish" highlightedPart={props.highlightedPart} />
    </LivingGroup>
  );
}

export function AdditionalAquaticModel({ form, ...props }: AquaticModelProps & { form: AdditionalForm }) {
  if (form === "turtle") return <TurtleModel {...props} />;
  if (form === "ray") return <RayModel {...props} />;
  if (form === "starfish") return <StarfishModel {...props} />;
  if (form === "seahorse") return <SeahorseModel {...props} />;
  if (form === "seal") return <SealModel {...props} />;
  if (form === "shrimp") return <ShrimpModel {...props} />;
  if (form === "narwhal" || form === "dolphin" || form === "whale") return <MarineMammalModel kind={form} {...props} />;
  if (form === "clam") return <ClamModel {...props} />;
  return <PufferfishModel {...props} />;
}
