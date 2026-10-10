import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/pg";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/lib/adminDb";
import { LUXURY_BRANDS } from "@/data/brands";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await query(
      `SELECT b.*, COUNT(p.id) as product_count
       FROM public.brands b
       LEFT JOIN public.products p ON p.brand_id = b.id
       GROUP BY b.id
       ORDER BY b.is_featured DESC, b.name ASC;`
    );

    return NextResponse.json({
      success: true,
      brands: res.rows,
    });
  } catch (error: any) {
    console.warn("[Brands GET] Database fallback:", error?.message);
    const brands = getBrands();
    return NextResponse.json({
      success: true,
      brands,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "Brand name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const origin = body.origin || "";
    const tagline = body.tagline || "";
    const description = body.description || "";
    const isFeatured = Boolean(body.isFeatured || body.is_featured);
    const isActive = body.isActive !== undefined ? body.isActive : true;

    try {
      const res = await query(
        `INSERT INTO public.brands (slug, name, origin, tagline, description, is_featured, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, origin = EXCLUDED.origin, tagline = EXCLUDED.tagline,
             description = EXCLUDED.description, is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active
         RETURNING *;`,
        [slug, name, origin, tagline, description, isFeatured, isActive]
      );

      return NextResponse.json({
        success: true,
        message: "Brand saved successfully in database",
        brand: res.rows[0],
      });
    } catch {
      const brand = createBrand(body);
      return NextResponse.json({
        success: true,
        message: "Brand created successfully in store",
        brand,
      });
    }
  } catch (error: any) {
    console.error("Brands POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Brand ID is required" }, { status: 400 });
    }

    try {
      const res = await query(
        `UPDATE public.brands 
         SET name = COALESCE($1, name),
             origin = COALESCE($2, origin),
             tagline = COALESCE($3, tagline),
             description = COALESCE($4, description),
             is_featured = COALESCE($5, is_featured),
             is_active = COALESCE($6, is_active),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *;`,
        [body.name, body.origin, body.tagline, body.description, body.is_featured ?? body.isFeatured, body.is_active ?? body.isActive, body.id]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Brand updated successfully",
        brand: res.rows[0],
      });
    } catch {
      const updated = updateBrand(body.id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Brand updated successfully",
        brand: updated,
      });
    }
  } catch (error: any) {
    console.error("Brands PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Brand ID is required" }, { status: 400 });
    }

    try {
      await query(`DELETE FROM public.brands WHERE id = $1;`, [id]);
    } catch {
      deleteBrand(id);
    }

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error: any) {
    console.error("Brands DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
