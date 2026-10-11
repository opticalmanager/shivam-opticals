import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ALLOWED_ADMIN_EMAIL,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie || !cookie.value) {
    return NextResponse.json(
      { authenticated: false, error: "No active admin session." },
      { status: 401 }
    );
  }

  const session = await verifyAdminSessionToken(cookie.value);
  if (!session) {
    return NextResponse.json(
      { authenticated: false, error: "Invalid or expired admin session." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: ALLOWED_ADMIN_EMAIL,
      role: "super_admin",
      name: "Shivam Super Admin",
      rememberMe: session.rememberMe,
      expiresAt: new Date(session.exp * 1000).toISOString(),
    },
  });
}
