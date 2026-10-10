import React from "react";
import { PRODUCTS } from "@/data/products";
import { getProductById } from "@/lib/productsService";
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
  const product =
    (await getProductById(resolvedParams.id)) ||
    PRODUCTS.find((p) => p.id === resolvedParams.id) ||
    PRODUCTS[0];

  return <ProductDetailView product={product} />;
}
