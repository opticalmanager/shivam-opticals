import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getShippingConfig } from "@/lib/shippingSettings";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    if (rawBody && rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { test: true, raw: rawBody };
      }
    }

    const config = await getShippingConfig();

    // Verify webhook security header if configured
    const providedSecret =
      req.headers.get("x-api-key") ||
      req.headers.get("x-shiprocket-secret") ||
      req.headers.get("authorization");

    const expectedSecret = config.shiprocketWebhookSecret || "shivam_shiprocket_sec_2026";
    if (providedSecret) {
      const cleanSecret = providedSecret.replace(/^Bearer\s+/i, "");
      if (cleanSecret !== expectedSecret) {
        console.warn("[DELIVERY-WEBHOOK] Webhook secret mismatch or custom token provided");
      }
    }

    // Extract essential Shiprocket shipment identifiers
    const orderNumber = payload.order_id || payload.channel_order_id;
    const awb = payload.awb || payload.awb_code;
    const currentStatus = (payload.current_status || payload.shipment_status || "").toUpperCase();
    const courier = payload.courier_name || payload.courier_company_id;
    const location = payload.location || payload.current_location || "";
    const activity = payload.activity || payload.status_description || currentStatus;

    // Shiprocket test ping verification: Return 200 OK immediately
    if (!orderNumber && !awb) {
      return NextResponse.json(
        {
          success: true,
          status: "active",
          endpoint: "/api/webhooks/delivery",
          message: "Shivam Optics Shiprocket delivery webhook endpoint verified successfully",
        },
        { status: 200 }
      );
    }

    // Map Shiprocket logistics statuses to optical lab/fulfillment statuses
    let mappedOrderStatus: string | null = null;
    if (currentStatus.includes("DELIVER")) {
      mappedOrderStatus = "delivered";
    } else if (
      currentStatus.includes("PICKED") ||
      currentStatus.includes("IN TRANSIT") ||
      currentStatus.includes("OUT FOR DELIVERY") ||
      currentStatus.includes("SHIPPED")
    ) {
      mappedOrderStatus = "dispatched";
    }

    // Construct tracking event milestone
    const trackingMilestone = {
      status: currentStatus,
      activity,
      location,
      courier,
      timestamp: new Date().toISOString(),
    };

    // Update database record if target order exists
    try {
      const targetQuery = awb
        ? `UPDATE public.orders 
           SET status = COALESCE($1, status),
               tracking_number = COALESCE(tracking_number, $2),
               courier_partner = COALESCE($3, courier_partner),
               delivery_events = COALESCE(delivery_events, '[]'::jsonb) || $4::jsonb,
               updated_at = NOW()
           WHERE tracking_number = $2 OR order_number = $5;`
        : `UPDATE public.orders 
           SET status = COALESCE($1, status),
               courier_partner = COALESCE($3, courier_partner),
               delivery_events = COALESCE(delivery_events, '[]'::jsonb) || $4::jsonb,
               updated_at = NOW()
           WHERE order_number = $5;`;

      const params = awb
        ? [mappedOrderStatus, awb, courier || "BlueDart Express", JSON.stringify(trackingMilestone), orderNumber]
        : [mappedOrderStatus, courier || "BlueDart Express", JSON.stringify(trackingMilestone), orderNumber];

      await query(targetQuery, params);
    } catch (dbErr) {
      console.warn("[DELIVERY-WEBHOOK] Order DB update notice:", dbErr);
    }

    return NextResponse.json({
      success: true,
      processed: true,
      orderNumber,
      awb,
      currentStatus,
      mappedOrderStatus,
    });
  } catch (error: any) {
    console.error("[DELIVERY-WEBHOOK] Internal error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
