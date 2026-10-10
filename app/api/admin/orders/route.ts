import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10", 10)));

    const result = getOrders({
      search,
      status,
      paymentStatus,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      orders: result.orders,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error: any) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = createOrder(body);

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error: any) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
