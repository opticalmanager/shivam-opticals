import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/data/products";
import { getProductById, getCatalogProducts } from "@/lib/productsService";
import { ProductDetailView } from "./ProductDetailView";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    id: product.id,
  }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const allProducts = await getCatalogProducts();
    const product =
      (await getProductById(resolvedParams.id)) ||
      allProducts.find((p) => p.id === resolvedParams.id) ||
      PRODUCTS.find((p) => p.id === resolvedParams.id);

    if (!product) {
      return {
        title: "Eyewear Model",
        description: "Explore handcrafted optical frames and luxury eyewear at Shivam Optical.",
      };
    }

    const brand = product.brand || "Shivam Optical";
    const title = `${product.name} | ${brand} Eyewear`;
    const frameShape = product.shape ? ` in ${product.shape} silhouette` : "";
    const priceStr = Number(product.price || 0).toLocaleString("en-IN");
    const description = `${product.name} by ${brand}${frameShape}. Handcrafted optical frame with precision clinical power lenses starting at ₹${priceStr}. Pan-India express dispatch & 14-day returns from Shivam Optical Atelier.`;
    const canonicalUrl = `https://shivamoptical.in/product/${product.id}`;
    const displayImage = product.img || product.images?.[0] || "https://shivamoptical.in/images/clean_frame_1.png";

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Shivam Optical",
        images: [
          {
            url: displayImage,
            width: 800,
            height: 600,
            alt: `${product.name} - ${brand}`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [displayImage],
      },
    };
  } catch (err) {
    console.warn("Failed to generate metadata for product:", err);
    return {
      title: "Eyewear Collection",
      description: "Explore handcrafted optical frames and luxury eyewear at Shivam Optical.",
    };
  }
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
    PRODUCTS.find((p) => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Schema.org Product Structured Data for Google Rich Snippets
  const displayImage = product.img || product.images?.[0] || "https://shivamoptical.in/images/clean_frame_1.png";
  const productImages = [
    displayImage,
    ...(product.images || []),
  ].filter((url, idx, arr) => arr.indexOf(url) === idx);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: productImages,
    description:
      product.description ||
      `${product.name} by ${product.brand || "Shivam Optical"}. Luxury optical frame crafted for everyday comfort and optical clarity.`,
    sku: (product as { sku?: string }).sku || product.id,
    mpn: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Shivam Optical",
    },
    offers: {
      "@type": "Offer",
      url: `https://shivamoptical.in/product/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Shivam Optical",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating || 4.9).toFixed(1),
      reviewCount: product.reviewCount || 146,
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <>
      {/* Google Rich Snippet JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProductDetailView product={product} allProducts={allProducts} />
      </Suspense>
    </>
  );
}
