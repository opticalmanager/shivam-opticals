import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, filterAndSortProducts } from "@/lib/productsService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const shape = searchParams.get("shape");
    const brand = searchParams.get("brand");
    const q = searchParams.get("q") || undefined;
    const sort = searchParams.get("sort") as any;

    const allProducts = await getCatalogProducts();

    if (id) {
      const match = allProducts.find((p) => p.id === id);
      if (!match) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ product: match });
    }

    const filtered = filterAndSortProducts(allProducts, {
      type,
      gender,
      shapes: shape ? [shape] : undefined,
      brands: brand ? [brand] : undefined,
      searchQuery: q,
      sortBy: sort,
    });

    return NextResponse.json({
      success: true,
      total: filtered.length,
      products: filtered,
    });
  } catch (error: any) {
    console.error("[api/products] Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    );
  }
}
