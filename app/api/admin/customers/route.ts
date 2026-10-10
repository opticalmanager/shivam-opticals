import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const data = getCustomers(search);

    return NextResponse.json({
      success: true,
      customers: data.customers,
      stats: data.stats,
    });
  } catch (error: any) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load customers" },
      { status: 500 }
    );
  }
}
