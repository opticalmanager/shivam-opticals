import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/pg";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM public.categories c
       LEFT JOIN public.products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC;`
    );

    return NextResponse.json({
      success: true,
      categories: res.rows,
    });
  } catch (error: any) {
    console.warn("[Categories GET] Database fallback:", error?.message);
    const categories = getCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const description = body.description || "";
    const displayOrder = Number(body.displayOrder || body.display_order || 0);
    const isActive = body.isActive !== undefined ? body.isActive : true;

    try {
      const res = await query(
        `INSERT INTO public.categories (slug, name, description, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active
         RETURNING *;`,
        [slug, name, description, displayOrder, isActive]
      );

      return NextResponse.json({
        success: true,
        message: "Category saved successfully in database",
        category: res.rows[0],
      });
    } catch {
      const cat = createCategory(body);
      return NextResponse.json({
        success: true,
        message: "Category created successfully in store",
        category: cat,
      });
    }
  } catch (error: any) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    try {
      const res = await query(
        `UPDATE public.categories
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             display_order = COALESCE($3, display_order),
             is_active = COALESCE($4, is_active),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *;`,
        [body.name, body.description, body.display_order ?? body.displayOrder, body.is_active ?? body.isActive, body.id]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Category updated successfully",
        category: res.rows[0],
      });
    } catch {
      const updated = updateCategory(body.id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Category updated successfully",
        category: updated,
      });
    }
  } catch (error: any) {
    console.error("Categories PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    try {
      await query(`DELETE FROM public.categories WHERE id = $1;`, [id]);
    } catch {
      deleteCategory(id);
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("Categories DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
