/**
 * ScaleCalibration
 * Derives real-world millimeter scale and metric camera depth from facial landmarks and camera intrinsics.
 * Follows physical optics: 3D model scale represents physical eyewear dimensions (140mm = 0.140m),
 * while distance scaling is photometrically handled by perspective camera depth.
 */

// Average adult interpupillary distance (IPD) is ~63mm (range: 58mm - 70mm)
export const HUMAN_AVERAGE_IPD_MM = 63.0;

// Average adult temple-to-temple face width is ~140mm
export const HUMAN_AVERAGE_FACE_WIDTH_MM = 140.0;

// Baseline anatomical ratio of temple face width to IPD (140mm / 63mm = 2.222)
export const ANATOMICAL_FACE_TO_IPD_RATIO = HUMAN_AVERAGE_FACE_WIDTH_MM / HUMAN_AVERAGE_IPD_MM;

/**
 * Calculates Euclidean distance between left and right pupils or eye centers in normalized camera coordinates.
 */
export function calculateInterEyeDistance(
  rightPupil: { x: number; y: number },
  leftPupil: { x: number; y: number }
): number {
  const dx = rightPupil.x - leftPupil.x;
  const dy = rightPupil.y - leftPupil.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates temple-to-temple face width (landmarks 127 and 356) in normalized camera coordinates.
 */
export function calculateFaceWidth(
  rightTemple: { x: number; y: number },
  leftTemple: { x: number; y: number }
): number {
  const dx = rightTemple.x - leftTemple.x;
  const dy = rightTemple.y - leftTemple.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes intrinsic physical face scale relative to the 140mm reference frame.
 * Because distance scaling is handled in 3D world depth by the perspective camera,
 * this scale strictly represents the user's anatomical proportions (narrow vs wide face).
 */
export function computeBaseScale(
  interEyeDist: number,
  faceWidth?: number
): number {
  if (interEyeDist <= 0.0001) return 1.0;

  // If both temple width and IPD are available, calculate distance-invariant anatomical proportion
  if (faceWidth && faceWidth > 0.001) {
    const observedRatio = faceWidth / interEyeDist;
    const anatomicalFactor = observedRatio / ANATOMICAL_FACE_TO_IPD_RATIO;
    // Blend 80% baseline (1.0) with 20% anatomical variation to avoid extreme distortion
    const proportionalScale = 0.8 + 0.2 * anatomicalFactor;
    return Math.max(0.85, Math.min(1.20, proportionalScale));
  }

  // Standard baseline scale (1.0 = exact 140mm physical frame width)
  return 1.0;
}

/**
 * Computes dynamic world-space Z depth in meters (negative) from pupil distance and camera FOV
 * Correctly incorporates horizontal aspect ratio to eliminate the 1.7x depth distortion
 */
export function computeDynamicDepthZ(
  interEyeDistNorm: number,
  cameraFovDeg = 45,
  aspectRatio = 16 / 9
): number {
  if (interEyeDistNorm <= 0.001) return -0.55;

  const tanHalfFovY = Math.tan((cameraFovDeg * Math.PI) / 360.0);
  // Horizontal FOV tangent: tan(fov_x / 2) = aspect * tan(fov_y / 2)
  const tanHalfFovX = aspectRatio * tanHalfFovY;

  // IPD in meters (0.063m) / (2 * interEyeDistNorm * tan(fov_x / 2))
  const estimatedDepth = -(0.063 / (2.0 * interEyeDistNorm * tanHalfFovX));

  // Realistic webcam operating range: 28cm (close) to 125cm (far)
  return Math.max(-1.25, Math.min(-0.28, estimatedDepth));
}
