import React, { Suspense } from "react";
import { PRODUCTS } from "@/data/products";
import { getProductById, getCatalogProducts } from "@/lib/productsService";
import { ProductDetailView } from "./ProductDetailView";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    id: product.id,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const allProducts = await getCatalogProducts();
  const product =
    (await getProductById(resolvedParams.id)) ||
    allProducts.find((p) => p.id === resolvedParams.id) ||
    PRODUCTS.find((p) => p.id === resolvedParams.id) ||
    PRODUCTS[0];

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductDetailView product={product} allProducts={allProducts} />
    </Suspense>
  );
}
