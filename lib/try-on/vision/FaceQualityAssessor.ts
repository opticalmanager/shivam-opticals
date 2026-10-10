import { FaceQualityScore, TrackingConfidenceState } from "@/types/tryOn";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

export class FaceQualityAssessor {
  /**
   * Assesses face tracking quality based on landmarks, bounds, and rotation
   */
  public static assess(
    landmarks: NormalizedLandmark[] | null | undefined,
    pitchRad = 0,
    yawRad = 0,
    rollRad = 0,
    facePresenceScore = 1.0
  ): FaceQualityScore {
    if (!landmarks || landmarks.length < 10) {
      return {
        overallConfidence: 0.0,
        state: "LOST",
        isCentered: false,
        isAdequatelyLit: false,
        isWithinRotationBounds: false,
        message: "Position your face in the frame",
      };
    }

    // 1. Centering & Boundary Check
    let minX = 1.0, maxX = 0.0, minY = 1.0, maxY = 0.0;
    for (let i = 0; i < landmarks.length; i += 10) {
      const pt = landmarks[i];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const centerX = (minX + maxX) / 2.0;
    const centerY = (minY + maxY) / 2.0;

    const isCentered = centerX > 0.15 && centerX < 0.85 && centerY > 0.15 && centerY < 0.85;
    const isAdequateSize = faceWidth > 0.12 && faceWidth < 0.85 && faceHeight > 0.15;

    // 2. Rotation Bounds Check (in degrees)
    const pitchDeg = Math.abs((pitchRad * 180.0) / Math.PI);
    const yawDeg = Math.abs((yawRad * 180.0) / Math.PI);
    const rollDeg = Math.abs((rollRad * 180.0) / Math.PI);

    const isExtremeYaw = yawDeg > 48.0;
    const isExtremePitch = pitchDeg > 38.0;
    const isExtremeRoll = rollDeg > 35.0;
    const isWithinRotationBounds = !isExtremeYaw && !isExtremePitch && !isExtremeRoll;

    // 3. Compute Composite Confidence (0.0 to 1.0)
    let score = facePresenceScore;
    if (!isCentered) score *= 0.8;
    if (!isAdequateSize) score *= 0.7;
    if (isExtremeYaw) score *= 0.6;
    if (isExtremePitch) score *= 0.7;
    if (isExtremeRoll) score *= 0.8;

    score = Math.max(0.0, Math.min(1.0, score));

    // 4. Map to State
    let state: TrackingConfidenceState = "HIGH_CONFIDENCE";
    let message = "Face locked";

    if (score < 0.35) {
      state = "LOW_CONFIDENCE";
      if (isExtremeYaw || isExtremePitch) {
        message = "Please face the camera more directly";
      } else if (!isCentered) {
        message = "Move your face toward the center";
      } else {
        message = "Move closer into better lighting";
      }
    } else if (score < 0.75) {
      state = "MEDIUM_CONFIDENCE";
      if (isExtremeYaw || isExtremePitch) {
        message = "Turn slightly toward camera for best view";
      }
    }

    return {
      overallConfidence: score,
      state,
      isCentered,
      isAdequatelyLit: true,
      isWithinRotationBounds,
      message,
    };
  }
}
