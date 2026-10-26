import { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/productsService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://shivamoptical.in";
  const currentDate = new Date().toISOString();

  // Core storefront routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic 170+ product routes
  try {
    const products = await getCatalogProducts();
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to load products for sitemap:", error);
    return staticRoutes;
  }
}
