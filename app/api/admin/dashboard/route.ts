import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getDashboardMetrics as getFallbackDashboardMetrics } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";

    let dateFilter = "";
    let prevDateFilter = "";

    if (range === "today") {
      dateFilter = "WHERE created_at >= CURRENT_DATE";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE";
    } else if (range === "30d") {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days'";
    } else if (range === "this_month") {
      dateFilter = "WHERE created_at >= date_trunc('month', CURRENT_DATE)";
      prevDateFilter = "WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE)";
    } else if (range === "all") {
      dateFilter = "WHERE 1=1";
      prevDateFilter = "";
    } else {
      // 7d default
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days'";
    }

    try {
      // 1. Total revenue & orders for the selected range
      const statsRes = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COUNT(id) as total_orders,
          COUNT(DISTINCT COALESCE(guest_email, guest_phone)) as total_customers,
          COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as avg_order_value
        FROM public.orders
        ${dateFilter};
      `);

      const stats = statsRes.rows[0];

      let revenueGrowth: string | null = null;
      let ordersGrowth: string | null = null;
      let customersGrowth: string | null = null;
      let aovGrowth: string | null = null;

      if (prevDateFilter) {
        const prevStatsRes = await query(`
          SELECT 
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
            COUNT(id) as total_orders,
            COUNT(DISTINCT COALESCE(guest_email, guest_phone)) as total_customers,
            COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as avg_order_value
          FROM public.orders
          ${prevDateFilter};
        `);
        const prevStats = prevStatsRes.rows[0];

        const calcGrowth = (curr: number, prev: number) => {
          if (prev === 0 && curr > 0) return "+100%";
          if (prev === 0 && curr === 0) return null;
          const diff = ((curr - prev) / prev) * 100;
          return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
        };

        revenueGrowth = calcGrowth(Number(stats.total_revenue), Number(prevStats.total_revenue));
        ordersGrowth = calcGrowth(Number(stats.total_orders), Number(prevStats.total_orders));
        customersGrowth = calcGrowth(Number(stats.total_customers), Number(prevStats.total_customers));
        aovGrowth = calcGrowth(Number(stats.avg_order_value), Number(prevStats.avg_order_value));
      }

      // 2. Status counts (all-time active queue)
      const statusRes = await query(`
        SELECT status, COUNT(*) as count
        FROM public.orders
        GROUP BY status;
      `);
      const statusCounts: Record<string, number> = {};
      for (const r of statusRes.rows) {
        statusCounts[r.status] = parseInt(r.count, 10);
      }

      // 3. Recent 5 orders with items
      const recentOrdersRes = await query(`
        SELECT 
          o.id,
          o.order_number,
          o.guest_email,
          o.guest_phone,
          o.status,
          o.payment_status,
          o.payment_method,
          o.total_amount,
          o.shipping_address,
          o.created_at,
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'total_price', oi.total_price,
              'snapshot', oi.product_snapshot
            ))
            FROM public.order_items oi
            WHERE oi.order_id = o.id
          ) as items
        FROM public.orders o
        ORDER BY o.created_at DESC
        LIMIT 5;
      `);

      return NextResponse.json({
        success: true,
        metrics: {
          revenue: { value: Number(stats.total_revenue), growth: revenueGrowth },
          orders: { value: Number(stats.total_orders), growth: ordersGrowth },
          customers: { value: Number(stats.total_customers), growth: customersGrowth },
          aov: { value: Math.round(Number(stats.avg_order_value)), growth: aovGrowth },
        },
        statusCounts,
        recentOrders: recentOrdersRes.rows,
      });
    } catch (dbErr) {
      console.warn("[ADMIN-DASHBOARD] DB query fallback:", dbErr);
    }

    const fallbackData = getFallbackDashboardMetrics(range);
    return NextResponse.json(fallbackData);
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
