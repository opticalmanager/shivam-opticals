import * as THREE from "three";
import { LANDMARKS } from "./LandmarkIndices";
import { FacePose } from "@/types/tryOn";
import {
  calculateInterEyeDistance,
  calculateFaceWidth,
  computeBaseScale,
  computeDynamicDepthZ,
} from "../calibration/ScaleCalibration";
import { VideoToRenderCoordinateMapper } from "../rendering/VideoToRenderCoordinateMapper";

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export class FacePoseEstimator {
  private static tempMatrix = new THREE.Matrix4();
  private static tempEuler = new THREE.Euler();
  private static tempQuat = new THREE.Quaternion();
  private static dummyPos = new THREE.Vector3();
  private static dummyScale = new THREE.Vector3();

  // Temporary vectors for orthogonal basis fallback
  private static rightVec = new THREE.Vector3();
  private static upVec = new THREE.Vector3();
  private static fwdVec = new THREE.Vector3();
  private static basisMatrix = new THREE.Matrix4();

  /**
   * Estimates FacePose with Quaternion orientation using 4x4 facial transformation matrix
   * or anatomical landmark 3D basis vector fallback.
   */
  public static estimate(
    landmarks: LandmarkPoint[],
    matrixData: { data: Float32Array | number[] } | null | undefined,
    coordMapper: VideoToRenderCoordinateMapper,
    customDepthZ?: number
  ): FacePose | null {
    if (!landmarks || landmarks.length < 468) {
      return null;
    }

    const rightEye = landmarks[LANDMARKS.RIGHT_PUPIL] || landmarks[LANDMARKS.RIGHT_EYE_INNER];
    const leftEye = landmarks[LANDMARKS.LEFT_PUPIL] || landmarks[LANDMARKS.LEFT_EYE_INNER];
    const noseSellion = landmarks[LANDMARKS.NOSE_BRIDGE_SELLION] || landmarks[LANDMARKS.NOSE_BRIDGE_MID];
    const rightTemple = landmarks[LANDMARKS.RIGHT_TEMPLE];
    const leftTemple = landmarks[LANDMARKS.LEFT_TEMPLE];

    // 1. Calculate inter-eye distance and intrinsic face scale
    const interEyeDist = calculateInterEyeDistance(rightEye, leftEye);
    const faceWidth = rightTemple && leftTemple ? calculateFaceWidth(rightTemple, leftTemple) : undefined;
    const baseScale = computeBaseScale(interEyeDist, faceWidth);

    // 2. Calculate true metric depth (meters from camera, negative along Z)
    const depthZ = customDepthZ ?? coordMapper.calculateMetricDepth(rightEye, leftEye);

    // 3. Map 3D position of the nose bridge (where eyewear bridge rests)
    const position = coordMapper.mapNormalizedTo3D(noseSellion.x, noseSellion.y, depthZ);

    let matrixSuccess = false;

    // 4. Primary: Extract 3D rigid rotation directly from MediaPipe transformation matrix
    if (matrixData && matrixData.data && matrixData.data.length >= 16) {
      try {
        this.tempMatrix.fromArray(matrixData.data);
        this.tempMatrix.decompose(this.dummyPos, this.tempQuat, this.dummyScale);
        this.tempQuat.normalize();

        // Validate values are finite numbers
        if (
          Number.isFinite(this.tempQuat.x) &&
          Number.isFinite(this.tempQuat.y) &&
          Number.isFinite(this.tempQuat.z) &&
          Number.isFinite(this.tempQuat.w)
        ) {
          // Change of basis: MediaPipe Camera (X right, Y down, Z forward) -> Three.js Camera (X right, Y up, -Z forward)
          let qx = -this.tempQuat.x;
          let qy = this.tempQuat.y;
          let qz = this.tempQuat.z;
          let qw = -this.tempQuat.w;

          // Mirror reflection: reflect across YZ plane (invert Yaw and Roll angular directions)
          if (coordMapper.isMirrored()) {
            qy = -qy;
            qz = -qz;
          }

          this.tempQuat.set(qx, qy, qz, qw).normalize();
          matrixSuccess = true;
        }
      } catch {
        matrixSuccess = false;
      }
    }

    // 5. Secondary: 3D Orthogonal Basis Vector Fallback from facial landmarks
    if (!matrixSuccess) {
      const chin = landmarks[LANDMARKS.CHIN];
      const forehead = landmarks[LANDMARKS.FOREHEAD_TOP];
      const noseTip = landmarks[LANDMARKS.NOSE_TIP];

      // Right vector: Vector connecting right eye to left eye
      const rZ = rightEye.z || 0;
      const lZ = leftEye.z || 0;
      this.rightVec.set(leftEye.x - rightEye.x, -(leftEye.y - rightEye.y), -(lZ - rZ)).normalize();

      // Up vector: Vector connecting chin to forehead
      const fZ = forehead ? forehead.z || 0 : 0;
      const cZ = chin ? chin.z || 0 : 0;
      if (forehead && chin) {
        this.upVec.set(forehead.x - chin.x, -(forehead.y - chin.y), -(fZ - cZ)).normalize();
      } else {
        this.upVec.set(0, 1, 0);
      }

      // Forward vector: Normal to the facial plane (Right cross Up)
      this.fwdVec.crossVectors(this.rightVec, this.upVec).normalize();
      // Re-orthogonalize Up vector
      this.upVec.crossVectors(this.fwdVec, this.rightVec).normalize();

      this.basisMatrix.makeBasis(this.rightVec, this.upVec, this.fwdVec);
      this.tempQuat.setFromRotationMatrix(this.basisMatrix).normalize();

      if (coordMapper.isMirrored()) {
        // Pure rotation mirror across YZ plane: invert Yaw and Roll, maintain Pitch
        this.tempQuat.set(
          this.tempQuat.x,
          -this.tempQuat.y,
          -this.tempQuat.z,
          this.tempQuat.w
        ).normalize();
      }
    }

    // Safety check: ensure all quaternion components are finite numbers
    if (
      !Number.isFinite(this.tempQuat.x) ||
      !Number.isFinite(this.tempQuat.y) ||
      !Number.isFinite(this.tempQuat.z) ||
      !Number.isFinite(this.tempQuat.w) ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y) ||
      !Number.isFinite(position.z)
    ) {
      return null;
    }

    // Derive Euler angles from the normalized quaternion for diagnostics
    this.tempEuler.setFromQuaternion(this.tempQuat, "YXZ");

    return {
      position,
      rotation: {
        pitch: this.tempEuler.x,
        yaw: this.tempEuler.y,
        roll: this.tempEuler.z,
      },
      quaternion: {
        x: this.tempQuat.x,
        y: this.tempQuat.y,
        z: this.tempQuat.z,
        w: this.tempQuat.w,
      },
      eyeDistance: interEyeDist,
      scale: baseScale,
    };
  }
}
