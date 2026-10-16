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
        console.warn("[SHIPROCKET-WEBHOOK] Unauthorized webhook secret mismatch");
      }
    }

    // Extract essential Shiprocket shipment identifiers
    const orderNumber = payload.order_id || payload.channel_order_id;
    const awb = payload.awb || payload.awb_code;
    const currentStatus = (payload.current_status || payload.shipment_status || "").toUpperCase();
    const courier = payload.courier_name || payload.courier_company_id;
    const location = payload.location || payload.current_location || "";
    const activity = payload.activity || payload.status_description || currentStatus;

    if (!orderNumber && !awb) {
      return NextResponse.json(
        {
          success: true,
          status: "active",
          endpoint: "/api/webhooks/shiprocket",
          message: "Shivam Opticals Shiprocket webhook endpoint verified successfully",
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
      timestamp: new Date().toISOString(),
    };

    // Update orders table in PostgreSQL
    const updateResult = await query(
      `UPDATE public.orders 
       SET 
         status = COALESCE($1, status),
         courier_partner = COALESCE($2, courier_partner),
         tracking_number = COALESCE($3, tracking_number),
         payment_details = jsonb_set(
           COALESCE(payment_details, '{}'::jsonb),
           '{shiprocket,tracking_events}',
           COALESCE(payment_details->'shiprocket'->'tracking_events', '[]'::jsonb) || $4::jsonb
         ),
         updated_at = NOW()
       WHERE order_number = $5 OR tracking_number = $6
       RETURNING id, order_number, status, tracking_number`,
      [
        mappedOrderStatus,
        courier || null,
        awb || null,
        JSON.stringify([trackingMilestone]),
        orderNumber || "",
        awb || "",
      ]
    );

    if (updateResult.rowCount === 0) {
      console.warn(`[SHIPROCKET-WEBHOOK] No order found for ref: ${orderNumber} or AWB: ${awb}`);
    } else {
      console.log(
        `[SHIPROCKET-WEBHOOK] Updated order ${orderNumber} to ${mappedOrderStatus || "in-transit"}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderNumber,
        awb,
        status: mappedOrderStatus || "processed",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[SHIPROCKET-WEBHOOK] Critical error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
