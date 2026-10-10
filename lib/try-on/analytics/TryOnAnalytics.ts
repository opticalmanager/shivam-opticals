/**
 * Privacy-Compliant Virtual Try-On Analytics
 * Tracks strictly anonymized operational events without capturing camera frames or biometric geometry.
 */

export type TryOnEvent =
  | "vto_opened"
  | "vto_permission_granted"
  | "vto_permission_denied"
  | "vto_face_detected"
  | "vto_tracking_lost"
  | "vto_frame_switched"
  | "vto_photo_captured"
  | "vto_add_to_cart"
  | "vto_closed";

export interface TryOnEventPayload {
  productId?: string;
  brand?: string;
  shape?: string;
  durationSeconds?: number;
  renderFpsAverage?: number;
  [key: string]: unknown;
}

export class TryOnAnalytics {
  public static track(event: TryOnEvent, payload: TryOnEventPayload = {}): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[VTO Analytics] ${event}:`, payload);
    }

    // Forward to existing analytics or window.dataLayer if present
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      try {
        (window as any).dataLayer.push({
          event,
          vto_payload: payload,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn("Analytics push error:", err);
      }
    }
  }
}
