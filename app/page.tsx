import { getCatalogProducts } from "@/lib/productsService";
import { HomePageClient } from "@/components/home/HomePageClient";

// Incremental Static Regeneration (ISR): pre-render HTML and revalidate at edge
export const revalidate = 60;

export default async function HomePage() {
  const products = await getCatalogProducts();
  return <HomePageClient initialProducts={products} />;
}
