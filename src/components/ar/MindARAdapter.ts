import type * as THREEType from "three";

export type TargetEvent = (targetIndex: number) => void;

export type MindARAdapterOptions = {
  imageTargetSrc: string;
  targetIndices: number[];
  onTargetFound: TargetEvent;
  onTargetLost: TargetEvent;
};

export type ARAdapterErrorCode =
  | "unsupported"
  | "missing-targets"
  | "permission-denied"
  | "initialization-failed";

export class ARAdapterError extends Error {
  constructor(
    public code: ARAdapterErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ARAdapterError";
  }
}

type NativeParticle = {
  points: THREEType.Points;
  positions: Float32Array;
  basePositions: Float32Array;
  seeds: Float32Array;
  startedAt: number;
};

type MindARNative = InstanceType<
  typeof import("mind-ar/dist/mindar-image-three.prod.js").MindARThree
>;

export class MindARAdapter {
  private instance: MindARNative | null = null;
  private particles = new Map<number, NativeParticle>();
  private visibleTargets = new Set<number>();
  private stopped = false;

  constructor(private options: MindARAdapterOptions) {}

  async start(container: HTMLElement) {
    this.stopped = false;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.isSecureContext
    ) {
      throw new ARAdapterError(
        "unsupported",
        "Camera AR requires a secure context and a browser with camera support.",
      );
    }

    const targetResponse = await fetch(this.options.imageTargetSrc, {
      method: "HEAD",
      cache: "no-store",
    });
    if (!targetResponse.ok) {
      throw new ARAdapterError(
        "missing-targets",
        `No compiled MindAR target file was found at ${this.options.imageTargetSrc}.`,
      );
    }
    if (this.stopped) return;

    try {
      const [{ MindARThree }, THREE] = await Promise.all([
        import("mind-ar/dist/mindar-image-three.prod.js"),
        import("three"),
      ]);
      if (this.stopped) return;
      const mindar = new MindARThree({
        container,
        imageTargetSrc: this.options.imageTargetSrc,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
        filterMinCF: 0.0001,
        filterBeta: 10,
        warmupTolerance: 30,
        missTolerance: 5,
      });
      this.instance = mindar;

      this.options.targetIndices.forEach((targetIndex) => {
        const anchor = mindar.addAnchor(targetIndex);
        const nativeParticle = this.createNativeParticle(THREE, targetIndex);
        this.particles.set(targetIndex, nativeParticle);
        anchor.group.add(nativeParticle.points);

        anchor.onTargetFound = () => {
          if (this.stopped || this.visibleTargets.has(targetIndex)) return;
          this.visibleTargets.add(targetIndex);
          this.resetNativeParticle(nativeParticle);
          nativeParticle.startedAt = performance.now();
          nativeParticle.points.visible = true;
          this.options.onTargetFound(targetIndex);
        };
        anchor.onTargetLost = () => {
          if (this.stopped || !this.visibleTargets.has(targetIndex)) return;
          this.visibleTargets.delete(targetIndex);
          nativeParticle.points.visible = false;
          this.options.onTargetLost(targetIndex);
        };
      });

      await mindar.start();
      if (this.stopped || this.instance !== mindar) {
        await mindar.stop();
        return;
      }
      mindar.renderer.setAnimationLoop(() => {
        this.updateNativeParticles(performance.now());
        mindar.renderer.render(mindar.scene, mindar.camera);
      });
    } catch (error) {
      await this.stop();
      if (error instanceof ARAdapterError) throw error;
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")
      ) {
        throw new ARAdapterError(
          "permission-denied",
          "Camera permission was denied. Allow camera access and try again.",
        );
      }
      throw new ARAdapterError(
        "initialization-failed",
        error instanceof Error ? error.message : "MindAR could not be initialized.",
      );
    }
  }

  async stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.visibleTargets.clear();

    const instance = this.instance;
    this.instance = null;
    if (instance) {
      instance.renderer.setAnimationLoop(null);
      try {
        await instance.stop();
      } catch {
        // MindAR can reject stop while camera initialization is still unwinding.
      }
    }

    this.particles.forEach(({ points }) => {
      points.geometry.dispose();
      if (Array.isArray(points.material)) {
        points.material.forEach((material) => material.dispose());
      } else {
        points.material.dispose();
      }
      points.removeFromParent();
    });
    this.particles.clear();
  }

  private createNativeParticle(
    THREE: typeof THREEType,
    targetIndex: number,
  ): NativeParticle {
    const count = 180;
    const positions = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    let seed = (targetIndex + 1) * 104729;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = (random() - 0.5) * 0.95;
      positions[offset + 1] = (random() - 0.5) * 0.68;
      positions[offset + 2] = 0.01 + random() * 0.015;
      basePositions[offset] = positions[offset];
      basePositions[offset + 1] = positions[offset + 1];
      basePositions[offset + 2] = positions[offset + 2];
      seeds[index] = random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const colors = [0xff7557, 0x58d6ff, 0xc69cff];
    const material = new THREE.PointsMaterial({
      color: colors[targetIndex % colors.length],
      size: 1.112,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.visible = false;

    return {
      points,
      positions,
      basePositions,
      seeds,
      startedAt: 0,
    };
  }

  private resetNativeParticle(particle: NativeParticle) {
    particle.positions.set(particle.basePositions);
    const attribute = particle.points.geometry.getAttribute(
      "position",
    ) as THREEType.BufferAttribute;
    attribute.needsUpdate = true;
    const material = particle.points.material as THREEType.PointsMaterial;
    material.opacity = 0.9;
  }

  private updateNativeParticles(now: number) {
    this.particles.forEach((particle, targetIndex) => {
      if (!this.visibleTargets.has(targetIndex) || !particle.points.visible) return;
      const progress = Math.min((now - particle.startedAt) / 1050, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      for (let index = 0; index < particle.seeds.length; index += 1) {
        const offset = index * 3;
        const seed = particle.seeds[index];
        particle.positions[offset] =
          particle.basePositions[offset] +
          Math.sin(progress * 5 + seed * 20) * eased * 0.06;
        particle.positions[offset + 1] =
          particle.basePositions[offset + 1] +
          Math.cos(progress * 4 + seed * 18) * eased * 0.06;
        particle.positions[offset + 2] =
          particle.basePositions[offset + 2] + eased * (0.35 + seed * 0.35);
      }

      const attribute = particle.points.geometry.getAttribute(
        "position",
      ) as THREEType.BufferAttribute;
      attribute.needsUpdate = true;
      const material = particle.points.material as THREEType.PointsMaterial;
      material.opacity = Math.max(0, 0.9 - progress * 0.72);
    });
  }
}
