import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const orderRes = await query(
      `SELECT 
        o.*,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'lens_price', oi.lens_price,
            'total_price', oi.total_price,
            'product_snapshot', oi.product_snapshot,
            'product_id', oi.product_id
          ))
          FROM public.order_items oi
          WHERE oi.order_id = o.id
        ), '[]'::json) as items
      FROM public.orders o
      WHERE o.id::text = $1 OR o.order_number = $1 OR o.tracking_number = $1
      LIMIT 1;`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: orderRes.rows[0],
    });
  } catch (error: any) {
    console.error("Order detail GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load order details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedStatuses = ["confirmed", "optician_assembly", "quality_check", "dispatched", "delivered", "cancelled"];
    const allowedPaymentStatuses = ["unpaid", "pending", "paid", "refunded", "failed"];

    const updates: string[] = [];
    const updateParams: any[] = [];
    let pIdx = 1;

    if (body.status) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
      }
      updates.push(`status = $${pIdx}`);
      updateParams.push(body.status);
      pIdx++;
    }

    if (body.paymentStatus || body.payment_status) {
      const ps = body.paymentStatus || body.payment_status;
      if (!allowedPaymentStatuses.includes(ps)) {
        return NextResponse.json({ success: false, error: "Invalid payment status" }, { status: 400 });
      }
      updates.push(`payment_status = $${pIdx}`);
      updateParams.push(ps);
      pIdx++;
    }

    if (body.trackingNumber || body.tracking_number) {
      updates.push(`tracking_number = $${pIdx}`);
      updateParams.push(body.trackingNumber || body.tracking_number);
      pIdx++;
    }

    if (body.courierPartner || body.courier_partner) {
      updates.push(`courier_partner = $${pIdx}`);
      updateParams.push(body.courierPartner || body.courier_partner);
      pIdx++;
    }

    if (body.estimatedDelivery || body.estimated_delivery) {
      updates.push(`estimated_delivery = $${pIdx}`);
      updateParams.push(body.estimatedDelivery || body.estimated_delivery);
      pIdx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No update parameters provided" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    updateParams.push(id);

    const updateRes = await query(
      `UPDATE public.orders
       SET ${updates.join(", ")}
       WHERE id::text = $${pIdx} OR order_number = $${pIdx} OR tracking_number = $${pIdx}
       RETURNING *;`,
      updateParams
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully in PostgreSQL",
      order: updateRes.rows[0],
    });
  } catch (error: any) {
    console.error("Order PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
