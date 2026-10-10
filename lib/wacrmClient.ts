/**
 * Precision Optics - WACRM WhatsApp Integration Client
 * Delivers transactional authentication OTPs via the companion WACRM system
 * using the official Meta WhatsApp Cloud API and the approved 'wa_otp' template.
 */

import { getWhatsAppAuthConfig } from "./authSettings";

export interface SendWhatsAppOtpResult {
  success: boolean;
  messageId?: string;
  whatsappMessageId?: string;
  error?: string;
  isNetworkError?: boolean;
}

/**
 * Dispatches an authentication OTP via WACRM's public API endpoint:
 * POST /api/v1/messages
 * 
 * Injects the Meta-approved 'wa_otp' authentication template:
 * - Body: *{{1}}* is your verification code. For your security, do not share this code.
 * - One-Tap Button: Copy code (coupon_code / copy_code parameter)
 */
export async function sendWhatsAppOtp(e164Phone: string, otpCode: string): Promise<SendWhatsAppOtpResult> {
  const config = await getWhatsAppAuthConfig();

  if (!config.whatsappEnabled) {
    return {
      success: false,
      error: "WhatsApp OTP channel is currently disabled by administrator",
    };
  }

  const apiUrl = (config.wacrmApiUrl || "https://broadcast.opticalmanager.in").replace(/\/+$/, "");
  const apiKey = config.wacrmApiKey?.trim();

  if (!apiKey) {
    return {
      success: false,
      error: "WACRM API Key is not configured. Please set in Admin Settings -> WhatsApp & Auth OTP.",
    };
  }

  const endpoint = `${apiUrl}/api/v1/messages`;

  const payload = {
    to: e164Phone,
    type: "template",
    template: {
      name: config.templateName || "wa_otp",
      language: config.templateLanguage || "en_US",
      params: {
        body: [otpCode],
        buttonParams: {
          "0": otpCode,
        },
      },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second circuit-breaker

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP ${res.status} from WACRM`;
      console.warn(`[WACRM-CLIENT] Failed to send WhatsApp OTP to ${e164Phone}:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    const messageData = data?.data;
    return {
      success: true,
      messageId: messageData?.message_id,
      whatsappMessageId: messageData?.whatsapp_message_id,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === "AbortError";
    const errorMsg = isTimeout ? "WACRM request timed out after 8s" : (err?.message || "Connection refused to WACRM");
    console.warn(`[WACRM-CLIENT] Network error reaching WACRM at ${apiUrl}: ${errorMsg}. Attempting direct Meta Cloud API dispatch...`);

    // Resilient Fallback: If WACRM local server is offline, dispatch directly via Meta WhatsApp Cloud API
    if (config.metaAccessToken && config.metaPhoneNumberId) {
      try {
        const metaRes = await sendDirectMetaOtp(
          config.metaPhoneNumberId,
          config.metaAccessToken,
          e164Phone,
          otpCode,
          config.templateName || "wa_otp",
          config.templateLanguage || "en_US"
        );
        if (metaRes.success) {
          console.info(`[WACRM-CLIENT] Direct Meta Cloud API fallback successful for ${e164Phone}`);
          return metaRes;
        }
      } catch (metaErr: any) {
        console.error(`[WACRM-CLIENT] Direct Meta Cloud API fallback error:`, metaErr?.message || metaErr);
      }
    }

    return {
      success: false,
      error: errorMsg,
      isNetworkError: true,
    };
  }
}

/**
 * Direct Meta WhatsApp Cloud API fallback dispatch helper
 */
async function sendDirectMetaOtp(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  otpCode: string,
  templateName: string,
  languageCode: string
): Promise<SendWhatsAppOtpResult> {
  const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otpCode }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otpCode }],
        },
      ],
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      const errMsg = data?.error?.message || `HTTP ${res.status} from Meta Cloud API`;
      console.warn(`[META-CLOUD-API] Failed direct WhatsApp dispatch:`, errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return {
      success: true,
      whatsappMessageId: messageId,
      messageId,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { success: false, error: err?.message || "Direct Meta API dispatch failed", isNetworkError: true };
  }
}
