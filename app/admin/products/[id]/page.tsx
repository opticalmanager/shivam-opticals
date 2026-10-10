"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { Loader2 } from "lucide-react";
import { Product } from "@/types";

export default function AdminEditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
    ])
      .then(([prodData, catData, brandData]) => {
        if (prodData.success && prodData.product) setProduct(prodData.product);
        if (catData.success) setCategories(catData.categories || []);
        if (brandData.success) setBrands(brandData.brands || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Product not found.
      </div>
    );
  }

  return (
    <ProductForm
      initialData={product}
      categories={categories}
      brands={brands}
      isEdit={true}
    />
  );
}
