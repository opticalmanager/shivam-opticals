import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const cat = createCategory(body);
    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: cat,
    });
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

    const updated = updateCategory(body.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
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

    const ok = deleteCategory(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
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
