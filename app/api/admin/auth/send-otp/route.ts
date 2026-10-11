import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ALLOWED_ADMIN_EMAIL } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Administrator email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Strict access gate: only ALLOWED_ADMIN_EMAIL can receive admin OTP
    if (normalizedEmail !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: This email address is not authorized for administrative access.",
        },
        { status: 403 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: ALLOWED_ADMIN_EMAIL,
      options: {
        shouldCreateUser: true,
        data: {
          role: "super_admin",
        },
      },
    });

    if (error) {
      console.warn("[ADMIN-AUTH-SEND-OTP] Supabase OTP dispatch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to dispatch administrator verification code.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Emergency OTP dispatched to ${ALLOWED_ADMIN_EMAIL}.`,
      cooldown: 45,
    });
  } catch (err: any) {
    console.error("[ADMIN-AUTH-SEND-OTP] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
