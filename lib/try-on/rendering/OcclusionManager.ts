import * as THREE from "three";

/**
 * OcclusionManager
 * Renders an invisible 3D facial proxy mesh into the depth buffer (colorWrite: false, depthWrite: true).
 * Ensures glasses temples and nose pads clip naturally behind human facial contours.
 */
export class OcclusionManager {
  private occluderGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private noseMesh: THREE.Mesh;
  private depthMaterial: THREE.MeshBasicMaterial;
  private debugMaterial: THREE.MeshBasicMaterial;
  private isDebug = false;

  constructor(scene: THREE.Scene) {
    this.occluderGroup = new THREE.Group();
    this.occluderGroup.renderOrder = 0; // Rendered BEFORE glasses (renderOrder 1+)

    // Material that writes depth but NO color
    this.depthMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
    });

    // Visible semi-transparent cyan wireframe for developer diagnostics
    this.debugMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    // 1. Head shape (ellipsoid matching cranium and temples behind ears)
    // Placed behind the front face plane so it occludes temples wrapping around the head
    // but NEVER clips the front eyewear bridge, rims, or lenses.
    const headGeom = new THREE.SphereGeometry(0.082, 24, 16);
    headGeom.scale(1.0, 1.25, 1.1);
    this.headMesh = new THREE.Mesh(headGeom, this.depthMaterial);
    this.headMesh.position.set(0, -0.02, -0.11);
    this.occluderGroup.add(this.headMesh);

    // 2. Subtle nose bridge support (recessed behind eyewear bridge)
    const noseGeom = new THREE.ConeGeometry(0.015, 0.04, 4);
    noseGeom.rotateX(Math.PI / 4.5);
    this.noseMesh = new THREE.Mesh(noseGeom, this.depthMaterial);
    this.noseMesh.position.set(0, -0.025, -0.025);
    this.occluderGroup.add(this.noseMesh);

    scene.add(this.occluderGroup);
  }

  /**
   * Updates occluder transform to match face pose using Quaternion orientation
   */
  public updatePoseQuaternion(
    position: { x: number; y: number; z: number },
    quaternion: { x: number; y: number; z: number; w: number },
    scale: number
  ): void {
    this.occluderGroup.position.set(position.x, position.y, position.z);
    this.occluderGroup.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    this.occluderGroup.scale.set(scale, scale, scale);
  }

  /**
   * Updates occluder transform to match face pose using Euler angles (fallback)
   */
  public updatePose(
    position: { x: number; y: number; z: number },
    rotation: { pitch: number; yaw: number; roll: number },
    scale: number
  ): void {
    this.occluderGroup.position.set(position.x, position.y, position.z);
    this.occluderGroup.rotation.set(rotation.pitch, rotation.yaw, rotation.roll, "YXZ");
    this.occluderGroup.scale.set(scale, scale, scale);
  }

  /**
   * Toggle visual wireframe for developer debugging
   */
  public setDebug(debug: boolean): void {
    this.isDebug = debug;
    const mat = debug ? this.debugMaterial : this.depthMaterial;
    this.headMesh.material = mat;
    this.noseMesh.material = mat;
  }

  public setVisible(visible: boolean): void {
    this.occluderGroup.visible = visible;
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.occluderGroup);
    this.headMesh.geometry.dispose();
    this.noseMesh.geometry.dispose();
    this.depthMaterial.dispose();
    this.debugMaterial.dispose();
  }
}
