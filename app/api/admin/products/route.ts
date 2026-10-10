import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/pg";
import { getProducts, createProduct } from "@/lib/adminDb";
import { PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const shape = searchParams.get("shape") || "";
    const statusTab = searchParams.get("tab") || "all"; // all, published, draft, out_of_stock
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // Search filter
    if (search) {
      conditions.push(`(p.name ILIKE $${pIdx} OR p.slug ILIKE $${pIdx} OR b.name ILIKE $${pIdx} OR EXISTS (
        SELECT 1 FROM public.product_variants pv_s WHERE pv_s.product_id = p.id AND pv_s.sku ILIKE $${pIdx}
      ))`);
      params.push(`%${search}%`);
      pIdx++;
    }

    // Category filter
    if (category && category !== "all") {
      conditions.push(`c.slug = $${pIdx}`);
      params.push(category);
      pIdx++;
    }

    // Brand filter
    if (brand && brand !== "all") {
      conditions.push(`b.slug = $${pIdx}`);
      params.push(brand);
      pIdx++;
    }

    // Shape filter
    if (shape && shape !== "all") {
      conditions.push(`LOWER(p.shape) = LOWER($${pIdx})`);
      params.push(shape);
      pIdx++;
    }

    // Status Tab filter
    if (statusTab === "published") {
      conditions.push(`p.is_active = true`);
    } else if (statusTab === "draft") {
      conditions.push(`p.is_active = false`);
    } else if (statusTab === "out_of_stock") {
      conditions.push(`COALESCE((SELECT SUM(stock_quantity) FROM public.product_variants WHERE product_id = p.id), 0) = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total count for current filter
    const countRes = await query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM public.products p
       LEFT JOIN public.brands b ON b.id = p.brand_id
       LEFT JOIN public.categories c ON c.id = p.category_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Global tab counts across all 1,297 products
    const tabCountsRes = await query(`
      SELECT 
        COUNT(id) as total_all,
        COUNT(CASE WHEN is_active = true THEN 1 END) as total_published,
        COUNT(CASE WHEN is_active = false THEN 1 END) as total_draft,
        COUNT(CASE WHEN COALESCE((SELECT SUM(stock_quantity) FROM public.product_variants WHERE product_id = p.id), 0) = 0 THEN 1 END) as total_out_of_stock
      FROM public.products p;
    `);
    const tabCounts = tabCountsRes.rows[0] || { total_all: 0, total_published: 0, total_draft: 0, total_out_of_stock: 0 };

    // Fetch distinct shapes, brands, and categories for dynamic filter rail
    const shapesRes = await query(`SELECT DISTINCT shape FROM public.products WHERE shape IS NOT NULL AND shape != '' ORDER BY shape ASC`);
    const brandsRes = await query(`SELECT id, slug, name FROM public.brands ORDER BY name ASC`);
    const catsRes = await query(`SELECT id, slug, name FROM public.categories ORDER BY name ASC`);

    // Fetch paginated products with variants and primary image
    const productsRes = await query(
      `SELECT 
        p.id,
        p.slug,
        p.name,
        p.subtitle,
        p.gender,
        p.shape,
        p.rim_type,
        p.material,
        p.color,
        p.color_hex,
        p.base_price,
        p.original_price,
        p.is_active,
        p.is_new_arrival,
        p.is_best_seller,
        p.is_on_sale,
        p.try_on_enabled,
        p.try_on_model_url,
        p.try_on_configuration,
        p.created_at,
        p.updated_at,
        b.name as brand_name,
        b.slug as brand_slug,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pi.id,
            'url', pi.url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.is_primary DESC, pi.display_order ASC)
          FROM public.product_images pi
          WHERE pi.product_id = p.id
        ), '[]'::json) as images,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pv.id,
            'sku', pv.sku,
            'color_name', pv.color_name,
            'color_hex', pv.color_hex,
            'stock_quantity', pv.stock_quantity
          ) ORDER BY pv.created_at ASC)
          FROM public.product_variants pv
          WHERE pv.product_id = p.id
        ), '[]'::json) as variants,
        COALESCE((
          SELECT SUM(stock_quantity) FROM public.product_variants WHERE product_id = p.id
        ), 12) as total_stock,
        COALESCE((
          SELECT url FROM public.product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.display_order ASC 
          LIMIT 1
        ), '/images/clean_frame_1.png') as primary_image_url
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      LEFT JOIN public.categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      products: productsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: parseInt(tabCounts.total_all || "0", 10),
        published: parseInt(tabCounts.total_published || "0", 10),
        draft: parseInt(tabCounts.total_draft || "0", 10),
        outOfStock: parseInt(tabCounts.total_out_of_stock || "0", 10),
      },
      brands: brandsRes.rows,
      categories: catsRes.rows,
      shapes: shapesRes.rows.map((r: any) => r.shape),
    });
  } catch (error: any) {
    console.warn("[Products GET] Database fallback to local store:", error?.message);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const shape = searchParams.get("shape") || "";
    const tab = searchParams.get("tab") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "12", 10)));

    const result = getProducts({ search, category, brand, shape, tab, page, limit });

    return NextResponse.json({
      success: true,
      products: result.products,
      pagination: result.pagination,
      counts: result.counts,
      brands: result.brands,
      categories: result.categories,
      shapes: result.shapes,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const basePrice = Number(body.basePrice || body.base_price || 0);
    const originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    const gender = body.gender || "unisex";
    const shape = body.shape || "rectangle";
    const rimType = body.rimType || body.rim_type || "full-rim";
    const material = body.material || "acetate";
    const color = body.color || "Black";
    const colorHex = body.colorHex || body.color_hex || "#1A1816";
    const subtitle = body.subtitle || "";
    const description = body.description || "";

    try {
      const res = await query(
        `INSERT INTO public.products (
          slug, name, subtitle, gender, shape, rim_type, material, color, color_hex,
          base_price, original_price, description, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        RETURNING *;`,
        [slug, name, subtitle, gender, shape, rimType, material, color, colorHex, basePrice, originalPrice, description]
      );

      return NextResponse.json({
        success: true,
        message: "Product created successfully in database",
        product: res.rows[0],
      });
    } catch {
      const product = createProduct(body);
      return NextResponse.json({
        success: true,
        message: "Product created successfully in store",
        product,
      });
    }
  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
