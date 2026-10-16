import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, x-razorpay-signature, authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      service: "Shivam Opticals Razorpay Payment Webhook",
      status: "active",
      supportedMethods: ["GET", "POST", "OPTIONS", "HEAD"],
      message: "Razorpay payment webhook endpoint is active and accessible.",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || "shivam_opticals_webhook_sec_2026";

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
        console.warn("[RAZORPAY-WEBHOOK] Signature mismatch for incoming webhook event");
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ received: true }, { status: 200, headers: corsHeaders });
    }

    const event = payload.event;
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const receiptNumber = paymentEntity?.notes?.orderNumber || paymentEntity?.description;

      if (orderId && paymentId) {
        try {
          const updateRes = await query(
            `UPDATE public.orders 
             SET payment_status = 'paid',
                 payment_id = $1,
                 payment_details = jsonb_set(
                   COALESCE(payment_details, '{}'::jsonb),
                   '{webhook_verified}',
                   'true'::jsonb
                 ),
                 updated_at = NOW() 
             WHERE payment_details->>'razorpay_order_id' = $2 
                OR order_number = $2
                OR order_number = $3
                OR tracking_number = $3;`,
            [paymentId, orderId, receiptNumber || orderId]
          );

          if (updateRes.rowCount === 0) {
            console.log(`[RAZORPAY-WEBHOOK] Order ${orderId} / ${receiptNumber} not yet created in DB or already handled.`);
          }
        } catch (dbErr) {
          console.warn("[RAZORPAY-WEBHOOK] Order update warning:", dbErr);
        }
      }
    }

    return NextResponse.json({ success: true, event }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("[RAZORPAY-WEBHOOK] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
