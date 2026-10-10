import { NextRequest, NextResponse } from "next/server";
import { query, getPgPool } from "@/lib/adminDb";
import { PRODUCTS } from "@/data/products";
import { invalidateProductsCache } from "@/lib/productsService";

export async function GET() {
  try {
    const countRes = await query(
      `SELECT 
        COUNT(DISTINCT p.id) as demo_count,
        COUNT(pv.id) as demo_skus,
        COALESCE(SUM(pv.stock_quantity), 0) as demo_units
      FROM public.products p
      LEFT JOIN public.product_variants pv ON pv.product_id = p.id
      WHERE p.specs->>'is_demo' = 'true'`
    );

    const sampleRes = await query(
      `SELECT 
        p.id,
        p.slug,
        p.name,
        p.base_price,
        p.gender,
        p.shape,
        p.rim_type,
        p.material,
        pv.sku,
        pv.stock_quantity,
        COALESCE((
          SELECT url FROM public.product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.display_order ASC 
          LIMIT 1
        ), '/images/placeholder.jpg') as image_url
      FROM public.products p
      LEFT JOIN public.product_variants pv ON pv.product_id = p.id
      WHERE p.specs->>'is_demo' = 'true'
      ORDER BY p.name ASC
      LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      count: parseInt(countRes.rows[0]?.demo_count || "0", 10),
      stats: {
        totalProducts: parseInt(countRes.rows[0]?.demo_count || "0", 10),
        totalSkus: parseInt(countRes.rows[0]?.demo_skus || "0", 10),
        totalUnits: parseInt(countRes.rows[0]?.demo_units || "0", 10),
      },
      items: sampleRes.rows,
    });
  } catch (error: any) {
    console.error("GET /api/admin/demo-products error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch demo products status" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch or create brand 'akoni'
    let brandRes = await client.query(
      "SELECT id FROM public.brands WHERE slug = 'akoni' LIMIT 1"
    );
    let brandId: string;
    if (brandRes.rows.length === 0) {
      const newBrand = await client.query(
        `INSERT INTO public.brands (name, slug, origin, description, tagline, is_active, display_order)
         VALUES ('Akoni', 'akoni', 'Switzerland / Japan', 'Swiss design perfection combined with Japanese artisan metalsmithing.', 'Mastery of Design & Precision Mechanics', true, 6)
         RETURNING id`
      );
      brandId = newBrand.rows[0].id;
    } else {
      brandId = brandRes.rows[0].id;
    }

    // 2. Fetch categories map
    const catRes = await client.query("SELECT id, slug FROM public.categories");
    const catMap: Record<string, string> = {};
    catRes.rows.forEach((r: { id: string; slug: string }) => {
      catMap[r.slug] = r.id;
    });

    const defaultSunglassesId = catMap["sunglasses"] || catRes.rows[0]?.id;
    const defaultEyeglassesId = catMap["eyeglasses"] || catRes.rows[0]?.id;

    // 3. Clear any existing demo products before re-seeding
    await client.query("DELETE FROM public.products WHERE specs->>'is_demo' = 'true'");

    let insertedCount = 0;

    for (const item of PRODUCTS) {
      const categoryId = item.category === "eyeglasses"
        ? defaultEyeglassesId
        : (item.category === "contact-lenses" ? (catMap["contact-lenses"] || defaultSunglassesId) : defaultSunglassesId);

      // Insert product
      const prodRes = await client.query(
        `INSERT INTO public.products (
          slug,
          name,
          subtitle,
          brand_id,
          category_id,
          gender,
          shape,
          rim_type,
          material,
          color,
          color_hex,
          base_price,
          original_price,
          lens_properties,
          specs,
          description,
          is_new_arrival,
          is_best_seller,
          is_on_sale,
          is_limited_edition,
          is_active,
          rating,
          review_count,
          try_on_enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name, base_price = EXCLUDED.base_price, specs = EXCLUDED.specs
        RETURNING id`,
        [
          item.id,
          item.name,
          item.subtitle || item.name,
          brandId,
          categoryId,
          item.gender || "unisex",
          item.shape || "rectangle",
          item.rimType || "full-rim",
          item.material || "acetate",
          item.color || "Black",
          item.colorHex || "#1A1A1A",
          item.price,
          item.originalPrice || null,
          item.lensProperties || ["anti-reflective", "uv-protection"],
          JSON.stringify({ ...item.specs, is_demo: false, packageDimensions: item.packageDimensions, contactLensSpecs: item.contactLensSpecs }),
          item.description || "",
          Boolean(item.isNewArrival),
          Boolean(item.isBestSeller),
          Boolean(item.isOnSale),
          Boolean(item.isLimitedEdition),
          true,
          item.rating || 4.9,
          item.reviewCount || 18,
          Boolean(item.tryOnEnabled),
        ]
      );

      const productId = prodRes.rows[0].id;

      // Insert variants and images
      const variantsToInsert = item.variants && item.variants.length > 0 ? item.variants : [
        { id: `VAR-${item.id}-0`, colorName: item.color || "Classic", colorHex: item.colorHex || "#1A1A1A", image: item.images?.[0] || "", inStock: true }
      ];

      for (let vIdx = 0; vIdx < variantsToInsert.length; vIdx++) {
        const v = variantsToInsert[vIdx];
        const variantRes = await client.query(
          `INSERT INTO public.product_variants (
            product_id,
            color_name,
            color_hex,
            sku,
            stock_quantity,
            is_default
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            productId,
            v.colorName || "Classic",
            v.colorHex || "#1A1A1A",
            v.id || `SKU-${item.id}-${vIdx}`,
            12,
            vIdx === 0,
          ]
        );
        const variantId = variantRes.rows[0].id;

        const imgUrl = v.image || item.images?.[0];
        if (imgUrl) {
          await client.query(
            `INSERT INTO public.product_images (
              product_id,
              variant_id,
              url,
              alt_text,
              display_order,
              is_primary
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              productId,
              variantId,
              imgUrl,
              `${item.name} - ${v.colorName}`,
              vIdx,
              vIdx === 0,
            ]
          );
        }
      }

      insertedCount++;
    }

    await client.query("COMMIT");
    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Successfully seeded ${insertedCount} catalog products into database.`,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/admin/demo-products error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to seed demo products" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE() {
  try {
    const res = await query(
      "DELETE FROM public.products WHERE specs->>'is_demo' = 'true' RETURNING id"
    );

    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      deletedCount: res.rowCount || 0,
      message: `Successfully purged ${res.rowCount || 0} demo products and all associated variants/images.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/demo-products error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete demo products" },
      { status: 500 }
    );
  }
}
