import { NextRequest, NextResponse } from "next/server";
import { getInventory, updateStock } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search")?.trim() || "";

    const data = getInventory({ filter, search });

    return NextResponse.json({
      success: true,
      inventory: data.inventory,
      stats: data.stats,
    });
  } catch (error: any) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load inventory" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, delta, stockQuantity } = body;

    if (!variantId) {
      return NextResponse.json({ success: false, error: "variantId is required" }, { status: 400 });
    }

    const d = delta !== undefined ? Number(delta) : Number(stockQuantity);
    const updated = updateStock(variantId, d);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
      variant: updated,
    });
  } catch (error: any) {
    console.error("Inventory PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update stock" },
      { status: 500 }
    );
  }
}
