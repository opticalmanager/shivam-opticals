import { getOptimalCameraConstraints, getFallbackCameraConstraints } from "./CameraConstraints";
import { parseCameraError } from "./CameraPermission";
import { CameraErrorInfo } from "@/types/tryOn";

/**
 * CameraManager
 * Production-ready camera controller managing the lifecycle of the browser video stream.
 * Ensures zero track leaks and robust startup across mobile and desktop.
 */
export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isStarting = false;
  private onOrientationChangeCallback: (() => void) | null = null;

  /**
   * Starts camera and attaches to video element
   */
  public async start(
    videoElement: HTMLVideoElement,
    onError?: (error: CameraErrorInfo) => void
  ): Promise<boolean> {
    if (this.isStarting) return false;
    this.isStarting = true;

    // First stop any existing tracks cleanly
    this.stop();

    this.videoElement = videoElement;

    try {
      let mediaStream: MediaStream;
      try {
        const constraints = getOptimalCameraConstraints({ preferHd: true });
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("Primary camera constraints failed, attempting fallback resolution:", firstErr);
        const fallbackConstraints = getFallbackCameraConstraints();
        mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      this.stream = mediaStream;
      videoElement.srcObject = mediaStream;

      // Ensure inline playback on iOS Safari
      videoElement.setAttribute("playsinline", "true");
      videoElement.setAttribute("webkit-playsinline", "true");
      videoElement.muted = true;

      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = () => {
          videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
          videoElement.removeEventListener("error", handleError);
          videoElement.play().then(() => resolve()).catch(reject);
        };
        const handleError = (e: Event) => {
          videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
          videoElement.removeEventListener("error", handleError);
          reject(e);
        };

        if (videoElement.readyState >= 1) {
          videoElement.play().then(() => resolve()).catch(reject);
        } else {
          videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
          videoElement.addEventListener("error", handleError);
        }
      });

      this.setupOrientationListener();
      return true;
    } catch (err) {
      console.error("CameraManager startup error:", err);
      const parsed = parseCameraError(err);
      onError?.(parsed);
      this.stop();
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Listen to orientation / viewport changes to trigger recalculations
   */
  private setupOrientationListener() {
    this.removeOrientationListener();
    this.onOrientationChangeCallback = () => {
      // Small timeout to allow browser layout settle
      setTimeout(() => {
        if (this.videoElement) {
          // Trigger custom event or notification if needed
        }
      }, 200);
    };

    window.addEventListener("resize", this.onOrientationChangeCallback);
    window.addEventListener("orientationchange", this.onOrientationChangeCallback);
  }

  private removeOrientationListener() {
    if (this.onOrientationChangeCallback) {
      window.removeEventListener("resize", this.onOrientationChangeCallback);
      window.removeEventListener("orientationchange", this.onOrientationChangeCallback);
      this.onOrientationChangeCallback = null;
    }
  }

  /**
   * Stops all active tracks and releases camera hardware
   */
  public stop(): void {
    this.removeOrientationListener();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping camera track:", e);
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.srcObject = null;
      } catch {
        // ignore
      }
      this.videoElement = null;
    }
  }

  /**
   * Returns current active stream
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Returns active video element
   */
  public getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Video intrinsic dimensions
   */
  public getVideoDimensions(): { width: number; height: number } {
    if (!this.videoElement) return { width: 0, height: 0 };
    return {
      width: this.videoElement.videoWidth || 1280,
      height: this.videoElement.videoHeight || 720,
    };
  }
}
