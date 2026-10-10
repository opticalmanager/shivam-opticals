"use client";

import React, { useState, useEffect } from "react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { Loader2 } from "lucide-react";

export default function AdminNewProductPage() {
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
    ])
      .then(([catData, brandData]) => {
        if (catData.success) setCategories(catData.categories || []);
        if (brandData.success) setBrands(brandData.brands || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <ProductForm
      categories={categories}
      brands={brands}
      isEdit={false}
    />
  );
}
