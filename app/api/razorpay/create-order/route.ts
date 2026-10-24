import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes = {} } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount specified" },
        { status: 400 }
      );
    }

    // Determine amount in paise:
    // Razorpay standard requests specify amount in paise. Minimum amount is 100 paise (₹1).
    let amountInPaise: number;
    if (body.isPaise === true) {
      amountInPaise = Math.round(numAmount);
    } else if (body.isPaise === false) {
      amountInPaise = Math.round(numAmount * 100);
    } else {
      // If caller sent amount, handle standard: if amount >= 100 and likely paise, keep;
      // standard client sends paise directly.
      amountInPaise = Math.round(numAmount);
    }

    // Step 1: Validate amount >= 100 paise
    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: "Amount must be at least 100 paise (₹1.00)" },
        { status: 400 }
      );
    }

    // Dynamic resolution of credentials from environment (server-side single source of truth)
    let activeKeyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "rzp_live_Tn3v56njBS0cGX";
    let activeKeySecret =
      process.env.RAZORPAY_KEY_SECRET || "5B0VMymOFpkJfPsiE1sBWaSy";

    try {
      const settingsRes = await query(
        `SELECT value FROM public.admin_settings WHERE key = 'payments' LIMIT 1;`
      );
      if (settingsRes.rows.length > 0) {
        let val = settingsRes.rows[0].value;
        if (typeof val === "string") {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        if (val?.razorpayUpi?.keyId && !val.razorpayUpi.keyId.includes("•")) {
          activeKeyId = val.razorpayUpi.keyId;
        }
      }
    } catch (dbErr) {
      console.warn("[RAZORPAY] Database settings read fallback:", dbErr);
    }

    const orderReceipt = receipt || `rcpt_${Date.now()}`;

    const razorpay = new Razorpay({
      key_id: activeKeyId,
      key_secret: activeKeySecret,
    });

    let order: any = null;

    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: orderReceipt,
        notes: {
          ...notes,
          store: "Shivam Optical Luxury Eyewear Atelier",
        },
      });
    } catch (primaryErr: any) {
      console.error("[RAZORPAY] Order creation failed:", primaryErr?.message || primaryErr);
      return NextResponse.json(
        {
          success: false,
          error: primaryErr?.error?.description || primaryErr?.message || "Failed to create Razorpay payment order.",
        },
        { status: 502 }
      );
    }

    if (order && order.id) {
      return NextResponse.json({
        success: true,
        order_id: order.id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: activeKeyId,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to initialize Razorpay payment order. Please verify your payment credentials or internet connection.",
      },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("[RAZORPAY-CREATE-ORDER] Unhandled Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
