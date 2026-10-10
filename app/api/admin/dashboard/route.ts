import { NextRequest, NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";
    const data = getDashboardMetrics(range);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
