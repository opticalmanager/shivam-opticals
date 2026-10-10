import * as THREE from "three";

/**
 * LightingManager
 * Balanced 3-point AR lighting setup with subtle color temperatures and catchlights.
 */
export class LightingManager {
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private envTexture: THREE.WebGLRenderTarget | null = null;

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    // 1. Natural, subtle ambient fill light to maintain deep contrast and true frame tones
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(this.ambientLight);

    // 2. Main Key Directional Light (angled from top-front)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.75);
    this.keyLight.position.set(0.5, 1.2, 1.0);
    scene.add(this.keyLight);

    // 3. Soft Cool Fill Light (balances frame contrast without blowing highlights)
    this.fillLight = new THREE.DirectionalLight(0xf0f4f8, 0.35);
    this.fillLight.position.set(-0.6, 0.5, 0.8);
    scene.add(this.fillLight);

    // 4. Subtle Rim Highlight (creates definition along frame temples)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.25);
    this.rimLight.position.set(0, -0.8, -0.5);
    scene.add(this.rimLight);

    // 5. Generate lightweight synthetic PMREM environment map for realistic PBR reflections
    if (renderer) {
      try {
        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();

        const envScene = new THREE.Scene();
        // Calibrated subtle IBL reflections that don't wash out base color
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.45);
        envScene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight.position.set(1, 2, 1);
        envScene.add(dirLight);

        this.envTexture = this.pmremGenerator.fromScene(envScene);
        scene.environment = this.envTexture.texture;
      } catch (err) {
        console.warn("LightingManager: Failed to generate PMREM environment map:", err);
      }
    }
  }

  /**
   * Adapts lighting intensity if room is darker or brighter
   */
  public adaptToBrightness(luminance: number): void {
    // Clamp luminance between 0.2 and 1.0
    const factor = Math.max(0.4, Math.min(1.4, luminance / 128.0));
    this.ambientLight.intensity = 0.4 * factor;
    this.keyLight.intensity = 0.75 * factor;
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.ambientLight);
    scene.remove(this.keyLight);
    scene.remove(this.fillLight);
    scene.remove(this.rimLight);
    this.ambientLight.dispose();
    this.keyLight.dispose();
    this.fillLight.dispose();
    this.rimLight.dispose();

    if (this.envTexture) {
      scene.environment = null;
      this.envTexture.dispose();
      this.envTexture = null;
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
  }
}
