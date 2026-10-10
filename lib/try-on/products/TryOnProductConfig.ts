import { Product } from "@/types";
import { TryOnConfiguration } from "@/types/tryOn";

export const CANONICAL_FRAME_MODELS = {
  ROUND_RIMLESS: "/models/eyewear/cartier_rimless_round.glb",
  WAYFARER_BLACK: "/models/eyewear/fastrack_wayfarer_black.glb",
  AVIATOR_GOLD: "/models/eyewear/classic_aviator_gold.glb",
  RECTANGLE_TITANIUM: "/models/eyewear/rectangle_titanium_gold.glb",
  CATEYE_HAVANA: "/models/eyewear/cateye_luxury_havana.glb",
} as const;

/**
 * Checks if a product has a valid 3D model configured for Virtual Try-On
 */
export function hasTryOnModel(product: Product | null | undefined): boolean {
  if (!product) return false;
  if (!product.tryOnEnabled) return false;
  if (!product.tryOnModelUrl || typeof product.tryOnModelUrl !== "string") return false;

  const trimmed = product.tryOnModelUrl.trim();
  if (trimmed.length === 0) return false;

  // Strictly require a valid .glb or .gltf 3D asset file
  const cleanUrl = trimmed.toLowerCase().split("?")[0].split("#")[0];
  return cleanUrl.endsWith(".glb") || cleanUrl.endsWith(".gltf");
}

/**
 * Resolves the TryOnConfiguration for a product
 */
export function resolveProductTryOnConfig(product: Product): TryOnConfiguration {
  const modelUrl = product.tryOnModelUrl || CANONICAL_FRAME_MODELS.RECTANGLE_TITANIUM;

  const defaultConfig: TryOnConfiguration = {
    enabled: Boolean(product.tryOnEnabled),
    modelUrl,
    modelVersion: 1,
    calibrationVersion: 1,
    scaleMultiplier: 1.0,
    verticalOffset: -0.008,
    depthOffset: 0.015,
    pitchOffset: 0.02,
    yawOffset: 0.0,
    rollOffset: 0.0,
    frameWidth: product.specs?.frameWidth || 140,
    lensWidth: product.specs?.lensWidth || 53,
    bridgeWidth: product.specs?.bridgeWidth || 18,
    templeLength: product.specs?.templeLength || 145,
  };

  if (product.tryOnConfig) {
    return {
      ...defaultConfig,
      ...product.tryOnConfig,
      modelUrl: product.tryOnConfig.modelUrl || modelUrl,
    };
  }

  // Adjust default calibration based on shape
  if (product.shape === "round" || product.rimType === "rimless") {
    defaultConfig.scaleMultiplier = 1.02;
    defaultConfig.verticalOffset = -0.007;
    defaultConfig.depthOffset = 0.014;
  } else if (product.shape === "wayfarer" || product.shape === "square") {
    defaultConfig.scaleMultiplier = 1.05;
    defaultConfig.verticalOffset = -0.012;
    defaultConfig.depthOffset = 0.018;
  } else if (product.shape === "aviator") {
    defaultConfig.scaleMultiplier = 1.06;
    defaultConfig.verticalOffset = -0.014;
    defaultConfig.depthOffset = 0.016;
  }

  return defaultConfig;
}
