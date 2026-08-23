declare module "mind-ar/dist/mindar-image-three.prod.js" {
  import type * as THREE from "three";

  type MindARAnchor = {
    group: THREE.Group;
    onTargetFound: (() => void) | null;
    onTargetLost: (() => void) | null;
  };

  export class MindARThree {
    constructor(options: {
      container: HTMLElement;
      imageTargetSrc: string;
      uiLoading?: "yes" | "no";
      uiScanning?: "yes" | "no";
      uiError?: "yes" | "no";
      filterMinCF?: number;
      filterBeta?: number;
      warmupTolerance?: number;
      missTolerance?: number;
    });
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    addAnchor(targetIndex: number): MindARAnchor;
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}
