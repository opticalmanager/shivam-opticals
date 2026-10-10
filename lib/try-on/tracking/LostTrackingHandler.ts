import { FacePose } from "@/types/tryOn";

/**
 * LostTrackingHandler
 * Prevents jarring disappearing or teleportation artifacts when face tracking is momentarily lost or re-acquired.
 */
export class LostTrackingHandler {
  private isTracking = false;
  private lostTimestamp: number | null = null;
  private lastKnownPose: FacePose | null = null;
  private readonly decayDurationMs: number;

  constructor(decayDurationMs = 350) {
    this.decayDurationMs = decayDurationMs;
  }

  /**
   * Updates state when a valid face pose is detected
   */
  public onPoseDetected(pose: FacePose): void {
    this.isTracking = true;
    this.lostTimestamp = null;
    this.lastKnownPose = { ...pose };
  }

  /**
   * Updates state when no face is found in current frame
   */
  public onPoseLost(timestampMs: number): void {
    if (this.isTracking) {
      this.isTracking = false;
      this.lostTimestamp = timestampMs;
    }
  }

  /**
   * Computes current display opacity (1.0 = full, 0.0 = hidden)
   */
  public getVisibilityOpacity(currentTimestampMs: number): number {
    if (this.isTracking) return 1.0;
    if (this.lostTimestamp === null) return 0.0;

    const elapsed = currentTimestampMs - this.lostTimestamp;
    if (elapsed >= this.decayDurationMs) return 0.0;

    // Smooth linear decay from 1.0 down to 0.0
    return Math.max(0.0, 1.0 - elapsed / this.decayDurationMs);
  }

  public getLastKnownPose(): FacePose | null {
    return this.lastKnownPose;
  }

  public isActivelyTracking(): boolean {
    return this.isTracking;
  }

  public reset(): void {
    this.isTracking = false;
    this.lostTimestamp = null;
    this.lastKnownPose = null;
  }
}
