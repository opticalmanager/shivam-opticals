import { NextRequest, NextResponse } from "next/server";
import { getCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = getCoupons();
    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error: any) {
    console.error("Coupons GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = createCoupon(body);
    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error: any) {
    console.error("Coupons POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID is required" }, { status: 400 });
    }

    const ok = toggleCoupon(id, Boolean(isActive));
    if (!ok) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
    });
  } catch (error: any) {
    console.error("Coupons PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID is required" }, { status: 400 });
    }

    const ok = deleteCoupon(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    console.error("Coupons DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
