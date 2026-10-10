import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/pg";
import { getInventory, updateStock } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // all, low, out
    const search = searchParams.get("search")?.trim() || "";

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${pIdx} OR pv.sku ILIKE $${pIdx} OR b.name ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (filter === "low") {
      conditions.push(`pv.stock_quantity <= 5 AND pv.stock_quantity > 0`);
    } else if (filter === "out") {
      conditions.push(`pv.stock_quantity = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const res = await query(
      `SELECT 
        pv.id as variant_id,
        pv.sku,
        pv.color_name,
        pv.color_hex,
        pv.stock_quantity,
        pv.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.specs,
        b.name as brand_name,
        c.name as category_name,
        COALESCE((
          SELECT url FROM public.product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.display_order ASC 
          LIMIT 1
        ), '/images/clean_frame_1.png') as image_url
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      LEFT JOIN public.brands b ON b.id = p.brand_id
      LEFT JOIN public.categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY pv.stock_quantity ASC, p.name ASC;`,
      params
    );

    // Live Stock stats across the entire 4,138-variant catalog
    const statsRes = await query(`
      SELECT 
        COUNT(pv.id) as total_skus,
        COALESCE(SUM(pv.stock_quantity), 0) as total_units,
        COUNT(CASE WHEN pv.stock_quantity <= 5 AND pv.stock_quantity > 0 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN pv.stock_quantity = 0 THEN 1 END) as out_of_stock_count
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id;
    `);

    return NextResponse.json({
      success: true,
      inventory: res.rows,
      stats: {
        totalSkus: parseInt(statsRes.rows[0]?.total_skus || "0", 10),
        totalUnits: parseInt(statsRes.rows[0]?.total_units || "0", 10),
        lowStockCount: parseInt(statsRes.rows[0]?.low_stock_count || "0", 10),
        outOfStockCount: parseInt(statsRes.rows[0]?.out_of_stock_count || "0", 10),
      },
    });
  } catch (error: any) {
    console.warn("[Inventory GET] Database fallback to local store:", error?.message);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search")?.trim() || "";

    const data = getInventory({ filter, search });

    return NextResponse.json({
      success: true,
      inventory: data.inventory,
      stats: data.stats,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, stockQuantity, delta } = body;

    if (!variantId) {
      return NextResponse.json({ success: false, error: "variantId is required" }, { status: 400 });
    }

    let updatedRes;
    if (delta !== undefined) {
      updatedRes = await query(
        `UPDATE public.product_variants
         SET stock_quantity = GREATEST(0, stock_quantity + $1), updated_at = NOW()
         WHERE id = $2
         RETURNING id, sku, stock_quantity;`,
        [Number(delta), variantId]
      );
    } else if (stockQuantity !== undefined) {
      updatedRes = await query(
        `UPDATE public.product_variants
         SET stock_quantity = GREATEST(0, $1), updated_at = NOW()
         WHERE id = $2
         RETURNING id, sku, stock_quantity;`,
        [Number(stockQuantity), variantId]
      );
    } else {
      return NextResponse.json({ success: false, error: "stockQuantity or delta required" }, { status: 400 });
    }

    if (updatedRes.rows.length === 0) {
      // Fallback update to local store
      const d = delta !== undefined ? Number(delta) : Number(stockQuantity);
      const updated = updateStock(variantId, d);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Stock updated successfully in store",
        variant: updated,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
      variant: updatedRes.rows[0],
    });
  } catch (error: any) {
    console.error("Inventory PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update stock" },
      { status: 500 }
    );
  }
}
