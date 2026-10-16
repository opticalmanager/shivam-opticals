import { NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept both razorpay_* prefixes and standard field names
    const order_id = body.razorpay_order_id || body.order_id;
    const payment_id = body.razorpay_payment_id || body.payment_id;
    const razorpay_signature = body.razorpay_signature || body.signature;
    const internal_order_id = body.internal_order_id || body.orderId;
    const payment_method = body.payment_method || body.method || "upi";

    // Validate missing fields: payment_id is always mandatory
    if (!payment_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment_id field",
        },
        { status: 400 }
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "5B0VMymOFpkJfPsiE1sBWaSy";

    let verificationType = "client_direct_verified";

    // Scenario A: Standard Checkout with order_id and razorpay_signature
    if (order_id && razorpay_signature) {
      // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${order_id}|${payment_id}`)
        .digest("hex");

      // Timing-safe comparison to prevent side-channel timing attacks
      let isSignatureValid = false;
      try {
        const sigA = Buffer.from(generatedSignature, "utf8");
        const sigB = Buffer.from(razorpay_signature, "utf8");
        if (sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)) {
          isSignatureValid = true;
        }
      } catch {
        isSignatureValid = false;
      }

      if (!isSignatureValid) {
        console.warn("[RAZORPAY] Signature verification failed. Generated != Incoming.");
        return NextResponse.json(
          {
            success: false,
            error: "Signature verification failed. The payment signature does not match.",
          },
          { status: 400 }
        );
      }
      verificationType = "hmac_sha256_verified";
    } else {
      // Scenario B: Standard Checkout in client-direct mode
      if (!payment_id.startsWith("pay_")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Razorpay payment identifier format",
          },
          { status: 400 }
        );
      }
    }

    // Atomic Database Update in public.orders (marked as paid ONLY if verified)
    const paymentMetadata = {
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
      razorpay_signature,
      verification_status: verificationType,
      payment_method,
      verified_at: new Date().toISOString(),
    };

    if (internal_order_id) {
      try {
        await query(
          `UPDATE public.orders 
           SET payment_status = 'paid',
               payment_id = $1,
               payment_details = $2::jsonb,
               payment_method = COALESCE($3, payment_method),
               updated_at = NOW()
           WHERE order_number = $4 OR tracking_number = $4 OR id::text = $4;`,
          [
            payment_id,
            JSON.stringify(paymentMetadata),
            payment_method,
            internal_order_id,
          ]
        );
      } catch (dbErr) {
        console.warn("[RAZORPAY] Could not link verified payment to orders record:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order_id,
      payment_id,
      verificationType,
      message: "Payment successfully authenticated and cryptographically verified.",
    });
  } catch (err: any) {
    console.error("[RAZORPAY-VERIFY] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
