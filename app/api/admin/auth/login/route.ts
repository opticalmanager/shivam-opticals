import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  logAdminLoginEvent,
  ADMIN_COOKIE_NAME,
  ALLOWED_ADMIN_EMAIL,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe = true } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email address and password are required." },
        { status: 400 }
      );
    }

    const verification = await verifyAdminCredentials(email, password);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || "Authentication failed." },
        { status: 401 }
      );
    }

    // Generate signed 30-day (or 1-day) session token
    const token = await createAdminSessionToken(email, rememberMe);

    // Record login audit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    await logAdminLoginEvent(email, "password", ip);

    // Set HttpOnly, Secure, SameSite=Lax cookie
    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days vs 1 day
    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
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
    console.error("[ADMIN-AUTH-LOGIN] Unhandled Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
