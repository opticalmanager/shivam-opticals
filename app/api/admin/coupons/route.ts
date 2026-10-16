import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await query(
      `SELECT 
        id,
        code,
        discount_type,
        discount_value,
        min_order_value,
        max_discount,
        valid_from,
        valid_until,
        usage_limit,
        used_count,
        used_count as times_used,
        is_active,
        created_at
      FROM public.coupons
      ORDER BY created_at DESC;`
    );

    return NextResponse.json({
      success: true,
      coupons: res.rows,
    });
  } catch (error: any) {
    console.error("Coupons GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load coupons from database" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const discountType = body.discountType || body.discount_type || "percentage";
    const discountValue = Number(body.discountValue || body.discount_value || 10);
    const minOrderValue = Number(body.minOrderValue || body.min_order_value || 0);
    const maxDiscount = body.maxDiscount || body.max_discount ? Number(body.maxDiscount || body.max_discount) : null;
    const usageLimit = Number(body.usageLimit || body.usage_limit || 500);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const res = await query(
      `INSERT INTO public.coupons (
        code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (code) DO UPDATE
      SET discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          min_order_value = EXCLUDED.min_order_value,
          max_discount = EXCLUDED.max_discount,
          usage_limit = EXCLUDED.usage_limit,
          is_active = EXCLUDED.is_active
      RETURNING *;`,
      [code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, isActive]
    );

    return NextResponse.json({
      success: true,
      message: "Coupon saved successfully in PostgreSQL",
      coupon: res.rows[0],
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

    const res = await query(
      `UPDATE public.coupons
       SET is_active = $1
       WHERE id = $2
       RETURNING *;`,
      [Boolean(isActive), id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon status updated successfully",
      coupon: res.rows[0],
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

    const res = await query(`DELETE FROM public.coupons WHERE id = $1 RETURNING id;`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully from PostgreSQL",
    });
  } catch (error: any) {
    console.error("Coupons DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
