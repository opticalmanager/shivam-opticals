import { Suspense } from "react";
import { getCatalogProducts } from "@/lib/productsService";
import { CatalogClient } from "@/components/products/CatalogClient";
import { CatalogLoadingSkeleton } from "@/components/products/CatalogLoadingSkeleton";

// Incremental Static Regeneration (ISR): pre-render HTML and revalidate at edge
export const revalidate = 60;

export default async function ProductsPage() {
  const initialProducts = await getCatalogProducts();

  return (
    <Suspense fallback={<CatalogLoadingSkeleton />}>
      <CatalogClient initialProducts={initialProducts} />
    </Suspense>
  );
}
