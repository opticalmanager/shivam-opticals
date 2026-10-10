import * as THREE from "three";
import { VideoToRenderCoordinateMapper } from "./VideoToRenderCoordinateMapper";
import { LightingManager } from "./LightingManager";
import { OcclusionManager } from "./OcclusionManager";
import { EyewearModelManager } from "./EyewearModelManager";

export interface ThreeRendererConfig {
  canvas: HTMLCanvasElement;
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  cameraFov?: number;
  mirrored?: boolean;
}

export class ThreeRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private coordMapper: VideoToRenderCoordinateMapper;

  public lighting: LightingManager;
  public occlusion: OcclusionManager;
  public eyewear: EyewearModelManager;

  private isContextLost = false;

  constructor(config: ThreeRendererConfig) {
    this.canvas = config.canvas;
    const { containerWidth, containerHeight, videoWidth, videoHeight, cameraFov = 45, mirrored = true } = config;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup matching optical perspective
    const aspect = containerWidth / containerHeight;
    this.camera = new THREE.PerspectiveCamera(cameraFov, aspect, 0.01, 20.0);
    this.camera.position.set(0, 0, 0);
    this.scene.add(this.camera);

    // 3. WebGL Renderer with alpha transparency and high performance
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true, // Required for photo capture snapshot
    });

    this.renderer.setSize(containerWidth, containerHeight, false);
    this.renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Coordinate Mapper
    this.coordMapper = new VideoToRenderCoordinateMapper({
      containerWidth,
      containerHeight,
      videoWidth,
      videoHeight,
      cameraFovDeg: cameraFov,
      mirrored,
    });

    // 5. Managers
    this.lighting = new LightingManager(this.scene, this.renderer);
    this.occlusion = new OcclusionManager(this.scene);
    this.eyewear = new EyewearModelManager(this.scene);

    this.setupContextLossHandling();
  }

  private setupContextLossHandling() {
    this.canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        console.warn("ThreeRenderer: WebGL context lost. Attempting pause...");
        this.isContextLost = true;
      },
      false
    );

    this.canvas.addEventListener(
      "webglcontextrestored",
      () => {
        console.log("ThreeRenderer: WebGL context restored. Restoring scene...");
        this.isContextLost = false;
      },
      false
    );
  }

  public resize(width: number, height: number, videoWidth?: number, videoHeight?: number): void {
    if (this.isContextLost || width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);

    this.coordMapper.updateViewport({
      containerWidth: width,
      containerHeight: height,
      videoWidth,
      videoHeight,
    });
  }

  public render(): void {
    if (this.isContextLost) return;
    this.renderer.render(this.scene, this.camera);
  }

  public getCoordinateMapper(): VideoToRenderCoordinateMapper {
    return this.coordMapper;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public dispose(): void {
    this.lighting.dispose(this.scene);
    this.occlusion.dispose(this.scene);
    this.eyewear.dispose(this.scene);

    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
