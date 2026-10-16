import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        o.order_number ILIKE $${pIdx} OR 
        o.guest_email ILIKE $${pIdx} OR 
        o.guest_phone ILIKE $${pIdx} OR 
        o.tracking_number ILIKE $${pIdx} OR
        o.shipping_address->>'fullName' ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (status && status !== "all") {
      conditions.push(`o.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (paymentStatus && paymentStatus !== "all") {
      conditions.push(`o.payment_status = $${pIdx}`);
      params.push(paymentStatus);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count for current query
    const countRes = await query(
      `SELECT COUNT(o.id) as total FROM public.orders o ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Global status tab counts across all orders
    const statusCountsRes = await query(`
      SELECT 
        COUNT(id) as all_count,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'optician_assembly' THEN 1 END) as assembly_count,
        COUNT(CASE WHEN status = 'quality_check' THEN 1 END) as qc_count,
        COUNT(CASE WHEN status = 'dispatched' THEN 1 END) as dispatched_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM public.orders;
    `);
    const statusCounts = statusCountsRes.rows[0] || {};
    const countsMap = {
      all: parseInt(statusCounts.all_count || "0", 10),
      confirmed: parseInt(statusCounts.confirmed_count || "0", 10),
      optician_assembly: parseInt(statusCounts.assembly_count || "0", 10),
      quality_check: parseInt(statusCounts.qc_count || "0", 10),
      dispatched: parseInt(statusCounts.dispatched_count || "0", 10),
      delivered: parseInt(statusCounts.delivered_count || "0", 10),
      cancelled: parseInt(statusCounts.cancelled_count || "0", 10),
    };

    if (total === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
        },
        counts: countsMap,
        statusCounts: countsMap,
      });
    }

    const ordersRes = await query(
      `SELECT 
        o.id,
        o.order_number,
        o.guest_name,
        o.guest_email,
        o.guest_phone,
        o.status,
        o.payment_status,
        o.payment_method,
        o.payment_id,
        o.payment_details,
        o.subtotal,
        o.discount_amount,
        o.coupon_code,
        o.shipping_fee,
        o.total_amount,
        o.shipping_address,
        o.tracking_number,
        o.courier_partner,
        o.estimated_delivery,
        o.created_at,
        o.updated_at,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'lens_price', oi.lens_price,
            'total_price', oi.total_price,
            'product_snapshot', oi.product_snapshot
          ))
          FROM public.order_items oi
          WHERE oi.order_id = o.id
        ), '[]'::json) as items,
        (SELECT COUNT(oi.id) FROM public.order_items oi WHERE oi.order_id = o.id) as item_count
      FROM public.orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      orders: ordersRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: countsMap,
      statusCounts: countsMap,
    });
  } catch (error: any) {
    console.error("Orders list error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}
