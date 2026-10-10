/**
 * VideoToRenderCoordinateMapper
 * Mathematically accounts for:
 * 1. CSS `object-fit: cover` scaling and cropping
 * 2. Front-camera horizontal mirroring (`-scaleX(1)`)
 * 3. Conversion from normalized MediaPipe space [0, 1] to screen pixels, Three.js NDC [-1, 1], and 3D World space.
 */

export interface ViewportConfig {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  mirrored?: boolean;
  cameraFovDeg?: number;
}

export class VideoToRenderCoordinateMapper {
  private containerW = 1;
  private containerH = 1;
  private videoW = 1;
  private videoH = 1;
  private mirrored = true;
  private cameraFov = 45;

  // Cached layout transforms
  private scale = 1.0;
  private displayedW = 1;
  private displayedH = 1;
  private cropOffsetX = 0;
  private cropOffsetY = 0;

  constructor(config?: Partial<ViewportConfig>) {
    if (config) {
      this.updateViewport(config);
    }
  }

  public updateViewport(config: Partial<ViewportConfig>): void {
    this.containerW = Math.max(1, config.containerWidth ?? this.containerW);
    this.containerH = Math.max(1, config.containerHeight ?? this.containerH);
    this.videoW = Math.max(1, config.videoWidth ?? this.videoW);
    this.videoH = Math.max(1, config.videoHeight ?? this.videoH);
    this.mirrored = config.mirrored !== undefined ? config.mirrored : this.mirrored;
    this.cameraFov = config.cameraFovDeg ?? this.cameraFov;

    this.recalculate();
  }

  private recalculate(): void {
    // object-fit: cover scale factor
    const scaleX = this.containerW / this.videoW;
    const scaleY = this.containerH / this.videoH;
    this.scale = Math.max(scaleX, scaleY);

    this.displayedW = this.videoW * this.scale;
    this.displayedH = this.videoH * this.scale;

    // Centered crop offsets
    this.cropOffsetX = (this.displayedW - this.containerW) / 2.0;
    this.cropOffsetY = (this.displayedH - this.containerH) / 2.0;
  }

  /**
   * Maps a normalized landmark (x, y in [0, 1]) to screen pixel coordinates [0, containerW/H]
   */
  public mapNormalizedToScreen(xNorm: number, yNorm: number): { x: number; y: number } {
    let xPixel = xNorm * this.displayedW - this.cropOffsetX;
    const yPixel = yNorm * this.displayedH - this.cropOffsetY;

    // Invert X if the preview video is mirrored visually via CSS
    if (this.mirrored) {
      xPixel = this.containerW - xPixel;
    }

    return { x: xPixel, y: yPixel };
  }

  /**
   * Maps normalized landmark (x, y in [0, 1]) directly to Three.js Normalized Device Coordinates (NDC) [-1, 1]
   */
  public mapNormalizedToNDC(xNorm: number, yNorm: number): { x: number; y: number } {
    const screen = this.mapNormalizedToScreen(xNorm, yNorm);

    const ndcX = (screen.x / this.containerW) * 2.0 - 1.0;
    // In Three.js NDC, +Y is UP, whereas in screen pixels +Y is DOWN
    const ndcY = -(screen.y / this.containerH) * 2.0 + 1.0;

    return { x: ndcX, y: ndcY };
  }

  /**
   * Maps normalized landmark to Three.js 3D world space at given depth Z (typically negative)
   */
  public mapNormalizedTo3D(
    xNorm: number,
    yNorm: number,
    depthZ: number
  ): { x: number; y: number; z: number } {
    const ndc = this.mapNormalizedToNDC(xNorm, yNorm);

    const aspect = this.containerW / this.containerH;
    const tanFovHalf = Math.tan((this.cameraFov * Math.PI) / 360.0);

    const absZ = Math.abs(depthZ);
    const worldY = ndc.y * absZ * tanFovHalf;
    const worldX = ndc.x * absZ * tanFovHalf * aspect;

    return {
      x: worldX,
      y: worldY,
      z: depthZ,
    };
  }

  public getDisplayedDimensions(): { width: number; height: number } {
    return { width: this.displayedW, height: this.displayedH };
  }

  public getCropOffsets(): { offsetX: number; offsetY: number } {
    return { offsetX: this.cropOffsetX, offsetY: this.cropOffsetY };
  }

  public getContainerDimensions(): { width: number; height: number } {
    return { width: this.containerW, height: this.containerH };
  }

  public getCoverScale(): number {
    return this.scale;
  }

  public isMirrored(): boolean {
    return this.mirrored;
  }

  /**
   * Returns vertical and horizontal pinhole focal lengths in screen pixels
   */
  public getFocalLengths(): { fx: number; fy: number } {
    const tanFovHalf = Math.tan((this.cameraFov * Math.PI) / 360.0);
    // Vertical focal length in canvas pixels
    const fy = this.containerH / (2.0 * tanFovHalf);
    // In standard Three.js PerspectiveCamera with square sensor pixels, fx = fy
    return { fx: fy, fy };
  }

  /**
   * Calculates true Euclidean distance between two normalized points in displayed screen pixels
   * Eliminates anisotropic stretching between horizontal and vertical axes
   */
  public getPixelDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    const dxPixel = (p1.x - p2.x) * this.displayedW;
    const dyPixel = (p1.y - p2.y) * this.displayedH;
    return Math.sqrt(dxPixel * dxPixel + dyPixel * dyPixel);
  }

  /**
   * Calculates true metric camera depth (Z in meters, negative) from detected pupil locations
   * Uses adult average IPD (63mm = 0.063m) and pinhole camera triangulation
   */
  public calculateMetricDepth(
    rightPupil: { x: number; y: number },
    leftPupil: { x: number; y: number },
    ipdMetricMeters = 0.063
  ): number {
    const pupilDistPixels = this.getPixelDistance(rightPupil, leftPupil);
    if (pupilDistPixels <= 1.0) return -0.55;

    const { fy } = this.getFocalLengths();
    // Z = -(IPD * fy) / pupilDistancePixels
    const depthMeters = -(ipdMetricMeters * fy) / pupilDistPixels;

    // Clamp to realistic human webcam distance range (-0.28m to -1.30m)
    return Math.max(-1.3, Math.min(-0.28, depthMeters));
  }
}
