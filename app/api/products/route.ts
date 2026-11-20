import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, filterAndSortProducts } from "@/lib/productsService";

// Force dynamic execution for query params while leveraging Vercel Edge CDN headers
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
      return NextResponse.json(
        { product: match },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
            "CDN-Cache-Control": "public, s-maxage=300",
            "Vercel-CDN-Cache-Control": "public, s-maxage=300",
          },
        }
      );
    }

    const filtered = filterAndSortProducts(allProducts, {
      category: type || "all",
      gender: gender ? [gender as any] : undefined,
      shapes: shape ? [shape] : undefined,
      brands: brand ? [brand] : undefined,
      searchQuery: q,
      sortBy: sort,
    });

    return NextResponse.json(
      {
        success: true,
        total: filtered.length,
        products: filtered,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, s-maxage=300",
          "Vercel-CDN-Cache-Control": "public, s-maxage=300",
        },
      }
    );
  } catch (error: any) {
    console.error("[api/products] Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    );
  }
}
