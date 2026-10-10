/**
 * Precision Optics - SMS Gateway Client (Fast2SMS Bulk V2)
 * Delivers transactional authentication OTPs via Fast2SMS when WhatsApp is unavailable
 * or when explicitly requested by the patron.
 * 
 * Supports:
 * 1. Quick OTP Route (route: "otp") - Instant delivery with zero DLT setup.
 * 2. Enterprise DLT Route (route: "dlt") - TRAI DLT approved headers & templates.
 */

import { getWhatsAppAuthConfig } from "./authSettings";
import { normalizePhoneNumber } from "./phoneUtils";

export interface SendSmsOtpResult {
  success: boolean;
  messageId?: string;
  isSimulated?: boolean;
  error?: string;
  routeUsed?: "otp" | "dlt";
}

export interface Fast2SmsWalletResult {
  success: boolean;
  wallet?: number;
  smsCount?: number;
  error?: string;
}

/**
 * Checks the live wallet balance and remaining SMS credits from Fast2SMS.
 * GET https://www.fast2sms.com/dev/wallet
 */
export async function checkFast2SmsWallet(explicitApiKey?: string): Promise<Fast2SmsWalletResult> {
  const config = await getWhatsAppAuthConfig();
  const apiKey = (explicitApiKey || config.fast2smsApiKey || process.env.FAST2SMS_API_KEY || "").trim();

  if (!apiKey) {
    return {
      success: false,
      error: "Fast2SMS API Key is not configured",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch("https://www.fast2sms.com/dev/wallet", {
      method: "GET",
      headers: {
        authorization: apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.return === false) {
      return {
        success: false,
        error: data?.message || `HTTP ${res.status} from Fast2SMS Wallet API`,
      };
    }

    return {
      success: true,
      wallet: parseFloat(data.wallet || "0"),
      smsCount: parseInt(data.sms_count || "0", 10),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err?.message || "Failed to reach Fast2SMS Wallet API",
    };
  }
}

/**
 * Dispatches an authentication OTP via Fast2SMS Bulk V2 API:
 * POST https://www.fast2sms.com/dev/bulkV2
 */
export async function sendSmsOtp(phone: string, otpCode: string): Promise<SendSmsOtpResult> {
  const config = await getWhatsAppAuthConfig();

  if (!config.smsFallbackEnabled) {
    return {
      success: false,
      error: "SMS OTP fallback is currently disabled by administrator",
    };
  }

  const normalized = normalizePhoneNumber(phone);
  if (!normalized.isValid) {
    return {
      success: false,
      error: normalized.error || "Invalid mobile number for SMS",
    };
  }

  const apiKey = (config.fast2smsApiKey || process.env.FAST2SMS_API_KEY || "").trim();

  // If Fast2SMS credentials are not configured, provide safe development simulation
  if (!apiKey) {
    console.info(
      `[SMS-GATEWAY-DEV] FAST2SMS_API_KEY is not configured. Simulating SMS OTP delivery to ${normalized.e164}. Code: ${otpCode}`
    );
    return {
      success: true,
      messageId: `sim-fast2sms-${Date.now()}`,
      isSimulated: true,
      routeUsed: "otp",
    };
  }

  // Fast2SMS requires 10-digit Indian national phone number: e.g. "9810012345"
  const national10DigitNumber = normalized.national;

  // Determine routing: DLT if sender_id & template_id are provided, otherwise Quick OTP route
  const wantsDlt = config.fast2smsRoute === "dlt";
  const hasDltDetails = Boolean(config.fast2smsSenderId?.trim() && config.fast2smsTemplateId?.trim());
  const useDlt = wantsDlt && hasDltDetails;

  const payload: Record<string, any> = useDlt
    ? {
        route: "dlt",
        sender_id: config.fast2smsSenderId.trim(),
        message: config.fast2smsTemplateId.trim(),
        variables_values: otpCode,
        numbers: national10DigitNumber,
      }
    : {
        route: "otp",
        variables_values: otpCode,
        numbers: national10DigitNumber,
      };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    // Fast2SMS response shape:
    // Success: { "return": true, "request_id": "...", "message": ["SMS sent successfully."] }
    // Failure: { "return": false, "status_code": 411, "message": "..." }
    if (!res.ok || !data || data.return !== true) {
      const errMsg = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || `HTTP ${res.status} from Fast2SMS`;

      console.warn(`[SMS-GATEWAY] Fast2SMS delivery failed for ${normalized.e164}:`, errMsg);
      return {
        success: false,
        error: errMsg,
        routeUsed: useDlt ? "dlt" : "otp",
      };
    }

    console.info(
      `[SMS-GATEWAY] Fast2SMS OTP delivered successfully to ${normalized.e164} via route=${useDlt ? "dlt" : "otp"} (request_id: ${data.request_id})`
    );

    return {
      success: true,
      messageId: data.request_id || `fast2sms-${Date.now()}`,
      routeUsed: useDlt ? "dlt" : "otp",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[SMS-GATEWAY] Network error connecting to Fast2SMS:`, err?.message);
    return {
      success: false,
      error: err?.message || "Failed to connect to SMS gateway",
      routeUsed: useDlt ? "dlt" : "otp",
    };
  }
}
