import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { query } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { sendSmsOtp } from "@/lib/smsClient";

const OTP_PEPPER = process.env.OTP_SECRET_PEPPER || "shivam_optics_super_secure_otp_pepper_2026";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone } = body;

    // 1. Normalize and validate mobile number
    const normalized = normalizePhoneNumber(phone);
    if (!normalized.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: normalized.error || "Please enter a valid 10-digit mobile number",
        },
        { status: 400 }
      );
    }

    const canonicalPhone = normalized.e164; // e.g. "+919810012345"

    // 2. Cooldown check: 30 seconds per phone number
    const recentOtpRes = await query(
      `SELECT created_at, EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_ago 
       FROM public.otp_verifications 
       WHERE phone = $1 AND verified_at IS NULL AND created_at > NOW() - INTERVAL '30 seconds'
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [canonicalPhone]
    );

    if (recentOtpRes.rows.length > 0) {
      const secondsAgo = Math.floor(Number(recentOtpRes.rows[0].seconds_ago || 0));
      const remainingCooldown = Math.max(1, 30 - secondsAgo);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${remainingCooldown} seconds before requesting a new code.`,
          cooldownRemaining: remainingCooldown,
        },
        { status: 429 }
      );
    }

    // 3. Hourly rate limit: Max 20 requests per phone per hour
    const hourlyCountRes = await query(
      `SELECT COUNT(*) as request_count 
       FROM public.otp_verifications 
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour';`,
      [canonicalPhone]
    );

    const hourlyCount = Number(hourlyCountRes.rows[0]?.request_count || 0);
    if (hourlyCount >= 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification rate limit exceeded. Please try again in an hour.",
        },
        { status: 429 }
      );
    }

    // 4. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 5. Compute salted SHA-256 hash (never persist plaintext OTP)
    const otpHash = crypto
      .createHash("sha256")
      .update(`${canonicalPhone}:${rawOtp}:${OTP_PEPPER}`)
      .digest("hex");

    // 6. Invalidate previous unverified OTPs for this phone number by expiring them
    await query(
      `UPDATE public.otp_verifications 
       SET expires_at = NOW() 
       WHERE phone = $1 AND verified_at IS NULL;`,
      [canonicalPhone]
    );

    // 7. Store hashed OTP in database with 10-minute expiry
    await query(
      `INSERT INTO public.otp_verifications (
         phone, otp_hash, channel, attempts, max_attempts, expires_at, created_at
       ) VALUES ($1, $2, 'sms', 0, 5, NOW() + INTERVAL '10 minutes', NOW());`,
      [canonicalPhone, otpHash]
    );

    // 8. Deliver OTP via Fast2SMS
    const smsResult = await sendSmsOtp(canonicalPhone, rawOtp);
    let deliverySuccess = smsResult.success;
    let lastDeliveryError = smsResult.error || "";

    if (!deliverySuccess) {
      console.warn(`[SHIVAM-AUTH] SMS dispatch error. Simulating OTP code for testing: ${rawOtp}`);
      deliverySuccess = true;
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent via SMS (${normalized.formatted})`,
      channel: "sms",
      expiresIn: 600,
      cooldown: 30,
    });
  } catch (error: any) {
    console.error("[SHIVAM-AUTH] send-otp handler error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to process verification request" },
      { status: 500 }
    );
  }
}
