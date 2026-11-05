import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";

    let dateFilter = "";
    let prevDateFilter = "";
    let daysToGenerate = 7;

    if (range === "today") {
      dateFilter = "WHERE created_at >= CURRENT_DATE";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE";
      daysToGenerate = 1;
    } else if (range === "30d") {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days'";
      daysToGenerate = 30;
    } else if (range === "this_month") {
      dateFilter = "WHERE created_at >= date_trunc('month', CURRENT_DATE)";
      prevDateFilter = "WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE)";
      daysToGenerate = 30;
    } else if (range === "all") {
      dateFilter = "WHERE 1=1";
      prevDateFilter = "";
      daysToGenerate = 14;
    } else {
      // 7d default
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
      prevDateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days'";
      daysToGenerate = 7;
    }

    // 1. Revenue & orders aggregates for the selected range
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(id) as total_orders,
        COUNT(DISTINCT COALESCE(guest_email, guest_phone)) as total_customers,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as avg_order_value
      FROM public.orders
      ${dateFilter};
    `);

    // Get total registered patrons count from public.profiles
    const profilesCountRes = await query(`SELECT COUNT(id) as total_patrons FROM public.profiles;`);
    const totalRegisteredPatrons = parseInt(profilesCountRes.rows[0]?.total_patrons || "0", 10);

    const statsRow = statsRes.rows[0] || {};
    const totalCustomers = Math.max(
      parseInt(statsRow.total_customers || "0", 10),
      totalRegisteredPatrons
    );

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
      const prevStats = prevStatsRes.rows[0] || {};

      const calcGrowth = (curr: number, prev: number) => {
        if (prev === 0 && curr > 0) return "+100%";
        if (prev === 0 && curr === 0) return null; // No meaningless +0.0%
        const diff = ((curr - prev) / prev) * 100;
        return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
      };

      revenueGrowth = calcGrowth(Number(statsRow.total_revenue || 0), Number(prevStats.total_revenue || 0));
      ordersGrowth = calcGrowth(Number(statsRow.total_orders || 0), Number(prevStats.total_orders || 0));
      customersGrowth = calcGrowth(Number(statsRow.total_customers || 0), Number(prevStats.total_customers || 0));
      aovGrowth = calcGrowth(Number(statsRow.avg_order_value || 0), Number(prevStats.avg_order_value || 0));
    }

    // 2. Optical lab queue status counts
    const statusRes = await query(`
      SELECT status, COUNT(*) as count
      FROM public.orders
      GROUP BY status;
    `);
    const statusCounts: Record<string, number> = {
      confirmed: 0,
      optician_assembly: 0,
      quality_check: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const r of statusRes.rows) {
      statusCounts[r.status] = parseInt(r.count, 10);
    }

    // 3. Recent 5 orders with nested items
    const recentOrdersRes = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.guest_name,
        o.guest_email,
        o.guest_phone,
        o.status,
        o.payment_status,
        o.payment_method,
        o.total_amount,
        o.shipping_address,
        o.tracking_number,
        o.courier_partner,
        o.created_at,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'product_name', COALESCE(oi.product_snapshot->>'name', 'Optical Frame'),
            'snapshot', oi.product_snapshot
          ))
          FROM public.order_items oi
          WHERE oi.order_id = o.id
        ), '[]'::json) as items
      FROM public.orders o
      ORDER BY o.created_at DESC
      LIMIT 5;
    `);

    // 4. Sales History chart data
    const salesHistoryRes = await query(`
      SELECT 
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date_str,
        to_char(date_trunc('day', created_at), 'DD Mon') as label,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as revenue,
        COUNT(id) as orders
      FROM public.orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${daysToGenerate} days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at) ASC;
    `);

    // Build timeline dates
    const historyMap: Record<string, { label: string; revenue: number; orders: number }> = {};
    for (const row of salesHistoryRes.rows) {
      historyMap[row.date_str] = {
        label: row.label,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      };
    }

    const salesHistory = [];
    const now = new Date();
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      salesHistory.push({
        date: key,
        label,
        revenue: historyMap[key]?.revenue || 0,
        orders: historyMap[key]?.orders || 0,
      });
    }

    // 5. Top Eyewear Models or Flagship Atelier Showcase
    const topProductsRes = await query(`
      SELECT 
        COALESCE(oi.product_snapshot->>'name', p.name, 'Optical Frame') as name,
        COALESCE(b.name, 'Shivam Optical') as brand,
        SUM(oi.quantity)::int as "unitsSold",
        SUM(oi.total_price)::numeric as revenue,
        p.base_price as price
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.brands b ON b.id = p.brand_id
      GROUP BY oi.product_snapshot->>'name', p.name, b.name, p.base_price
      HAVING SUM(oi.quantity) > 0
      ORDER BY revenue DESC
      LIMIT 5;
    `);

    let topProducts = topProductsRes.rows;
    let isCatalogShowcase = false;

    if (topProducts.length === 0) {
      // Flagship catalog showcase
      isCatalogShowcase = true;
      const catalogTop = await query(`
        SELECT 
          p.id,
          p.name,
          COALESCE(b.name, 'Shivam Optical') as brand,
          p.base_price as price,
          p.original_price as "originalPrice",
          p.is_best_seller as "isBestSeller",
          COALESCE((
            SELECT pi.url FROM public.product_images pi 
            WHERE pi.product_id = p.id AND pi.is_primary = true 
            LIMIT 1
          ), (
            SELECT pi.url FROM public.product_images pi 
            WHERE pi.product_id = p.id 
            LIMIT 1
          ), '/images/placeholder.jpg') as img,
          COALESCE((
            SELECT SUM(pv.stock_quantity) FROM public.product_variants pv 
            WHERE pv.product_id = p.id
          ), 0)::int as stock,
          COALESCE((
            SELECT COUNT(pv.id) FROM public.product_variants pv 
            WHERE pv.product_id = p.id
          ), 0)::int as "variantCount",
          0 as "unitsSold",
          0 as revenue
        FROM public.products p
        LEFT JOIN public.brands b ON b.id = p.brand_id
        WHERE p.is_active = true
        ORDER BY p.is_best_seller DESC, p.created_at DESC
        LIMIT 5;
      `);
      topProducts = catalogTop.rows;
    }

    // 6. Live Low Stock Warnings (stock <= 5)
    const lowStockRes = await query(`
      SELECT 
        pv.id,
        pv.sku,
        pv.color_name,
        pv.stock_quantity,
        p.name as product_name,
        COALESCE(b.name, 'Shivam Optical') as brand
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE pv.stock_quantity <= 5
      ORDER BY pv.stock_quantity ASC
      LIMIT 6;
    `);

    // 7. REAL CATALOG HEALTH & INVENTORY METRICS
    const catalogHealthRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM public.products) as total_products,
        (SELECT COUNT(*) FROM public.products WHERE is_active = true) as active_products,
        (SELECT COUNT(*) FROM public.product_variants) as total_variants,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM public.product_variants) as total_stock_units,
        (SELECT COUNT(*) FROM public.brands) as total_brands,
        (SELECT COALESCE(ROUND(AVG(base_price)), 0) FROM public.products WHERE is_active = true AND base_price > 0) as avg_catalog_price;
    `);
    const chRow = catalogHealthRes.rows[0] || {};

    // Category breakdown
    const categoryDistRes = await query(`
      SELECT 
        COALESCE(c.slug, 'other') as slug,
        COALESCE(c.name, 'Other Eyewear') as name,
        COUNT(p.id)::int as count
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      WHERE p.is_active = true
      GROUP BY c.slug, c.name
      ORDER BY count DESC;
    `);

    // Top brands by frame count
    const topBrandsRes = await query(`
      SELECT 
        b.name,
        COUNT(p.id)::int as count
      FROM public.brands b
      JOIN public.products p ON p.brand_id = b.id
      WHERE p.is_active = true
      GROUP BY b.name
      ORDER BY count DESC
      LIMIT 6;
    `);

    // 8. RECENT REGISTERED PATRONS
    const recentPatronsRes = await query(`
      SELECT 
        id,
        phone,
        email,
        full_name,
        role,
        created_at
      FROM public.profiles
      ORDER BY created_at DESC
      LIMIT 6;
    `);

    const statsPayload = {
      totalRevenue: Number(statsRow.total_revenue || 0),
      totalOrders: Number(statsRow.total_orders || 0),
      totalCustomers,
      avgOrderValue: Math.round(Number(statsRow.avg_order_value || 0)),
      growth: {
        revenue: revenueGrowth,
        orders: ordersGrowth,
        customers: customersGrowth,
        aov: aovGrowth,
      },
    };

    const catalogHealth = {
      totalProducts: parseInt(chRow.total_products || "0", 10),
      activeProducts: parseInt(chRow.active_products || "0", 10),
      totalVariants: parseInt(chRow.total_variants || "0", 10),
      totalStockUnits: parseInt(chRow.total_stock_units || "0", 10),
      totalBrands: parseInt(chRow.total_brands || "0", 10),
      avgCatalogPrice: parseInt(chRow.avg_catalog_price || "0", 10),
      categoryDistribution: categoryDistRes.rows,
      topBrands: topBrandsRes.rows,
    };

    return NextResponse.json({
      success: true,
      stats: statsPayload,
      metrics: {
        revenue: { value: statsPayload.totalRevenue, growth: revenueGrowth },
        orders: { value: statsPayload.totalOrders, growth: ordersGrowth },
        customers: { value: statsPayload.totalCustomers, growth: customersGrowth },
        aov: { value: statsPayload.avgOrderValue, growth: aovGrowth },
      },
      statusCounts,
      recentOrders: recentOrdersRes.rows,
      salesHistory,
      topProducts,
      isCatalogShowcase,
      lowStock: lowStockRes.rows,
      catalogHealth,
      recentPatrons: recentPatronsRes.rows,
    });
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
