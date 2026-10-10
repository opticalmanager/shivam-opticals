import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || "shivam_rzp_webhook_sec_2026";

    // Verify webhook signature if present
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      let valid = false;
      try {
        const sigA = Buffer.from(expectedSignature, "utf8");
        const sigB = Buffer.from(signature, "utf8");
        if (sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)) {
          valid = true;
        }
      } catch {}

      if (!valid) {
        console.warn("[RAZORPAY-WEBHOOK] Signature mismatch");
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const event = payload.event;
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        try {
          await query(
            `UPDATE public.orders 
             SET payment_status = 'paid',
                 payment_id = $1,
                 updated_at = NOW() 
             WHERE payment_details->>'razorpay_order_id' = $2 
                OR order_number = $2;`,
            [paymentId, orderId]
          );
        } catch (dbErr) {
          console.warn("[RAZORPAY-WEBHOOK] Order update warning:", dbErr);
        }
      }
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (err: any) {
    console.error("[RAZORPAY-WEBHOOK] Error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
