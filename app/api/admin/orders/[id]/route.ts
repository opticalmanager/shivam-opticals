import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrderById(id);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
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

    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.paymentStatus || body.payment_status) updates.payment_status = body.paymentStatus || body.payment_status;
    if (body.trackingNumber || body.tracking_number) updates.tracking_number = body.trackingNumber || body.tracking_number;
    if (body.courierPartner || body.courier_partner) updates.courier_partner = body.courierPartner || body.courier_partner;
    if (body.estimatedDelivery || body.estimated_delivery) updates.estimated_delivery = body.estimatedDelivery || body.estimated_delivery;

    const updated = updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updated,
    });
  } catch (error: any) {
    console.error("Order PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
