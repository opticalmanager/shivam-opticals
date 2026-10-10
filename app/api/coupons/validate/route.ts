import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Built-in emergency fallbacks if DB table is unseeded
const FALLBACK_COUPONS: Record<string, {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
}> = {
  FLAT12: {
    code: "FLAT12",
    discountType: "percentage",
    discountValue: 12,
    minOrderValue: 1999,
    maxDiscount: 1500,
  },
  SHIVAM12: {
    code: "SHIVAM12",
    discountType: "percentage",
    discountValue: 12,
    minOrderValue: 1999,
    maxDiscount: 1500,
  },
  SHIVAM10: {
    code: "SHIVAM10",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 999,
    maxDiscount: 1000,
  },
  WELCOME500: {
    code: "WELCOME500",
    discountType: "fixed",
    discountValue: 500,
    minOrderValue: 2999,
    maxDiscount: null,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code?.trim().toUpperCase();
    const orderAmount = Number(body.orderAmount || 0);

    if (!rawCode) {
      return NextResponse.json(
        { success: false, error: "Please enter a promo code" },
        { status: 400 }
      );
    }

    let couponRecord: any = null;

    try {
      const res = await query(
        `SELECT * FROM public.coupons WHERE UPPER(code) = $1 LIMIT 1;`,
        [rawCode]
      );
      if (res.rows && res.rows.length > 0) {
        couponRecord = res.rows[0];
      }
    } catch (dbErr) {
      console.warn("DB coupon lookup error, checking fallback store:", dbErr);
    }

    // If found in DB
    if (couponRecord) {
      if (!couponRecord.is_active) {
        return NextResponse.json(
          { success: false, error: `Promo code "${rawCode}" is no longer active.` },
          { status: 400 }
        );
      }

      if (couponRecord.valid_until) {
        const expiry = new Date(couponRecord.valid_until).getTime();
        if (Date.now() > expiry) {
          return NextResponse.json(
            {
              success: false,
              error: `Promo code "${rawCode}" expired on ${new Date(couponRecord.valid_until).toLocaleDateString("en-IN")}.`,
            },
            { status: 400 }
          );
        }
      }

      const minOrder = Number(couponRecord.min_order_value || 0);
      if (orderAmount > 0 && orderAmount < minOrder) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order value of ₹${minOrder.toLocaleString("en-IN")} required for this voucher (current bag: ₹${orderAmount.toLocaleString("en-IN")}).`,
          },
          { status: 400 }
        );
      }

      const usageLimit = couponRecord.usage_limit ? Number(couponRecord.usage_limit) : null;
      const usedCount = Number(couponRecord.used_count ?? couponRecord.usage_count ?? 0);
      if (usageLimit !== null && usedCount >= usageLimit) {
        return NextResponse.json(
          { success: false, error: `Promo code "${rawCode}" has reached its maximum redemption limit.` },
          { status: 400 }
        );
      }

      const discountType = couponRecord.discount_type || "percentage";
      const discountValue = Number(couponRecord.discount_value || 0);
      const maxDiscount = couponRecord.max_discount ? Number(couponRecord.max_discount) : null;

      let calculatedDiscount = 0;
      if (discountType === "percentage") {
        calculatedDiscount = Math.round((orderAmount * discountValue) / 100);
        if (maxDiscount !== null && calculatedDiscount > maxDiscount) {
          calculatedDiscount = maxDiscount;
        }
      } else {
        calculatedDiscount = Math.min(discountValue, orderAmount);
      }

      return NextResponse.json({
        success: true,
        coupon: {
          code: couponRecord.code,
          discountType,
          discountValue,
          discountAmount: calculatedDiscount,
          minOrderValue: minOrder,
          maxDiscount,
        },
        message:
          discountType === "percentage"
            ? `${discountValue}% atelier discount applied!`
            : `₹${discountValue.toLocaleString("en-IN")} voucher applied!`,
      });
    }

    // Fallback dictionary check
    if (FALLBACK_COUPONS[rawCode]) {
      const fb = FALLBACK_COUPONS[rawCode];
      if (orderAmount > 0 && orderAmount < fb.minOrderValue) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order value of ₹${fb.minOrderValue.toLocaleString("en-IN")} required for this voucher (current bag: ₹${orderAmount.toLocaleString("en-IN")}).`,
          },
          { status: 400 }
        );
      }

      let calculatedDiscount = 0;
      if (fb.discountType === "percentage") {
        calculatedDiscount = Math.round((orderAmount * fb.discountValue) / 100);
        if (fb.maxDiscount !== null && calculatedDiscount > fb.maxDiscount) {
          calculatedDiscount = fb.maxDiscount;
        }
      } else {
        calculatedDiscount = Math.min(fb.discountValue, orderAmount);
      }

      return NextResponse.json({
        success: true,
        coupon: {
          code: fb.code,
          discountType: fb.discountType,
          discountValue: fb.discountValue,
          discountAmount: calculatedDiscount,
          minOrderValue: fb.minOrderValue,
          maxDiscount: fb.maxDiscount,
        },
        message:
          fb.discountType === "percentage"
            ? `${fb.discountValue}% atelier privilege discount applied!`
            : `₹${fb.discountValue.toLocaleString("en-IN")} voucher applied!`,
      });
    }

    return NextResponse.json(
      { success: false, error: `Promo code "${rawCode}" is invalid.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
