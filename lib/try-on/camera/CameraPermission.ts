import { CameraErrorInfo } from "@/types/tryOn";

/**
 * Camera Permission & Error Parser
 * Translates low-level browser MediaDevice errors into actionable guidance for the user.
 */

export async function checkCameraPermissionState(): Promise<PermissionState | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.permissions || !navigator.permissions.query) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "camera" as PermissionName });
    return status.state;
  } catch {
    // Some browsers (like iOS Safari) throw on 'camera' query
    return "unsupported";
  }
}

export function parseCameraError(err: unknown): CameraErrorInfo {
  const error = err as { name?: string; message?: string };
  const name = error?.name || "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        type: "PERMISSION_DENIED",
        message: "Camera access was denied. Please enable camera permission to start your virtual try-on.",
        instructions: [
          "Tap the lock or tune icon in your browser address bar.",
          "Set Camera to 'Allow'.",
          "Reload the page or tap Try Again below.",
        ],
      };

    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        type: "DEVICE_NOT_FOUND",
        message: "No front-facing camera was found on your device.",
        instructions: [
          "Ensure your webcam or mobile camera is properly connected.",
          "Check that no privacy shutter or physical switch is blocking the lens.",
        ],
      };

    case "NotReadableError":
    case "TrackStartError":
      return {
        type: "CAMERA_IN_USE",
        message: "Your camera is currently being used by another application.",
        instructions: [
          "Close Zoom, Teams, FaceTime, or other browser tabs that may be accessing your camera.",
          "Tap Try Again once the other app is closed.",
        ],
      };

    case "NotSupportedError":
      return {
        type: "UNSUPPORTED_BROWSER",
        message: "Your current browser does not support live video capture.",
        instructions: [
          "Please open this page in Chrome, Safari, or Edge.",
          "Ensure you are using HTTPS (secure connection).",
        ],
      };

    default:
      return {
        type: "UNKNOWN_ERROR",
        message: "Unable to start camera stream. Please try again.",
        instructions: [
          "Refresh the page.",
          "Ensure your browser has permission to access media devices.",
        ],
      };
  }
}
