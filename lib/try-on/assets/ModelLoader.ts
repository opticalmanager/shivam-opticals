import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ModelCache } from "./ModelCache";

export interface ModelInspectionData {
  rawWidthMm: number;
  rawHeightMm: number;
  rawDepthMm: number;
  normalizedWidthMm: number;
  normalizedHeightMm: number;
  normalizedDepthMm: number;
  autoScaleFactor: number;
  bridgeContactOffsetZ: number;
  meshCount: number;
  vertexCount: number;
}

/**
 * GLTFMaterialsPbrSpecularGlossinessExtension
 * Restores full PBR support for legacy / Khronos SpecularGlossiness glTF models
 * (common in Sketchfab, Blender, and optical manufacturer CAD exports).
 * Fixes washed-out / pure white fallback materials by converting diffuseFactor,
 * diffuseTexture, and glossiness to MeshStandardMaterial parameters.
 */
class GLTFMaterialsPbrSpecularGlossinessExtension {
  public name = "KHR_materials_pbrSpecularGlossiness";
  public parser: any;

  constructor(parser: any) {
    this.parser = parser;
  }

  public extendMaterialParams(materialIndex: number, materialParams: any) {
    const parser = this.parser;
    const materialDef = parser.json.materials?.[materialIndex];
    if (!materialDef || !materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const ext = materialDef.extensions[this.name];
    const pending: Promise<any>[] = [];

    // 1. diffuseFactor -> baseColor and opacity
    if (Array.isArray(ext.diffuseFactor)) {
      materialParams.color = new THREE.Color().setRGB(
        ext.diffuseFactor[0],
        ext.diffuseFactor[1],
        ext.diffuseFactor[2],
        THREE.LinearSRGBColorSpace
      );
      materialParams.opacity = ext.diffuseFactor[3] !== undefined ? ext.diffuseFactor[3] : 1.0;
      if (materialParams.opacity < 0.99) {
        materialParams.transparent = true;
      }
    }

    // 2. diffuseTexture -> map
    if (ext.diffuseTexture !== undefined) {
      pending.push(
        parser.assignTexture(materialParams, "map", ext.diffuseTexture, THREE.SRGBColorSpace)
      );
    }

    // 3. glossinessFactor -> roughness (roughness = 1.0 - glossiness)
    const gloss = ext.glossinessFactor !== undefined ? ext.glossinessFactor : 0.8;
    materialParams.roughness = Math.max(0.04, Math.min(1.0, 1.0 - gloss));

    // 4. specularFactor -> metalness
    const matName = (materialDef.name || "").toLowerCase();
    const isGlassMaterial =
      matName.includes("glass") ||
      matName.includes("lens") ||
      matName.includes("optic") ||
      matName.includes("cristal") ||
      matName.includes("verre");

    if (isGlassMaterial) {
      materialParams.metalness = 0.0;
    } else if (Array.isArray(ext.specularFactor)) {
      const maxSpec = Math.max(ext.specularFactor[0], ext.specularFactor[1], ext.specularFactor[2]);
      const maxDiff = Array.isArray(ext.diffuseFactor)
        ? Math.max(ext.diffuseFactor[0], ext.diffuseFactor[1], ext.diffuseFactor[2])
        : 0.5;

      if (maxSpec > 0.6 && maxDiff < 0.25) {
        materialParams.metalness = 0.85; // Metallic frame / hinges
      } else if (maxSpec > 0.4) {
        materialParams.metalness = 0.35; // Polished acetate / horn
      } else {
        materialParams.metalness = 0.05; // Matte plastic / acetate
      }
    } else {
      materialParams.metalness = 0.1;
    }

    return Promise.all(pending);
  }
}

export class ModelLoader {
  private static gltfLoader: GLTFLoader | null = null;
  private static dracoLoader: DRACOLoader | null = null;

  private static getLoader(): GLTFLoader {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
      this.gltfLoader.register((parser) => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));
    }
    return this.gltfLoader;
  }

  /**
   * Loads a GLB/GLTF model from URL with LRU caching and geometric normalization
   */
  public static async load(url: string): Promise<THREE.Group> {
    const cache = ModelCache.getInstance();
    const cached = cache.get(url);
    if (cached) {
      return cached.clone(true);
    }

    // Auto-proxy remote URLs (R2 or HTTP/HTTPS) to bypass CORS and ensure 100% reliable streaming
    let finalUrl = url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      finalUrl = `/api/upload?url=${encodeURIComponent(url)}`;
    }

    const loader = this.getLoader();

    return new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        finalUrl,
        (gltf) => {
          const rawScene = gltf.scene;
          const normalized = this.normalizeModel(rawScene);
          cache.set(url, normalized);
          resolve(normalized.clone(true));
        },
        undefined,
        (err) => {
          console.error(`Failed to load 3D eyewear model from ${finalUrl}:`, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Centers the model pivot precisely at the nasal bridge contact point,
   * auto-orients to standard eyewear coordinate basis (+X user right, +Y up, +Z front, -Z temples into face),
   * and preserves authentic physical materials.
   */
  public static normalizeModel(rawObject: THREE.Object3D): THREE.Group {
    const root = new THREE.Group();
    root.name = "EyewearRoot";

    // 1. Calculate unscaled bounds & inspect geometry
    const initialBox = new THREE.Box3().setFromObject(rawObject);
    const initialSize = initialBox.getSize(new THREE.Vector3());

    let meshCount = 0;
    let vertexCount = 0;
    rawObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        if (child.geometry && child.geometry.attributes.position) {
          vertexCount += child.geometry.attributes.position.count;
        }
      }
    });

    // 2. Uniformly scale to target standard adult eyewear width (0.140m / 140mm)
    const targetWidth = 0.14;
    let autoScale = 1.0;
    if (initialSize.x > 0.0001) {
      autoScale = targetWidth / initialSize.x;
      rawObject.scale.set(autoScale, autoScale, autoScale);
    }
    rawObject.updateMatrixWorld(true);

    // 3. Anatomical Orientation Detection:
    // Eyeglasses have a central connecting bridge between lenses at x ~ 0.
    // In standard +Z forward orientation, bridge vertices must reside at maximum Z,
    // with temples extending backwards towards minimum Z (-Z into face).
    const scaledBox = new THREE.Box3().setFromObject(rawObject);
    const center = scaledBox.getCenter(new THREE.Vector3());
    const size = scaledBox.getSize(new THREE.Vector3());
    const bridgeXThreshold = size.x * 0.18;

    let bridgeVertsZSum = 0;
    let bridgeVertCount = 0;

    rawObject.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const pos = child.geometry.attributes.position;
        if (pos) {
          const v = new THREE.Vector3();
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            child.localToWorld(v);
            if (Math.abs(v.x - center.x) < bridgeXThreshold) {
              bridgeVertsZSum += v.z;
              bridgeVertCount++;
            }
          }
        }
      }
    });

    const averageBridgeZ = bridgeVertCount > 0 ? bridgeVertsZSum / bridgeVertCount : center.z;

    // If the bridge is behind the bounding center, the model was authored facing backwards (-Z)
    if (averageBridgeZ < center.z) {
      rawObject.rotation.y += Math.PI;
      rawObject.updateMatrixWorld(true);
    }

    // 4. Align frame so nasal bridge contact point rests exactly at (0, 0, 0)
    const finalBox = new THREE.Box3().setFromObject(rawObject);
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const frontZ = finalBox.max.z;

    // Optical anatomical anchor:
    // The nasal bridge sits at ~65% of frame height (upper third of lenses, aligning pupils to lens optical centers).
    const bridgeY = finalBox.min.y + finalSize.y * 0.65;

    // Recess contact point 6mm behind the apex of the lens curve to rest naturally on the nose bridge skin
    const bridgeContactOffsetZ = Math.min(0.01, finalSize.z * 0.06);
    const bridgeZ = frontZ - bridgeContactOffsetZ;

    rawObject.position.set(-finalCenter.x, -bridgeY, -bridgeZ);

    // Attach developer inspection data to root
    const inspection: ModelInspectionData = {
      rawWidthMm: initialSize.x * 1000,
      rawHeightMm: initialSize.y * 1000,
      rawDepthMm: initialSize.z * 1000,
      normalizedWidthMm: finalSize.x * 1000,
      normalizedHeightMm: finalSize.y * 1000,
      normalizedDepthMm: finalSize.z * 1000,
      autoScaleFactor: autoScale,
      bridgeContactOffsetZ: bridgeContactOffsetZ * 1000,
      meshCount,
      vertexCount,
    };
    root.userData.inspection = inspection;

    // 5. Enhance materials for realism, safety, and double-sided visibility
    rawObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;

        const origMat = Array.isArray(child.material) ? child.material[0] : child.material;
        const meshName = (child.name || "").toLowerCase();
        const matName = (origMat?.name || "").toLowerCase();

        // 1. Strict exclusions: non-lens structural eyewear components
        const isExcludedFromLens =
          meshName.includes("frame") ||
          meshName.includes("temple") ||
          meshName.includes("arm") ||
          meshName.includes("bridge") ||
          meshName.includes("pad") ||
          meshName.includes("nose") ||
          meshName.includes("hinge") ||
          meshName.includes("rim") ||
          meshName.includes("screw") ||
          meshName.includes("base") ||
          meshName.includes("steel") ||
          meshName.includes("metal") ||
          meshName.includes("ear") ||
          meshName.includes("tip") ||
          meshName.includes("logo") ||
          matName.includes("frame") ||
          matName.includes("temple") ||
          matName.includes("arm") ||
          matName.includes("bridge") ||
          matName.includes("pad") ||
          matName.includes("nose") ||
          matName.includes("hinge") ||
          matName.includes("rim") ||
          matName.includes("screw") ||
          matName.includes("base") ||
          matName.includes("steel") ||
          matName.includes("metal") ||
          matName.includes("ear") ||
          matName.includes("tip") ||
          matName.includes("logo");

        // 2. Inclusions: explicit lens / glass nomenclature across multiple CAD conventions
        const hasLensKeyword =
          meshName.includes("lens") ||
          matName.includes("lens") ||
          meshName.includes("glass") ||
          matName.includes("glass") ||
          meshName.includes("optic") ||
          matName.includes("optic") ||
          meshName.includes("cristal") ||
          matName.includes("cristal") ||
          meshName.includes("verre") ||
          matName.includes("verre");

        const origTransmission =
          origMat && "transmission" in origMat && typeof (origMat as any).transmission === "number"
            ? (origMat as any).transmission
            : 0;

        const hasGlassPhysicalProps =
          origTransmission > 0.05 ||
          (origMat?.opacity !== undefined && origMat.opacity < 0.7 && !isExcludedFromLens);

        const isLens = !isExcludedFromLens && (hasLensKeyword || hasGlassPhysicalProps);

        if (isLens) {
          // Extract and preserve original tint color if present (e.g. aviator green, wayfarer tint)
          let lensColor = new THREE.Color(0xffffff);
          if (origMat && (origMat as any).color instanceof THREE.Color) {
            lensColor = (origMat as any).color.clone();
          }

          // In WebAR, the user's face and eyes are rendered in the webcam <video> element
          // directly underneath the transparent Three.js WebGL canvas.
          // For the user's eyes to be clearly visible through the lenses, the canvas must have
          // high alpha transparency (low opacity) at the lens coordinates:
          // - Clear optical prescription lenses: opacity ~0.14 - 0.16 (eyes 85%+ visible)
          // - Tinted sunglasses: opacity ~0.20 - 0.24 (subtle luxury tint, eyes clearly visible)
          const hsl = { h: 0, s: 0, l: 0 };
          lensColor.getHSL(hsl);
          let targetOpacity = hsl.l < 0.35 ? 0.22 : 0.15;

          // If author provided an explicit subtle tint opacity between 0.10 and 0.35, respect it
          if (origMat?.opacity && origMat.opacity >= 0.10 && origMat.opacity <= 0.35) {
            targetOpacity = origMat.opacity;
          }

          const lensMat = new THREE.MeshPhysicalMaterial({
            color: lensColor,
            transparent: true,
            opacity: targetOpacity,
            roughness: 0.06,
            metalness: 0.0, // Dielectric optical glass
            ior: 1.52, // Crown glass / CR-39 standard refractive index
            reflectivity: 0.5,
            clearcoat: 1.0, // Subtle surface reflection highlight
            clearcoatRoughness: 0.05,
            transmission: 0, // MUST remain 0 in WebAR transparent canvas so WebGL alpha blends with HTML video underneath
            depthWrite: false, // Never write to depth buffer to prevent z-fighting with face and eyes
            depthTest: true,
            side: THREE.DoubleSide,
          });

          lensMat.userData.origTransparent = true;
          lensMat.userData.origOpacity = targetOpacity;
          lensMat.userData.isLens = true;

          child.material = lensMat;
        } else if (child.material) {
          const applyMatProps = (mat: THREE.Material) => {
            mat.side = THREE.DoubleSide;
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              const isExplicitFrame =
                meshName.includes("frame") ||
                meshName.includes("temple") ||
                meshName.includes("steel") ||
                meshName.includes("base") ||
                meshName.includes("arm") ||
                meshName.includes("rim") ||
                meshName.includes("hinge");

              // Only force opaque if author intended it to be an opaque frame part (opacity >= 0.7 or named as frame/temple/base/steel)
              if (
                (mat.opacity >= 0.7 || isExplicitFrame) &&
                !('transmission' in mat && typeof (mat as any).transmission === 'number' && (mat as any).transmission > 0.1)
              ) {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              } else if (mat.opacity < 0.7) {
                // Intentionally translucent part (tinted side shields, silicone nose pads, lenses)
                mat.transparent = true;
                mat.depthWrite = false;
              }

              // Prevent extreme specular glare from washing out frame color
              if (mat.roughness !== undefined && mat.roughness < 0.12) {
                mat.roughness = 0.22;
              }
            }
            mat.userData.origTransparent = mat.transparent;
            mat.userData.origOpacity = mat.opacity;
            mat.needsUpdate = true;
          };

          if (Array.isArray(child.material)) {
            child.material.forEach(applyMatProps);
          } else {
            applyMatProps(child.material);
          }
        }
      }
    });

    root.add(rawObject);
    return root;
  }
}
