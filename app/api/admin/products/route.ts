import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = createProduct(body);

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
