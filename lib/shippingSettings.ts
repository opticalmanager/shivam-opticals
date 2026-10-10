import { query } from "@/lib/adminDb";

export interface PackageDimensions {
  length: number; // cm
  breadth: number; // cm
  height: number; // cm
}

export interface ShippingConfig {
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  defaultCarrier: string;
  supportedCarriers: string[];
  enableWhiteGloveHomeTrial: boolean;
  trialDepositAmount: number;

  // Shiprocket Logistics Credentials & Pickup Location
  shiprocketEmail: string;
  shiprocketPassword: string;
  shiprocketPickupLocation: string;
  shiprocketPickupAddress: string;
  shiprocketPickupCity: string;
  shiprocketPickupState: string;
  shiprocketPickupPincode: string;
  shiprocketWebhookSecret: string;

  // Industrial Fulfillment Workflow
  fulfillmentMode: "manual_1click" | "auto_dispatch" | "hybrid";
  defaultWeightKg: number;
  packageDimensions: PackageDimensions;

  // In-memory or persisted Shiprocket JWT cache
  shiprocketToken?: string;
  shiprocketTokenExpiresAt?: number;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeShippingThreshold: 1999,
  standardShippingFee: 150,
  expressShippingFee: 350,
  defaultCarrier: "BlueDart Express",
  supportedCarriers: ["BlueDart Express", "Delhivery Air", "DTDC Air", "Shadowfax"],
  enableWhiteGloveHomeTrial: true,
  trialDepositAmount: 3000,

  shiprocketEmail: process.env.SHIPROCKET_EMAIL || "service.viralnest@gmail.com",
  shiprocketPassword: process.env.SHIPROCKET_PASSWORD || "ou6wb4ob*JiuAl6zW5^KM7DWX*Ln#wpx",
  shiprocketPickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "work",
  shiprocketPickupAddress:
    process.env.SHIPROCKET_PICKUP_ADDRESS ||
    "Shivam Optics Atelier, Main Market",
  shiprocketPickupCity: process.env.SHIPROCKET_PICKUP_CITY || "Delhi",
  shiprocketPickupState: process.env.SHIPROCKET_PICKUP_STATE || "Delhi",
  shiprocketPickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || "110001",
  shiprocketWebhookSecret: process.env.SHIPROCKET_WEBHOOK_SECRET || "shivam_shiprocket_sec_2026",

  fulfillmentMode: "manual_1click",
  defaultWeightKg: 0.35, // Typical luxury eyeglass frame + protective case + microfiber cloth
  packageDimensions: {
    length: 18,
    breadth: 12,
    height: 8,
  },
};

let cachedConfig: ShippingConfig | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

/**
 * Retrieves the Shipping and Shiprocket Logistics configuration.
 * Reads from `public.admin_settings` (key = 'shipping') with env fallback.
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const res = await query(
      `SELECT value FROM public.admin_settings WHERE key = 'shipping' LIMIT 1;`
    );

    if (res.rows.length > 0 && res.rows[0].value) {
      const raw = res.rows[0].value;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

      cachedConfig = {
        freeShippingThreshold: Number(parsed.freeShippingThreshold ?? DEFAULT_SHIPPING_CONFIG.freeShippingThreshold),
        standardShippingFee: Number(parsed.standardShippingFee ?? DEFAULT_SHIPPING_CONFIG.standardShippingFee),
        expressShippingFee: Number(parsed.expressShippingFee ?? DEFAULT_SHIPPING_CONFIG.expressShippingFee),
        defaultCarrier: parsed.defaultCarrier || DEFAULT_SHIPPING_CONFIG.defaultCarrier,
        supportedCarriers: Array.isArray(parsed.supportedCarriers)
          ? parsed.supportedCarriers
          : DEFAULT_SHIPPING_CONFIG.supportedCarriers,
        enableWhiteGloveHomeTrial: parsed.enableWhiteGloveHomeTrial ?? DEFAULT_SHIPPING_CONFIG.enableWhiteGloveHomeTrial,
        trialDepositAmount: Number(parsed.trialDepositAmount ?? DEFAULT_SHIPPING_CONFIG.trialDepositAmount),

        shiprocketEmail: parsed.shiprocketEmail || DEFAULT_SHIPPING_CONFIG.shiprocketEmail,
        shiprocketPassword: parsed.shiprocketPassword || DEFAULT_SHIPPING_CONFIG.shiprocketPassword,
        shiprocketPickupLocation: parsed.shiprocketPickupLocation || DEFAULT_SHIPPING_CONFIG.shiprocketPickupLocation,
        shiprocketPickupAddress:
          parsed.shiprocketPickupAddress || DEFAULT_SHIPPING_CONFIG.shiprocketPickupAddress,
        shiprocketPickupCity: parsed.shiprocketPickupCity || DEFAULT_SHIPPING_CONFIG.shiprocketPickupCity,
        shiprocketPickupState: parsed.shiprocketPickupState || DEFAULT_SHIPPING_CONFIG.shiprocketPickupState,
        shiprocketPickupPincode: parsed.shiprocketPickupPincode || DEFAULT_SHIPPING_CONFIG.shiprocketPickupPincode,
        shiprocketWebhookSecret: parsed.shiprocketWebhookSecret || DEFAULT_SHIPPING_CONFIG.shiprocketWebhookSecret,

        fulfillmentMode: parsed.fulfillmentMode || DEFAULT_SHIPPING_CONFIG.fulfillmentMode,
        defaultWeightKg: Number(parsed.defaultWeightKg ?? DEFAULT_SHIPPING_CONFIG.defaultWeightKg),
        packageDimensions: parsed.packageDimensions || DEFAULT_SHIPPING_CONFIG.packageDimensions,

        shiprocketToken: parsed.shiprocketToken,
        shiprocketTokenExpiresAt: parsed.shiprocketTokenExpiresAt,
      };
      lastFetchTime = now;
      return cachedConfig;
    }
  } catch (error) {
    console.warn("[SHIPPING-SETTINGS] Error loading config from database, using fallback:", error);
  }

  return DEFAULT_SHIPPING_CONFIG;
}

/**
 * Updates Shiprocket cached token in memory and persists to database if requested
 */
export function setCachedShiprocketToken(token: string, expiresInDays = 9): void {
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  if (cachedConfig) {
    cachedConfig.shiprocketToken = token;
    cachedConfig.shiprocketTokenExpiresAt = expiresAt;
  }
}

export function invalidateShippingConfig(): void {
  cachedConfig = null;
  lastFetchTime = 0;
}
