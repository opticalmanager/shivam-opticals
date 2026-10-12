"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Glasses,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Check,
  Loader2,
  Box,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { invalidateProductsCache } from "@/lib/productsService";

interface ProductFormProps {
  initialData?: any;
  categories: { id: string; slug: string; name: string }[];
  brands: { id: string; slug: string; name: string }[];
  isEdit?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  brands,
  isEdit = false,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "pricing" | "specs" | "variants">("basic");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dynamic Brand & Category Lists
  const [brandList, setBrandList] = useState(brands);
  const [categoryList, setCategoryList] = useState(categories);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", origin: "", tagline: "" });
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    subtitle: initialData?.subtitle || "",
    brand: initialData?.brand_slug || initialData?.brand || (brands[0]?.slug || "cartier"),
    category: initialData?.category_slug || initialData?.category || (categories[0]?.slug || "eyeglasses"),
    gender: initialData?.gender || "unisex",
    shape: initialData?.shape || "rectangle",
    rimType: initialData?.rim_type || initialData?.rimType || "rimless",
    material: initialData?.material || "acetate",
    color: initialData?.color || "Black",
    colorHex: initialData?.color_hex || initialData?.colorHex || "#1A1A1A",
    basePrice: initialData?.base_price || initialData?.price || 1990,
    originalPrice: initialData?.original_price || initialData?.originalPrice || "",
    stock: initialData?.total_stock || initialData?.stock || 12,
    description: initialData?.description || "",
    isActive: initialData?.is_active !== undefined ? initialData.is_active : true,
    isNewArrival: initialData?.is_new_arrival || initialData?.tag === "NEW ARRIVAL" || false,
    isBestSeller: initialData?.is_best_seller || false,
    tryOnEnabled: initialData?.try_on_enabled ?? initialData?.tryOnEnabled ?? false,
    tryOnModelUrl: initialData?.try_on_model_url || initialData?.tryOnModelUrl || "",
    tryOnConfiguration: initialData?.try_on_configuration || initialData?.tryOnConfig || null,
    lensProperties: initialData?.lens_properties || ["uv-protection", "anti-reflective"],
    specs: initialData?.specs || {
      lensWidth: initialData?.measurements?.lensWidth || 53,
      bridgeWidth: initialData?.measurements?.bridgeWidth || 18,
      templeLength: initialData?.measurements?.templeLength || 145,
      frameWidth: 140,
      weight: "22g",
    },
    packageDimensions: initialData?.package_dimensions || initialData?.packageDimensions || {
      lengthCm: 18,
      breadthCm: 9,
      heightCm: 7,
      weightKg: 0.25,
    },
  });

  // Images State
  const [images, setImages] = useState<string[]>(
    initialData?.images?.map((img: any) => (typeof img === "string" ? img : img.url)) ||
      (initialData?.img ? [initialData.img] : [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
      ])
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Variants State
  const [variants, setVariants] = useState<any[]>(
    initialData?.variants?.map((v: any) => ({
      id: v.id,
      colorName: v.color_name || v.colorName,
      colorHex: v.color_hex || v.colorHex,
      sku: v.sku || `SKU-${(initialData?.slug || "SHIV").slice(0, 6).toUpperCase()}-01`,
      stock: v.stock_quantity ?? v.stock ?? 10,
    })) || [
      {
        colorName: "Gold / Deep Emerald",
        colorHex: "#C5A059",
        sku: `SKU-${(initialData?.slug || "SHIV").slice(0, 6).toUpperCase()}-01`,
        stock: 10,
      },
    ]
  );

  // File Upload to Cloudflare R2
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "products");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImages((prev) => [...prev, data.url]);
        toast.success("Image uploaded directly to Cloudflare R2 CDN");
      } else {
        toast.error("Upload failed", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Upload error", { description: err.message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        colorName: "Platinum Silver",
        colorHex: "#C0C0C0",
        sku: `SKU-${(formData.slug || "SHIV").slice(0, 6).toUpperCase()}-0${prev.length + 1}`,
        stock: 8,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setCreatingBrand(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBrand),
      });
      const data = await res.json();
      if (data.success && data.brand) {
        const created = data.brand;
        setBrandList((prev) => [...prev, created]);
        setFormData((prev) => ({ ...prev, brand: created.slug }));
        setShowBrandModal(false);
        setNewBrand({ name: "", origin: "", tagline: "" });
        toast.success(`Brand "${created.name}" created and selected`);
      } else {
        toast.error("Failed to create brand", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error creating brand", { description: err.message });
    } finally {
      setCreatingBrand(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setCreatingCat(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      const data = await res.json();
      if (data.success && data.category) {
        const created = data.category;
        setCategoryList((prev) => [...prev, created]);
        setFormData((prev) => ({ ...prev, category: created.slug }));
        setShowCatModal(false);
        setNewCat({ name: "", description: "" });
        toast.success(`Category "${created.name}" created and selected`);
      } else {
        toast.error("Failed to create category", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error creating category", { description: err.message });
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setSaving(true);
    const payload = {
      ...formData,
      images,
      variants,
    };

    try {
      const endpoint = isEdit
        ? `/api/admin/products/${initialData.id}`
        : `/api/admin/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        invalidateProductsCache();
        toast.success(isEdit ? "Product updated successfully" : "Product created in catalog");
        router.push("/admin/products");
      } else {
        toast.error("Failed to save product", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error saving product", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCF]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 rounded-md hover:bg-black/5 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-[#0A251C] font-serif">
              {isEdit ? `Edit Product: ${formData.name}` : "Create New Eyewear Product"}
            </h1>
            <p className="text-xs text-stone-500">
              Configure luxury frame specifications, optical properties, and high-res media
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products")}
            className="text-xs bg-white border-[#E8DCCF] text-stone-700 hover:bg-[#FAF7F2] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>{isEdit ? "Update Product" : "Publish Product"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#E8DCCF] text-xs font-medium overflow-x-auto">
        {[
          { id: "basic", label: "1. Basic Details", icon: Layers },
          { id: "media", label: "2. Product Media & 3D VTO", icon: ImageIcon },
          { id: "pricing", label: "3. Pricing & Stock", icon: DollarSign },
          { id: "specs", label: "4. Optical Specifications & Packaging", icon: Glasses },
          { id: "variants", label: "5. Color Variants", icon: Plus },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#C5A059] text-[#0A251C] font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC DETAILS */}
      {activeTab === "basic" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Product Title / Frame Model *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cartier Première CT0012O 001"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Subtitle / Marketing Tagline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Hand-Polished 18k Gold Electroplated Rimless"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                URL Slug (auto-generated if blank)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. cartier-premiere-ct0012o"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Luxury Brand *
                </label>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(true)}
                  className="text-[11px] font-semibold text-[#C5A059] hover:text-[#9A4C16] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Brand</span>
                </button>
              </div>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                {brandList.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatModal(true)}
                  className="text-[11px] font-semibold text-[#C5A059] hover:text-[#9A4C16] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Category</span>
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                {categoryList.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Target Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Junior / Kids</option>
              </select>
            </div>

            <div className="sm:col-span-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg p-4 space-y-3">
              <div className="text-xs font-bold text-[#0A251C] uppercase tracking-wider">
                Storefront Merchandising &amp; Placement Flags
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer p-3 rounded-md bg-white border border-[#E8DCCF] hover:border-[#C5A059]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mt-0.5 rounded text-[#C5A059] focus:ring-[#C5A059] accent-[#C5A059]"
                  />
                  <div>
                    <span className="font-semibold block text-[#0A251C]">Published in Catalog</span>
                    <span className="text-[11px] text-stone-500">Enable customers to browse, view, and purchase this frame.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer p-3 rounded-md bg-white border border-[#E8DCCF] hover:border-[#C5A059]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="mt-0.5 rounded text-[#C5A059] focus:ring-[#C5A059] accent-[#C5A059]"
                  />
                  <div>
                    <span className="font-semibold block text-[#0A251C]">Show in &quot;New Arrivals&quot;</span>
                    <span className="text-[11px] text-stone-500">
                      Flag as a new arrival: frame appears in New In collections across the storefront.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Atelier Narrative &amp; Detailed Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe craftsmanship, titanium construction, hinge technology, and luxury pedigree..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MEDIA & 3D VTO */}
      {activeTab === "media" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Cloudflare R2 Object Storage &amp; Gallery
            </h3>
            <p className="text-xs text-stone-500">
              Upload high-resolution luxury product photographs directly to the global R2 CDN.
            </p>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-[#E8DCCF] rounded-xl p-6 text-center bg-[#FAF7F2] hover:bg-[#FAF3EB] transition-colors">
            <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-[#0A251C] mb-1">
              Upload frame photos to Cloudflare R2 CDN
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Supports PNG, JPG, WEBP with transparent or luxury studio background
            </p>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A251C] text-[#FAF7F2] text-xs font-medium cursor-pointer hover:bg-[#143e30] transition-colors">
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to R2...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>

          {/* Or Add Image URL */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste external image URL (e.g. Unsplash, CDN URL)..."
              className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddImageUrl}
              className="text-xs bg-stone-700 hover:bg-stone-800 text-white cursor-pointer"
            >
              Add URL
            </Button>
          </div>

          {/* Image Thumbnails Gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-3">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-lg border border-[#E8DCCF] overflow-hidden bg-[#FAF7F2] flex items-center justify-center p-1"
              >
                <img
                  src={url}
                  alt={`Angle ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-[#C5A059] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRICING & INVENTORY */}
      {activeTab === "pricing" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Base Price (INR ₹) *
              </label>
              <input
                type="number"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Original MRP / Cross-out Price (INR ₹)
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="Optional higher retail price"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Initial Stock Units
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPTICAL SPECIFICATIONS & PACKAGING */}
      {activeTab === "specs" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Optical Geometry &amp; Physical Dimensions
            </h3>
            <p className="text-xs text-stone-500">
              Crucial millimetric specifications for optician surfacing and customer fit.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Frame Shape
              </label>
              <select
                value={formData.shape}
                onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              >
                <option value="rectangle">Rectangle</option>
                <option value="aviator">Aviator</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
                <option value="cat-eye">Cat-Eye</option>
                <option value="geometric">Geometric</option>
                <option value="oval">Oval</option>
                <option value="wayfarer">Wayfarer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Rim Type
              </label>
              <select
                value={formData.rimType}
                onChange={(e) => setFormData({ ...formData, rimType: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              >
                <option value="rimless">Rimless (Minimalist)</option>
                <option value="full-rim">Full Rim</option>
                <option value="half-rim">Half Rim</option>
                <option value="semi-rimless">Semi-Rimless</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Material
              </label>
              <select
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              >
                <option value="titanium">Japanese Beta Titanium</option>
                <option value="acetate">Mazzucchelli Acetate</option>
                <option value="18k-gold-plated">18k Gold Plated</option>
                <option value="metal">Monel &amp; Stainless Steel</option>
                <option value="horn">Natural Buffalo Horn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Weight (grams)
              </label>
              <input
                type="text"
                value={formData.specs?.weight || "20g"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specs: { ...formData.specs, weight: e.target.value },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lens Width (mm)
              </label>
              <input
                type="number"
                value={formData.specs?.lensWidth || 53}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specs: { ...formData.specs, lensWidth: Number(e.target.value) },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Bridge Width (mm)
              </label>
              <input
                type="number"
                value={formData.specs?.bridgeWidth || 18}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specs: { ...formData.specs, bridgeWidth: Number(e.target.value) },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Temple Length (mm)
              </label>
              <input
                type="number"
                value={formData.specs?.templeLength || 145}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specs: { ...formData.specs, templeLength: Number(e.target.value) },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Frame Width (mm)
              </label>
              <input
                type="number"
                value={formData.specs?.frameWidth || 140}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specs: { ...formData.specs, frameWidth: Number(e.target.value) },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>
          </div>

          {/* Shiprocket Logistics Package Dimensions */}
          <div className="pt-4 border-t border-[#E8DCCF]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Shiprocket Logistics &amp; Shipping Dimensions
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Automated package dimensions sent to Shiprocket API for courier routing and dead-weight calculation.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageDimensions?.lengthCm || 18}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageDimensions: {
                        ...formData.packageDimensions,
                        lengthCm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Breadth (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageDimensions?.breadthCm || 9}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageDimensions: {
                        ...formData.packageDimensions,
                        breadthCm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageDimensions?.heightCm || 7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageDimensions: {
                        ...formData.packageDimensions,
                        heightCm: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dead Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.packageDimensions?.weightKg || 0.25}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packageDimensions: {
                        ...formData.packageDimensions,
                        weightKg: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COLOR VARIANTS */}
      {activeTab === "variants" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Color Variants &amp; SKU Stock
              </h3>
              <p className="text-xs text-stone-500">
                Manage distinct finishes, hardware colors, and individual inventory allocations.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddVariant}
              className="text-xs bg-[#0A251C] hover:bg-[#143e30] text-[#FAF7F2] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Variant</span>
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={v.id || idx}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={v.colorHex || "#C5A059"}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].colorHex = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={v.colorName}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].colorName = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Color Name"
                    className="w-36 px-2.5 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs text-[#0A251C]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].sku = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="SKU"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs font-mono text-[#0A251C]"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-stone-500">Stock:</span>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].stock = Number(e.target.value);
                        setVariants(updated);
                      }}
                      className="w-16 px-2 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs text-center text-[#0A251C]"
                    />
                  </div>
                </div>

                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Inline Brand Creation */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCCF] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Add New Luxury Brand</h3>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  placeholder="e.g. Maybach Eyewear"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Origin / Atelier</label>
                <input
                  type="text"
                  value={newBrand.origin}
                  onChange={(e) => setNewBrand({ ...newBrand, origin: e.target.value })}
                  placeholder="e.g. Germany"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={newBrand.tagline}
                  onChange={(e) => setNewBrand({ ...newBrand, tagline: e.target.value })}
                  placeholder="e.g. Icons of Luxury"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-[#0A251C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBrandModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateBrand}
                disabled={creatingBrand}
                className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
              >
                {creatingBrand ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                <span>Create Brand</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inline Category Creation */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCCF] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Add New Eyewear Category</h3>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  placeholder="e.g. Prescription Sunglasses"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  placeholder="e.g. Polarized Rx sunglasses with custom optical powers"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-[#0A251C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCatModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={creatingCat}
                className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
              >
                {creatingCat ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                <span>Create Category</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
