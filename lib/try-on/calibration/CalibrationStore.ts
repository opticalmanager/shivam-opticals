import { FrameCalibration } from "@/types/tryOn";
import { DEFAULT_CALIBRATION } from "./FrameCalibration";

const LOCAL_STORAGE_KEY_PREFIX = "precision_vto_calib_";

export class CalibrationStore {
  public static getCalibration(productId: string, fallback?: Partial<FrameCalibration>): FrameCalibration {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${productId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_CALIBRATION, ...fallback, ...parsed };
        }
      } catch (err) {
        console.warn("Error reading calibration from localStorage:", err);
      }
    }

    return {
      ...DEFAULT_CALIBRATION,
      ...fallback,
    };
  }

  public static saveCalibration(productId: string, calibration: FrameCalibration): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${productId}`, JSON.stringify(calibration));
      } catch (err) {
        console.warn("Error saving calibration to localStorage:", err);
      }
    }
  }

  public static resetCalibration(productId: string): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${productId}`);
      } catch (err) {
        console.warn("Error clearing calibration from localStorage:", err);
      }
    }
  }
}
