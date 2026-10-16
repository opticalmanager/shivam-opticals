/**
 * Shivam Opticals - Enterprise Admin Authentication & Session Security Engine
 * Cryptographically signed HttpOnly session tokens with Edge and Node.js compatibility.
 */

import { query } from "@/lib/db";

export const ALLOWED_ADMIN_EMAIL = "shivamoptical999@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "shivamstore@2026";
export const ADMIN_COOKIE_NAME = "shivam_admin_session";

// Secret key for HMAC signing, fallback to secure environment default
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "shivam_optics_super_secret_admin_atelier_jwt_hmac_2026_key";

/**
 * Creates an HMAC-SHA256 signature using universal Web Crypto API.
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AdminSessionPayload {
  email: string;
  role: "super_admin";
  rememberMe: boolean;
  iat: number;
  exp: number;
}

/**
 * Generates a tamper-proof cryptographically signed session token.
 * Default expiration: 30 days if rememberMe, otherwise 1 day (24 hours).
 */
export async function createAdminSessionToken(
  email: string,
  rememberMe: boolean = true
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const durationSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days vs 1 day
  const exp = now + durationSeconds;

  const payload: AdminSessionPayload = {
    email: normalizedEmail,
    role: "super_admin",
    rememberMe,
    iat: now,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = await hmacSha256(payloadB64, SESSION_SECRET);

  return `${payloadB64}.${signature}`;
}

/**
 * Validates a signed session token.
 * Returns payload if signature and expiration are valid and email matches ALLOWED_ADMIN_EMAIL.
 */
export async function verifyAdminSessionToken(
  token: string | null | undefined
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  try {
    const [payloadB64, providedSignature] = token.split(".");
    if (!payloadB64 || !providedSignature) return null;

    const expectedSignature = await hmacSha256(payloadB64, SESSION_SECRET);
    if (providedSignature !== expectedSignature) {
      console.warn("[ADMIN-AUTH] Invalid session signature detected");
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("[ADMIN-AUTH] Expired session token");
      return null;
    }

    // Strictly enforce authorized admin email
    if (payload.email?.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      console.warn(`[ADMIN-AUTH] Unauthorized email in token: ${payload.email}`);
      return null;
    }

    return payload;
  } catch (err) {
    console.error("[ADMIN-AUTH] Error verifying session token:", err);
    return null;
  }
}

/**
 * Validates admin credentials against PostgreSQL `admin_settings` or system fallback.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Strict check on authorized email
  if (normalizedEmail !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: "Access Denied: This email is not authorized for administrative access.",
    };
  }

  let expectedPassword = DEFAULT_ADMIN_PASSWORD;

  // Check database settings for custom password override
  try {
    const res = await query(
      `SELECT value FROM public.admin_settings WHERE key = 'admin_auth' LIMIT 1;`
    );
    if (res.rows.length > 0) {
      let val = res.rows[0].value;
      if (typeof val === "string") {
        try {
          val = JSON.parse(val);
        } catch {}
      }
      if (val?.password) {
        expectedPassword = val.password;
      }
    }
  } catch (dbErr) {
    console.warn("[ADMIN-AUTH] Database settings query fallback:", dbErr);
  }

  if (password !== expectedPassword) {
    return {
      success: false,
      error: "Invalid administrator password. Please check your credentials.",
    };
  }

  return { success: true };
}

/**
 * Records an admin login audit entry in the database.
 */
export async function logAdminLoginEvent(
  email: string,
  method: "password" | "otp",
  ipAddress?: string
): Promise<void> {
  try {
    const auditData = {
      email,
      method,
      lastLoginAt: new Date().toISOString(),
      ipAddress: ipAddress || "unknown",
      status: "authenticated",
    };

    await query(
      `INSERT INTO public.admin_settings (key, value, updated_at)
       VALUES ('admin_last_login', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = $1::jsonb, updated_at = NOW();`,
      [JSON.stringify(auditData)]
    );
  } catch (err) {
    console.warn("[ADMIN-AUTH] Could not record admin login audit:", err);
  }
}
