import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const method = searchParams.get("method") || "all";
    const status = searchParams.get("status") || "all";

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        o.order_number ILIKE $${pIdx} OR 
        o.payment_id ILIKE $${pIdx} OR 
        o.guest_email ILIKE $${pIdx} OR 
        o.guest_phone ILIKE $${pIdx} OR 
        o.shipping_address->>'fullName' ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (method && method !== "all") {
      conditions.push(`o.payment_method ILIKE $${pIdx}`);
      params.push(`%${method}%`);
      pIdx++;
    }

    if (status && status !== "all") {
      conditions.push(`o.payment_status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Fetch transactions list
    const txRes = await query(
      `SELECT 
        o.id,
        o.order_number,
        COALESCE(o.payment_id, 'pay_' || SUBSTRING(o.id::text, 1, 8)) as payment_id,
        o.payment_method,
        o.payment_status,
        COALESCE(o.payment_details, json_build_object('method', o.payment_method, 'status', o.payment_status)) as payment_details,
        o.total_amount,
        o.subtotal,
        o.discount_amount,
        o.shipping_fee,
        o.shipping_address,
        o.guest_email,
        o.guest_phone,
        o.created_at,
        o.status as order_status
      FROM public.orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT 100;`,
      params
    );

    // 2. Fetch global settlement metrics across all orders
    const metricsRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_settled_volume,
        COUNT(id) as total_transactions,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_transactions,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_transactions,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND (payment_method ILIKE '%razorpay%' OR payment_method ILIKE '%upi%') THEN total_amount ELSE 0 END), 0) as razorpay_volume,
        COUNT(CASE WHEN payment_method ILIKE '%razorpay%' OR payment_method ILIKE '%upi%' THEN 1 END) as razorpay_count,
        COUNT(CASE WHEN payment_method ILIKE '%cash%' OR payment_method ILIKE '%cod%' THEN 1 END) as cod_count
      FROM public.orders;
    `);

    const m = metricsRes.rows[0] || {};
    const totalTransactions = parseInt(m.total_transactions || "0", 10);
    const paidTransactions = parseInt(m.paid_transactions || "0", 10);
    const successRate = totalTransactions > 0 ? Math.round((paidTransactions / totalTransactions) * 100) : 100;

    return NextResponse.json({
      success: true,
      transactions: txRes.rows,
      metrics: {
        totalSettledVolume: Number(m.total_settled_volume || 0),
        totalTransactions,
        paidTransactions,
        pendingTransactions: parseInt(m.pending_transactions || "0", 10),
        failedTransactions: parseInt(m.failed_transactions || "0", 10),
        razorpayVolume: Number(m.razorpay_volume || 0),
        razorpayCount: parseInt(m.razorpay_count || "0", 10),
        codCount: parseInt(m.cod_count || "0", 10),
        successRate,
      },
    });
  } catch (error: any) {
    console.error("Payment transactions GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load payment transactions from database" },
      { status: 500 }
    );
  }
}
