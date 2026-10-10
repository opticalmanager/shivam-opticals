import * as THREE from "three";
import { Vector3Filter, OneEuroFilter } from "./OneEuroFilter";
import { FacePose, TrackingConfidenceState } from "@/types/tryOn";

/**
 * SmoothingEngine
 * Coordinates adaptive temporal filtering across 3D position, Quaternion rotation (SLERP), and scale.
 * Damps micro-jitter when stationary, accelerates during rapid motion, and avoids gimbal lock.
 */
export class SmoothingEngine {
  private posFilter: Vector3Filter;
  private scaleFilter: OneEuroFilter;
  private currentQuat = new THREE.Quaternion();
  private targetQuat = new THREE.Quaternion();
  private tempEuler = new THREE.Euler();
  private lastTimeMs: number | null = null;
  private lastPose: FacePose | null = null;

  constructor() {
    // High-responsiveness AR parameters:
    // minCutoff = 2.0 Hz eliminates stationary micro-jitter
    // beta = 2.5 dynamically opens cutoff to >60 Hz during rapid motion for zero perceptible lag
    this.posFilter = new Vector3Filter(2.0, 2.5, 1.0);
    this.scaleFilter = new OneEuroFilter(2.0, 1.5, 1.0);
  }

  /**
   * Applies adaptive filtering to a raw FacePose
   * @param rawPose The newly calculated raw pose
   * @param timestampMs High-resolution timestamp in ms
   * @param confidenceState Current confidence state ('HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | etc.)
   */
  public filter(
    rawPose: FacePose,
    timestampMs: number,
    confidenceState: TrackingConfidenceState = "HIGH_CONFIDENCE"
  ): FacePose {
    // If tracking was lost or first pose, reset filters to prevent lerping across screen
    if (!this.lastPose || confidenceState === "LOST" || this.lastTimeMs === null) {
      this.reset();
      if (rawPose.quaternion) {
        this.currentQuat.set(
          rawPose.quaternion.x,
          rawPose.quaternion.y,
          rawPose.quaternion.z,
          rawPose.quaternion.w
        );
      } else {
        this.tempEuler.set(rawPose.rotation.pitch, rawPose.rotation.yaw, rawPose.rotation.roll, "YXZ");
        this.currentQuat.setFromEuler(this.tempEuler);
      }
      this.lastTimeMs = timestampMs;
      this.lastPose = { ...rawPose };
      return rawPose;
    }

    const dt = Math.max(0.001, (timestampMs - this.lastTimeMs) / 1000.0);
    this.lastTimeMs = timestampMs;

    // 1. Filter position (Vector3 OneEuro)
    const filteredPos = this.posFilter.filter(rawPose.position, timestampMs);
    if (
      !Number.isFinite(filteredPos.x) ||
      !Number.isFinite(filteredPos.y) ||
      !Number.isFinite(filteredPos.z)
    ) {
      filteredPos.x = rawPose.position.x;
      filteredPos.y = rawPose.position.y;
      filteredPos.z = rawPose.position.z;
    }

    // 2. Filter rotation using adaptive Quaternion SLERP (eliminates Euler fighting & gimbal lock)
    if (rawPose.quaternion) {
      this.targetQuat.set(
        rawPose.quaternion.x,
        rawPose.quaternion.y,
        rawPose.quaternion.z,
        rawPose.quaternion.w
      );
    } else {
      this.tempEuler.set(rawPose.rotation.pitch, rawPose.rotation.yaw, rawPose.rotation.roll, "YXZ");
      this.targetQuat.setFromEuler(this.tempEuler);
    }

    // Adaptive SLERP speed: smoothly ramps from 0.45 (still) to 0.98 (rapid motion)
    const angleDiff = this.currentQuat.angleTo(this.targetQuat);
    const angularSpeed = Number.isFinite(angleDiff) ? angleDiff / dt : 0;
    const confidenceMultiplier = confidenceState === "LOW_CONFIDENCE" ? 0.75 : 1.0;
    const baseSlerp = Math.min(0.98, Math.max(0.45, 0.45 + angularSpeed * 0.4));
    const slerpFactor = Number.isFinite(baseSlerp) ? Math.min(0.98, baseSlerp * confidenceMultiplier) : 0.8;

    if (Number.isFinite(slerpFactor) && slerpFactor > 0) {
      this.currentQuat.slerp(this.targetQuat, slerpFactor);
    } else {
      this.currentQuat.copy(this.targetQuat);
    }

    if (!Number.isFinite(this.currentQuat.x) || !Number.isFinite(this.currentQuat.w)) {
      this.currentQuat.copy(this.targetQuat);
    }

    // Derive Euler angles from smoothed quaternion for diagnostics and legacy consumers
    this.tempEuler.setFromQuaternion(this.currentQuat, "YXZ");

    // 3. Filter scale
    let filteredScale = this.scaleFilter.filter(rawPose.scale, timestampMs);
    if (!Number.isFinite(filteredScale) || filteredScale <= 0.1) {
      filteredScale = rawPose.scale;
    }

    const result: FacePose = {
      position: filteredPos,
      rotation: {
        pitch: this.tempEuler.x,
        yaw: this.tempEuler.y,
        roll: this.tempEuler.z,
      },
      quaternion: {
        x: this.currentQuat.x,
        y: this.currentQuat.y,
        z: this.currentQuat.z,
        w: this.currentQuat.w,
      },
      eyeDistance: rawPose.eyeDistance,
      scale: filteredScale,
    };

    this.lastPose = result;
    return result;
  }

  public getLastPose(): FacePose | null {
    return this.lastPose;
  }

  public reset(): void {
    this.posFilter.reset();
    this.scaleFilter.reset();
    this.currentQuat.identity();
    this.targetQuat.identity();
    this.lastTimeMs = null;
    this.lastPose = null;
  }
}
