import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * FaceLandmarkerService
 * Initializes and executes Google MediaPipe Face Landmarker WebAssembly engine.
 * Automatically tries GPU acceleration with graceful CPU fallback.
 */

const WASM_CDN_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export class FaceLandmarkerService {
  private static instance: FaceLandmarkerService | null = null;
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private initPromise: Promise<FaceLandmarker | null> | null = null;
  private lastTimestampMs = -1;

  public static getInstance(): FaceLandmarkerService {
    if (!FaceLandmarkerService.instance) {
      FaceLandmarkerService.instance = new FaceLandmarkerService();
    }
    return FaceLandmarkerService.instance;
  }

  /**
   * Initializes the MediaPipe Face Landmarker engine
   */
  public async initialize(): Promise<FaceLandmarker | null> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;

    this.initPromise = (async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);

        // First attempt with GPU delegate
        try {
          this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: MODEL_ASSET_PATH,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFacialTransformationMatrixes: true,
            outputFaceBlendshapes: false,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          return this.landmarker;
        } catch (gpuErr) {
          console.warn("MediaPipe GPU delegate initialization failed, falling back to CPU:", gpuErr);
          this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: MODEL_ASSET_PATH,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFacialTransformationMatrixes: true,
            outputFaceBlendshapes: false,
          });
          return this.landmarker;
        }
      } catch (err) {
        console.error("Critical: Failed to initialize MediaPipe FaceLandmarker:", err);
        return null;
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Detects face landmarks in video element for given timestamp
   */
  public detect(videoElement: HTMLVideoElement, timestampMs: number) {
    if (!this.landmarker || videoElement.readyState < 2) {
      return null;
    }

    // MediaPipe Tasks Vision strictly requires monotonically increasing timestamps
    let validTimestamp = Math.round(timestampMs);
    if (validTimestamp <= this.lastTimestampMs) {
      validTimestamp = this.lastTimestampMs + 1;
    }
    this.lastTimestampMs = validTimestamp;

    try {
      return this.landmarker.detectForVideo(videoElement, validTimestamp);
    } catch (err) {
      // Catch occasional dropped frame error during video seek/resize
      return null;
    }
  }

  public close(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn("Error closing MediaPipe FaceLandmarker:", e);
      }
      this.landmarker = null;
    }
  }
}
