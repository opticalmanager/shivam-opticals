/**
 * Camera Constraints Configuration
 * Adaptive resolution selection prioritizing front-facing camera and stable 720p/1080p capture.
 */

export interface AdaptiveConstraintsOptions {
  preferHd?: boolean;
  targetFps?: number;
}

export function getOptimalCameraConstraints(options: AdaptiveConstraintsOptions = {}): MediaStreamConstraints {
  const { preferHd = true, targetFps = 30 } = options;

  // We prioritize 'user' facingMode for front-facing selfie camera
  return {
    audio: false,
    video: {
      facingMode: "user",
      width: preferHd ? { ideal: 1280, min: 640 } : { ideal: 640 },
      height: preferHd ? { ideal: 720, min: 480 } : { ideal: 480 },
      frameRate: { ideal: targetFps, max: 60 },
    },
  };
}

export function getFallbackCameraConstraints(): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  };
}
