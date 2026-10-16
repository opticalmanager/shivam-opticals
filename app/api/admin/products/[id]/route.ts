import { NextRequest, NextResponse } from "next/server";
import { query, runTransaction } from "@/lib/db";
import { PoolClient } from "pg";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await query(
      `SELECT 
        p.*,
        b.name as brand_name,
        b.slug as brand_slug,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pv.id,
            'sku', pv.sku,
            'color_name', pv.color_name,
            'color_hex', pv.color_hex,
            'stock_quantity', pv.stock_quantity,
            'price_override', pv.price_override,
            'is_default', pv.is_default
          ) ORDER BY pv.created_at ASC)
          FROM public.product_variants pv
          WHERE pv.product_id = p.id
        ), '[]'::json) as variants,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pi.id,
            'url', pi.url,
            'alt_text', pi.alt_text,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.is_primary DESC, pi.display_order ASC)
          FROM public.product_images pi
          WHERE pi.product_id = p.id
        ), '[]'::json) as images,
        COALESCE((
          SELECT SUM(stock_quantity) FROM public.product_variants WHERE product_id = p.id
        ), 10) as total_stock
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      LEFT JOIN public.categories c ON c.id = p.category_id
      WHERE p.id::text = $1 OR p.slug = $1
      LIMIT 1;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const row = res.rows[0];

    // Format for ProductForm consumption
    const product = {
      ...row,
      price: Number(row.base_price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      brand: row.brand_slug || row.brand_name || "cartier",
      category: row.category_slug || row.category_name || "eyeglasses",
      images: Array.isArray(row.images) && row.images.length > 0 ? row.images.map((img: any) => img.url) : [],
    };

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await runTransaction(async (client: PoolClient) => {
      // 1. Identify product
      const findRes = await client.query(
        `SELECT id, brand_id, category_id FROM public.products WHERE id::text = $1 OR slug = $1 LIMIT 1;`,
        [id]
      );
      if (findRes.rows.length === 0) {
        throw new Error("Product not found");
      }
      const existing = findRes.rows[0];
      const productId = existing.id;

      // 2. Resolve brand_id if brand slug or name provided
      let brandId = existing.brand_id;
      if (body.brand) {
        const brandRes = await client.query(
          `SELECT id FROM public.brands WHERE slug = $1 OR name ILIKE $1 LIMIT 1;`,
          [body.brand]
        );
        if (brandRes.rows.length > 0) {
          brandId = brandRes.rows[0].id;
        }
      }

      // 3. Resolve category_id if category slug or name provided
      let categoryId = existing.category_id;
      if (body.category) {
        const catRes = await client.query(
          `SELECT id FROM public.categories WHERE slug = $1 OR name ILIKE $1 LIMIT 1;`,
          [body.category]
        );
        if (catRes.rows.length > 0) {
          categoryId = catRes.rows[0].id;
        }
      }

      // 4. Update core product attributes
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      let pIdx = 1;

      const addField = (col: string, val: any) => {
        if (val !== undefined) {
          updateFields.push(`${col} = $${pIdx}`);
          updateParams.push(val);
          pIdx++;
        }
      };

      addField("name", body.name?.trim());
      addField("subtitle", body.subtitle?.trim());
      addField("description", body.description);
      addField("base_price", body.basePrice !== undefined ? Number(body.basePrice) : (body.base_price !== undefined ? Number(body.base_price) : undefined));
      addField("original_price", body.originalPrice !== undefined ? (body.originalPrice ? Number(body.originalPrice) : null) : undefined);
      addField("gender", body.gender);
      addField("shape", body.shape);
      addField("rim_type", body.rimType || body.rim_type);
      addField("material", body.material);
      addField("color", body.color);
      addField("color_hex", body.colorHex || body.color_hex);
      addField("is_active", body.isActive !== undefined ? Boolean(body.isActive) : (body.is_active !== undefined ? Boolean(body.is_active) : undefined));
      addField("is_new_arrival", body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : (body.is_new_arrival !== undefined ? Boolean(body.is_new_arrival) : undefined));
      addField("is_best_seller", body.isBestSeller !== undefined ? Boolean(body.isBestSeller) : (body.is_best_seller !== undefined ? Boolean(body.is_best_seller) : undefined));
      addField("try_on_enabled", body.tryOnEnabled !== undefined ? Boolean(body.tryOnEnabled) : (body.try_on_enabled !== undefined ? Boolean(body.try_on_enabled) : undefined));
      addField("try_on_model_url", body.tryOnModelUrl !== undefined ? body.tryOnModelUrl : body.try_on_model_url);
      if (body.tryOnConfiguration || body.tryOnConfig) {
        addField("try_on_configuration", JSON.stringify(body.tryOnConfiguration || body.tryOnConfig));
      }
      if (body.specs) {
        addField("specs", JSON.stringify(body.specs));
      }
      if (body.lensProperties || body.lens_properties) {
        addField("lens_properties", body.lensProperties || body.lens_properties);
      }
      if (brandId) addField("brand_id", brandId);
      if (categoryId) addField("category_id", categoryId);

      updateFields.push(`updated_at = NOW()`);
      updateParams.push(productId);

      const productUpdateRes = await client.query(
        `UPDATE public.products
         SET ${updateFields.join(", ")}
         WHERE id = $${pIdx}
         RETURNING *;`,
        updateParams
      );

      // 5. Sync variants if provided
      if (Array.isArray(body.variants) && body.variants.length > 0) {
        for (const v of body.variants) {
          const sku = v.sku || `${productUpdateRes.rows[0].slug}-${(v.color_name || "blk").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
          const stock = Number(v.stock_quantity ?? v.stock ?? 10);
          const colorName = v.color_name || v.colorName || body.color || "Standard";
          const colorHex = v.color_hex || v.colorHex || body.colorHex || "#1A1816";

          if (v.id) {
            await client.query(
              `UPDATE public.product_variants
               SET color_name = $1, color_hex = $2, sku = $3, stock_quantity = $4, updated_at = NOW()
               WHERE id = $5 AND product_id = $6;`,
              [colorName, colorHex, sku, stock, v.id, productId]
            );
          } else {
            await client.query(
              `INSERT INTO public.product_variants (product_id, color_name, color_hex, sku, stock_quantity)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (sku) DO UPDATE
               SET stock_quantity = EXCLUDED.stock_quantity, updated_at = NOW();`,
              [productId, colorName, colorHex, sku, stock]
            );
          }
        }
      } else if (body.stock !== undefined) {
        // Simple stock update on default variant
        await client.query(
          `UPDATE public.product_variants
           SET stock_quantity = $1, updated_at = NOW()
           WHERE product_id = $2;`,
          [Number(body.stock), productId]
        );
      }

      // 6. Sync images if provided
      if (Array.isArray(body.images) && body.images.length > 0) {
        await client.query(`DELETE FROM public.product_images WHERE product_id = $1;`, [productId]);
        for (let i = 0; i < body.images.length; i++) {
          const url = typeof body.images[i] === "string" ? body.images[i] : body.images[i].url;
          if (url) {
            await client.query(
              `INSERT INTO public.product_images (product_id, url, display_order, is_primary)
               VALUES ($1, $2, $3, $4);`,
              [productId, url, i, i === 0]
            );
          }
        }
      }

      return productUpdateRes.rows[0];
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully in PostgreSQL",
      product: result,
    });
  } catch (error: any) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product" },
      { status: error?.message === "Product not found" ? 404 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete/archive by setting is_active = false
    const res = await query(
      `UPDATE public.products
       SET is_active = false, updated_at = NOW()
       WHERE id::text = $1 OR slug = $1
       RETURNING id, name, is_active;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
      product: res.rows[0],
    });
  } catch (error: any) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to archive product" },
      { status: 500 }
    );
  }
}
