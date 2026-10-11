import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  createAdminSessionToken,
  logAdminLoginEvent,
  ADMIN_COOKIE_NAME,
  ALLOWED_ADMIN_EMAIL,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, rememberMe = true } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Administrator email and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: This email address is not authorized for administrative access.",
        },
        { status: 403 }
      );
    }

    // Verify OTP through Supabase
    let { data, error } = await supabase.auth.verifyOtp({
      email: ALLOWED_ADMIN_EMAIL,
      token: otp.trim(),
      type: "email",
    });

    if (error && (error.message?.toLowerCase().includes("invalid") || error.message?.toLowerCase().includes("expired"))) {
      const fallbackRes = await supabase.auth.verifyOtp({
        email: ALLOWED_ADMIN_EMAIL,
        token: otp.trim(),
        type: "signup",
      });
      if (!fallbackRes.error && fallbackRes.data?.user) {
        data = fallbackRes.data;
        error = null;
      }
    }

    if (error || !data?.user) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Invalid or expired administrator OTP code.",
        },
        { status: 401 }
      );
    }

    // Issue cryptographic admin session token
    const token = await createAdminSessionToken(ALLOWED_ADMIN_EMAIL, rememberMe);

    // Record login audit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    await logAdminLoginEvent(ALLOWED_ADMIN_EMAIL, "otp", ip);

    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days vs 1 day
    const response = NextResponse.json({
      success: true,
      message: "Administrator OTP verified successfully.",
      user: {
        email: ALLOWED_ADMIN_EMAIL,
        role: "super_admin",
        name: "Shivam Super Admin",
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err: any) {
    console.error("[ADMIN-AUTH-VERIFY-OTP] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
