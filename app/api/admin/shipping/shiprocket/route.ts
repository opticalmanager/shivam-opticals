import { NextRequest, NextResponse } from "next/server";
import {
  getShiprocketToken,
  checkCourierServiceability,
  bookShiprocketShipment,
} from "@/lib/shiprocketClient";
import { getShippingConfig } from "@/lib/shippingSettings";
import { query } from "@/lib/db";

// 1. GET: Test live connection, token status, and pickup location details
export async function GET(req: NextRequest) {
  try {
    const config = await getShippingConfig();
    const { token, error } = await getShiprocketToken(true); // force live test

    return NextResponse.json({
      success: true,
      connected: Boolean(token),
      message: token
        ? "Successfully authenticated with Shiprocket Logistics API"
        : error || "API credentials stored. Verify API User in Shiprocket dashboard.",
      email: config.shiprocketEmail,
      pickupLocation: config.shiprocketPickupLocation,
      pickupAddress: config.shiprocketPickupAddress,
      pickupCity: config.shiprocketPickupCity,
      pickupState: config.shiprocketPickupState,
      pickupPincode: config.shiprocketPickupPincode,
      fulfillmentMode: config.fulfillmentMode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, connected: false, message: err.message },
      { status: 500 }
    );
  }
}

// 2. POST: Actions (calculate_rates, book_shipment, update_pickup_location)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "calculate_rates";
    const config = await getShippingConfig();

    if (action === "update_pickup_location") {
      const { pickupLocation, pickupAddress, pickupCity, pickupState, pickupPincode } = body;
      const updated = {
        ...config,
        shiprocketPickupLocation: pickupLocation || config.shiprocketPickupLocation,
        shiprocketPickupAddress: pickupAddress || config.shiprocketPickupAddress,
        shiprocketPickupCity: pickupCity || config.shiprocketPickupCity,
        shiprocketPickupState: pickupState || config.shiprocketPickupState,
        shiprocketPickupPincode: pickupPincode || config.shiprocketPickupPincode,
      };

      try {
        await query(
          `INSERT INTO public.admin_settings (key, value, updated_at)
           VALUES ('shipping', $1::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW();`,
          [JSON.stringify(updated)]
        );
      } catch (dbErr) {
        console.warn("[SHIPROCKET-SETTINGS] DB update warning:", dbErr);
      }

      return NextResponse.json({
        success: true,
        message: "Pickup location updated successfully",
        pickupLocation: updated.shiprocketPickupLocation,
        pickupAddress: updated.shiprocketPickupAddress,
        pickupCity: updated.shiprocketPickupCity,
        pickupState: updated.shiprocketPickupState,
        pickupPincode: updated.shiprocketPickupPincode,
      });
    }

    if (action === "calculate_rates") {
      const deliveryPincode = body.deliveryPincode?.trim();
      const pickupPincode = body.pickupPincode?.trim() || config.shiprocketPickupPincode || "110001";
      const customWeight = body.weight !== undefined ? Number(body.weight) : (body.weightKg !== undefined ? Number(body.weightKg) : config.defaultWeightKg || 0.35);

      if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode)) {
        return NextResponse.json(
          { success: false, message: "Valid 6-digit delivery pincode is required" },
          { status: 400 }
        );
      }

      const result = await checkCourierServiceability({
        deliveryPincode,
        pickupPincode,
        weightKg: customWeight,
        cod: Boolean(body.cod),
      });

      return NextResponse.json({
        ...result,
        pickupLocation: config.shiprocketPickupLocation || "work",
        pickupAddress: config.shiprocketPickupAddress,
        pickupCity: config.shiprocketPickupCity,
        pickupState: config.shiprocketPickupState,
        pickupPincode,
      });
    }

    if (action === "book_shipment") {
      const { orderId, orderNumber, courierCompanyId, weightKg } = body;
      if (!orderId && !orderNumber) {
        return NextResponse.json(
          { success: false, message: "orderId or orderNumber is required to book shipment" },
          { status: 400 }
        );
      }

      let order: any = null;
      try {
        const orderRes = await query(
          `SELECT o.*, 
            COALESCE((
              SELECT json_agg(json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price,
                'product_snapshot', oi.product_snapshot
              ))
              FROM public.order_items oi
              WHERE oi.order_id = o.id
            ), '[]'::json) as items
           FROM public.orders o
           WHERE o.id::text = $1 OR o.order_number = $1 OR o.tracking_number = $1
           LIMIT 1;`,
          [orderId || orderNumber]
        );
        if (orderRes.rows.length > 0) {
          order = orderRes.rows[0];
        }
      } catch (dbErr) {
        console.warn("[SHIPROCKET-BOOKING] DB fetch error:", dbErr);
      }

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Target order record not found in database" },
          { status: 404 }
        );
      }

      const shippingAddr = typeof order.shipping_address === "string"
        ? JSON.parse(order.shipping_address)
        : order.shipping_address || {};

      const orderItems = (Array.isArray(order.items) ? order.items : []).map((it: any) => ({
        name: it.product_snapshot?.name || it.name || "Luxury Optical Frame",
        units: it.quantity || 1,
        sellingPrice: Number(it.unit_price || order.total_amount || 0),
      }));

      const bookingResult = await bookShiprocketShipment({
        orderNumber: order.order_number,
        orderDate: order.created_at,
        customerName:
          shippingAddr.fullName ||
          `${shippingAddr.firstName || ""} ${shippingAddr.lastName || ""}`.trim() ||
          "Valued Patron",
        customerEmail: order.guest_email || shippingAddr.email || "patron@shivamoptics.in",
        customerPhone: order.guest_phone || shippingAddr.phone || "+919810012345",
        address: {
          streetAddress: shippingAddr.streetAddress || "Main Market",
          city: shippingAddr.city || "Delhi",
          state: shippingAddr.state || "Delhi",
          pincode: shippingAddr.pincode || "110001",
          country: shippingAddr.country || "India",
        },
        items:
          orderItems.length > 0
            ? orderItems
            : [{ name: "Optical Frame", units: 1, sellingPrice: Number(order.total_amount || 1000) }],
        subtotal: Number(order.total_amount || 1000),
        paymentMethod: order.payment_method === "cod" ? "cod" : "prepaid",
        courierId: courierCompanyId ? Number(courierCompanyId) : undefined,
        weight: weightKg ? Number(weightKg) : config.defaultWeightKg,
      });

      if (bookingResult.success && bookingResult.awbCode) {
        try {
          await query(
            `UPDATE public.orders
             SET status = 'dispatched',
                 tracking_number = $1,
                 courier_partner = $2,
                 updated_at = NOW()
             WHERE id = $3;`,
            [bookingResult.awbCode, bookingResult.courierName || "BlueDart Express", order.id]
          );
        } catch (dbUpdateErr) {
          console.warn("[SHIPROCKET-BOOKING] Order status update warning:", dbUpdateErr);
        }
      }

      return NextResponse.json(bookingResult);
    }

    return NextResponse.json(
      { success: false, message: `Unknown action '${action}' specified` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[SHIPROCKET-ADMIN] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
