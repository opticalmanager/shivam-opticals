/**
 * Canonical Facial Landmark Indices for MediaPipe FaceMesh (478 landmarks)
 * Precision Optics Virtual Try-On
 */

export const LANDMARKS = {
  // Pupils / Center of Eyes
  RIGHT_PUPIL: 468,
  LEFT_PUPIL: 473,

  // Right Eye (From camera perspective, viewer's left side)
  RIGHT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 33,
  RIGHT_EYE_TOP: 159,
  RIGHT_EYE_BOTTOM: 145,

  // Left Eye (From camera perspective, viewer's right side)
  LEFT_EYE_INNER: 362,
  LEFT_EYE_OUTER: 263,
  LEFT_EYE_TOP: 386,
  LEFT_EYE_BOTTOM: 374,

  // Nose Bridge / Sellion (Crucial for eyewear bridge anchor)
  NOSE_BRIDGE_SELLION: 168, // Optimal root of nose between eyes
  NOSE_BRIDGE_MID: 6,       // Mid-bridge
  NOSE_BRIDGE_LOWER: 197,   // Bridge towards tip
  NOSE_TIP: 1,

  // Temples / Ears (For glasses temples alignment and clipping)
  RIGHT_TEMPLE: 127,
  RIGHT_EAR_TRAGUS: 234,
  LEFT_TEMPLE: 356,
  LEFT_EAR_TRAGUS: 454,

  // Head Orientation Landmarks
  CHIN: 152,
  FOREHEAD_TOP: 10,
  NOSE_BASE: 2,
} as const;
