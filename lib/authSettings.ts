import { query } from "@/lib/adminDb";

export interface WhatsAppAuthConfig {
  wacrmApiUrl: string;
  wacrmApiKey: string;
  templateName: string;
  templateLanguage: string;
  whatsappEnabled: boolean;
  smsFallbackEnabled: boolean;
  // Fast2SMS Gateway Configuration
  fast2smsApiKey: string;
  fast2smsRoute: "otp" | "dlt";
  fast2smsSenderId: string;
  fast2smsTemplateId: string;
  // Legacy MSG91 fields kept for backwards-compatibility
  msg91AuthKey?: string;
  msg91TemplateId?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
}

const DEFAULT_AUTH_CONFIG: WhatsAppAuthConfig = {
  wacrmApiUrl: process.env.WACRM_API_URL || "https://broadcast.opticalmanager.in",
  wacrmApiKey: process.env.WACRM_API_KEY || "wacrm_live_irqKga1W1Z_6U9Rhh_OOGN-FQ91kRqO-GaLgZulu7to",
  templateName: "wa_otp",
  templateLanguage: "en_US",
  whatsappEnabled: true,
  smsFallbackEnabled: true,
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || "6bnxOW40vwCaHNIXuR2KdlSYq8pk1MJto5LeBDrPZ7GQ3cFyhz3i4WMem0lqVKJdvGp7YyaCb2ro8wzh",
  fast2smsRoute: (process.env.FAST2SMS_ROUTE as "otp" | "dlt") || "otp",
  fast2smsSenderId: process.env.FAST2SMS_SENDER_ID || "",
  fast2smsTemplateId: process.env.FAST2SMS_TEMPLATE_ID || "",
  msg91AuthKey: process.env.MSG91_AUTH_KEY || "",
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || "",
  metaPhoneNumberId: "1319587451232385",
  metaAccessToken: "",
};

let cachedConfig: WhatsAppAuthConfig | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

/**
 * Retrieves the WhatsApp Auth & Fast2SMS Fallback configuration.
 * Prioritizes the database setting (public.admin_settings where key = 'whatsapp_auth')
 * so that administrators can view/update keys directly through the Admin UI.
 */
export async function getWhatsAppAuthConfig(): Promise<WhatsAppAuthConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const res = await query(
      `SELECT value FROM public.admin_settings WHERE key = 'whatsapp_auth' LIMIT 1;`
    );

    if (res.rows.length > 0 && res.rows[0].value) {
      const raw = res.rows[0].value;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      cachedConfig = {
        wacrmApiUrl: parsed.wacrmApiUrl || DEFAULT_AUTH_CONFIG.wacrmApiUrl,
        wacrmApiKey: parsed.wacrmApiKey || DEFAULT_AUTH_CONFIG.wacrmApiKey,
        templateName: parsed.templateName || DEFAULT_AUTH_CONFIG.templateName,
        templateLanguage: parsed.templateLanguage || DEFAULT_AUTH_CONFIG.templateLanguage,
        whatsappEnabled: parsed.whatsappEnabled ?? DEFAULT_AUTH_CONFIG.whatsappEnabled,
        smsFallbackEnabled: parsed.smsFallbackEnabled ?? DEFAULT_AUTH_CONFIG.smsFallbackEnabled,
        fast2smsApiKey: parsed.fast2smsApiKey || DEFAULT_AUTH_CONFIG.fast2smsApiKey,
        fast2smsRoute: parsed.fast2smsRoute || DEFAULT_AUTH_CONFIG.fast2smsRoute,
        fast2smsSenderId: parsed.fast2smsSenderId || DEFAULT_AUTH_CONFIG.fast2smsSenderId,
        fast2smsTemplateId: parsed.fast2smsTemplateId || DEFAULT_AUTH_CONFIG.fast2smsTemplateId,
        msg91AuthKey: parsed.msg91AuthKey || DEFAULT_AUTH_CONFIG.msg91AuthKey,
        msg91TemplateId: parsed.msg91TemplateId || DEFAULT_AUTH_CONFIG.msg91TemplateId,
        metaPhoneNumberId: parsed.metaPhoneNumberId || DEFAULT_AUTH_CONFIG.metaPhoneNumberId,
        metaAccessToken: parsed.metaAccessToken || DEFAULT_AUTH_CONFIG.metaAccessToken,
      };
      lastFetchTime = now;
      return cachedConfig;
    }
  } catch (error) {
    console.warn("[AUTH-SETTINGS] Error loading config from database, using fallback:", error);
  }

  return DEFAULT_AUTH_CONFIG;
}

export function invalidateWhatsAppAuthConfig(): void {
  cachedConfig = null;
  lastFetchTime = 0;
}
