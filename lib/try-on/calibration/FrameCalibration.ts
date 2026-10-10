import * as THREE from "three";
import { FrameCalibration, FacePose } from "@/types/tryOn";

export const DEFAULT_CALIBRATION: FrameCalibration = {
  scaleMultiplier: 1.0,
  verticalOffset: 0.0,
  depthOffset: 0.0,
  horizontalOffset: 0.0,
  pitchOffset: 0.0,
  yawOffset: 0.0,
  rollOffset: 0.0,
};

/**
 * Applies per-product optical calibration offsets to the smoothed face pose.
 * Uses exact 3D Quaternion orientation to rotate local frame offsets naturally with head orientation.
 */
export function applyCalibration(
  pose: FacePose,
  calibration: FrameCalibration = DEFAULT_CALIBRATION
): {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  quaternion: { x: number; y: number; z: number; w: number };
  scale: number;
} {
  const finalScale = pose.scale * (calibration.scaleMultiplier || 1.0);

  // 1. Compose orientation quaternion with local calibration rotation offsets
  const baseQuat = pose.quaternion
    ? new THREE.Quaternion(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w)
    : new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.rotation.pitch, pose.rotation.yaw, pose.rotation.roll, "YXZ"));

  const pOff = calibration.pitchOffset || 0.0;
  const yOff = calibration.yawOffset || 0.0;
  const rOff = calibration.rollOffset || 0.0;

  if (Math.abs(pOff) > 0.0001 || Math.abs(yOff) > 0.0001 || Math.abs(rOff) > 0.0001) {
    const offsetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pOff, yOff, rOff, "YXZ"));
    baseQuat.multiply(offsetQuat);
  }

  // 2. Transform local frame position offsets (horizontal, vertical, depth) rigidly along head orientation
  const localOffset = new THREE.Vector3(
    calibration.horizontalOffset || 0.0,
    calibration.verticalOffset || 0.0,
    calibration.depthOffset || 0.0
  );
  localOffset.applyQuaternion(baseQuat);

  const finalPos = {
    x: pose.position.x + localOffset.x,
    y: pose.position.y + localOffset.y,
    z: pose.position.z + localOffset.z,
  };

  const euler = new THREE.Euler().setFromQuaternion(baseQuat, "YXZ");

  return {
    position: finalPos,
    rotation: {
      pitch: euler.x,
      yaw: euler.y,
      roll: euler.z,
    },
    quaternion: {
      x: baseQuat.x,
      y: baseQuat.y,
      z: baseQuat.z,
      w: baseQuat.w,
    },
    scale: finalScale,
  };
}
