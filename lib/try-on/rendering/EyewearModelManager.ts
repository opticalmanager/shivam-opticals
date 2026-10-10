import * as THREE from "three";
import { ModelLoader } from "../assets/ModelLoader";

/**
 * EyewearModelManager
 * Manages active eyewear 3D hierarchy, hot-swapping models, smooth opacity transitions, and disposal.
 */
export class EyewearModelManager {
  private container: THREE.Group;
  private currentModel: THREE.Group | null = null;
  private currentModelUrl: string | null = null;
  private isLoading = false;

  constructor(scene: THREE.Scene) {
    this.container = new THREE.Group();
    this.container.renderOrder = 1; // Rendered AFTER occluder
    scene.add(this.container);
  }

  /**
   * Hot-swaps the active eyewear model with zero scene re-initialization
   */
  public async loadModel(url: string): Promise<boolean> {
    if (this.currentModelUrl === url && this.currentModel) {
      return true;
    }

    this.isLoading = true;
    this.currentModelUrl = url;

    try {
      const model = await ModelLoader.load(url);

      // Remove previous model
      if (this.currentModel) {
        this.container.remove(this.currentModel);
      }

      this.currentModel = model;
      this.container.add(model);
      this.isLoading = false;
      return true;
    } catch (err) {
      console.error(`EyewearModelManager failed to switch to model ${url}:`, err);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Updates 3D world transform of the eyewear frame using Quaternion orientation (avoids gimbal lock)
   */
  public updateTransformQuaternion(
    position: { x: number; y: number; z: number },
    quaternion: { x: number; y: number; z: number; w: number },
    scale: number
  ): void {
    this.container.position.set(position.x, position.y, position.z);
    this.container.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    this.container.scale.set(scale, scale, scale);
  }

  /**
   * Updates 3D world transform of the eyewear frame using Euler angles (fallback)
   */
  public updateTransform(
    position: { x: number; y: number; z: number },
    rotation: { pitch: number; yaw: number; roll: number },
    scale: number
  ): void {
    this.container.position.set(position.x, position.y, position.z);
    this.container.rotation.set(rotation.pitch, rotation.yaw, rotation.roll, "YXZ");
    this.container.scale.set(scale, scale, scale);
  }

  /**
   * Sets overall visibility / opacity for graceful tracking decay
   */
  public setOpacity(opacity: number): void {
    if (!this.currentModel) return;

    if (opacity <= 0.001) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;

    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const updateMat = (m: THREE.Material) => {
          if (opacity >= 0.999) {
            // Restore pristine original material parameters
            m.transparent = m.userData.origTransparent ?? false;
            m.opacity = m.userData.origOpacity ?? 1.0;
          } else {
            m.transparent = true;
            m.opacity = (m.userData.origOpacity ?? 1.0) * opacity;
          }
          m.needsUpdate = true;
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(updateMat);
        } else {
          updateMat(child.material);
        }
      }
    });
  }

  /**
   * Retrieves inspection metadata for the currently active frame
   */
  public getInspectionData(): import("../assets/ModelLoader").ModelInspectionData | null {
    return this.currentModel?.userData?.inspection ?? null;
  }

  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  public getContainer(): THREE.Group {
    return this.container;
  }

  public dispose(scene: THREE.Scene): void {
    if (this.currentModel) {
      this.container.remove(this.currentModel);
      this.currentModel = null;
    }
    scene.remove(this.container);
  }
}
