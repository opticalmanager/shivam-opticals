import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/pg";
import { invalidateProductsCache } from "@/lib/productsService";

export const dynamic = "force-dynamic";

interface PricingSettings {
  defaultDiscountPercent: number;
  roundingRule: "nearest_integer" | "round_to_99" | "none";
  autoApplyOnCreate: boolean;
  updatedAt?: string;
}

const DEFAULT_PRICING: PricingSettings = {
  defaultDiscountPercent: 10,
  roundingRule: "nearest_integer",
  autoApplyOnCreate: true,
};

export async function GET() {
  try {
    const res = await query(`SELECT value FROM public.admin_settings WHERE key = 'pricing' LIMIT 1;`);
    let config: PricingSettings = DEFAULT_PRICING;

    if (res.rows.length > 0) {
      const raw = res.rows[0].value;
      config = typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    const countRes = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN original_price IS NOT NULL AND original_price > base_price THEN 1 END) as discounted_products,
        AVG(CASE WHEN original_price > base_price THEN ROUND(((original_price - base_price) / original_price) * 100) END) as avg_discount_pct
      FROM public.products
      WHERE is_active = true AND base_price IS NOT NULL AND base_price > 0;
    `);

    return NextResponse.json({
      success: true,
      pricing: config,
      stats: {
        totalProducts: parseInt(countRes.rows[0]?.total_products || "0", 10),
        discountedProducts: parseInt(countRes.rows[0]?.discounted_products || "0", 10),
        averageDiscountPct: Math.round(Number(countRes.rows[0]?.avg_discount_pct || 0)),
      },
    });
  } catch (error: any) {
    console.error("[PRICING-API] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const discountPct = Number(body.defaultDiscountPercent);

    if (isNaN(discountPct) || discountPct < 0 || discountPct >= 100) {
      return NextResponse.json(
        { success: false, error: "Discount percentage must be between 0 and 99." },
        { status: 400 }
      );
    }

    const config: PricingSettings = {
      defaultDiscountPercent: discountPct,
      roundingRule: body.roundingRule || "nearest_integer",
      autoApplyOnCreate: body.autoApplyOnCreate !== undefined ? Boolean(body.autoApplyOnCreate) : true,
      updatedAt: new Date().toISOString(),
    };

    await query(
      `INSERT INTO public.admin_settings (key, value, updated_at)
       VALUES ('pricing', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [JSON.stringify(config)]
    );

    return NextResponse.json({
      success: true,
      message: "Pricing settings saved successfully",
      pricing: config,
    });
  } catch (error: any) {
    console.error("[PRICING-API] PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "recalculate_all";

    if (action === "recalculate_all") {
      let discountPct = Number(body.discountPercent);

      if (isNaN(discountPct) || discountPct < 0 || discountPct >= 100) {
        // Read from DB settings if not passed
        const sRes = await query(`SELECT value FROM public.admin_settings WHERE key = 'pricing' LIMIT 1;`);
        if (sRes.rows.length > 0) {
          const val = typeof sRes.rows[0].value === "string" ? JSON.parse(sRes.rows[0].value) : sRes.rows[0].value;
          discountPct = Number(val.defaultDiscountPercent || 10);
        } else {
          discountPct = 10;
        }
      }

      // If discount is 0, original_price equals base_price or null
      let updateSql: string;
      let params: any[] = [];

      if (discountPct === 0) {
        updateSql = `
          UPDATE public.products
          SET original_price = NULL,
              updated_at = NOW()
          WHERE is_active = true AND base_price IS NOT NULL AND base_price > 0;
        `;
      } else {
        const factor = 1.0 - (discountPct / 100.0);
        updateSql = `
          UPDATE public.products
          SET original_price = ROUND(base_price / $1::numeric),
              updated_at = NOW()
          WHERE is_active = true AND base_price IS NOT NULL AND base_price > 0;
        `;
        params = [factor];
      }

      const res = await query(updateSql, params);

      // Invalidate memory cache so storefront immediately shows updated prices
      invalidateProductsCache();

      return NextResponse.json({
        success: true,
        message: `Successfully updated MRP for ${res.rowCount} products using ${discountPct}% discount on MRP.`,
        updatedCount: res.rowCount,
        discountPercent: discountPct,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[PRICING-API] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
