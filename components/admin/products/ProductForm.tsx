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
  Loader2,
  Palette,
  Check,
  Building2,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Product, ColorVariant } from "@/types";

interface ProductFormProps {
  initialData?: Product;
  categories: { id: string; slug: string; name: string }[];
  brands: { id: string; slug: string; name: string }[];
  isEdit?: boolean;
}

const OPTICAL_SHAPES = [
  "Aviator",
  "Cat Eye",
  "Geometric",
  "Hexagon",
  "Octagonal",
  "Oval",
  "Rectangle",
  "Round",
  "Square",
  "Wayfarer",
];

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  brands,
  isEdit = false,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "variants" | "pricing" | "specs">("basic");
  const [saving, setSaving] = useState(false);

  // Dynamic Brand & Category Lists (allowing inline addition without losing form state)
  const [brandList, setBrandList] = useState(brands);
  const [categoryList, setCategoryList] = useState(categories);

  // Inline Brand Modal State
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState("France");
  const [newBrandTagline, setNewBrandTagline] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  // Inline Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    brand: initialData?.brand || (brands[0]?.name || "Cartier"),
    category: initialData?.category || (categories[0]?.name || "Eyeglasses"),
    type: initialData?.type || "eyeglasses",
    shape: initialData?.shape || "Rectangle",
    gender: initialData?.gender || "unisex",
    size: initialData?.size || "M",
    price: initialData?.price || 1990,
    originalPrice: initialData?.originalPrice || 2990,
    discountPct: initialData?.discountPct || 33,
    material: initialData?.material || "Italian Acetate & Beta Titanium",
    description: initialData?.description || "Handcrafted luxury optical frame from atelier collection.",
    tag: initialData?.tag || "NEW ARRIVAL",
    tagType: initialData?.tagType || "new",
    measurements: initialData?.measurements || { lensWidth: 54, bridgeWidth: 17, templeLength: 142 },
  });

  // Primary Images State
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : initialData?.img
      ? [initialData.img]
      : ["/images/clean_frame_1.png"]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Primary Hex Swatches
  const [colors, setColors] = useState<string[]>(
    initialData?.colors && initialData.colors.length > 0
      ? initialData.colors
      : ["#0A251C", "#C5A059"]
  );
  const [newColor, setNewColor] = useState("#1A1816");

  // Rich Colorway Variants State
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(() => {
    if (initialData?.colorVariants && initialData.colorVariants.length > 0) {
      return initialData.colorVariants;
    }
    // Fallback initialize from colors
    return (initialData?.colors || ["#0A251C", "#C5A059"]).map((c, idx) => ({
      id: `var-init-${idx}`,
      sku: initialData?.id ? `${initialData.id.toUpperCase()}-00${idx + 1}` : `SKU-FRAME-00${idx + 1}`,
      colorName: idx === 0 ? "Signature Black / Gold" : `Colorway ${idx + 1}`,
      colorHex: c,
      price: initialData?.price || 1990,
      compareAtPrice: initialData?.originalPrice || 2990,
      available: true,
      featuredImage: initialData?.images?.[idx] || initialData?.img || "/images/clean_frame_1.png",
      gallery: initialData?.images || ["/images/clean_frame_1.png"],
    }));
  });

  // State for adding photo angle to a specific variant
  const [variantNewPhotoUrl, setVariantNewPhotoUrl] = useState<{ [variantIdx: number]: string }>({});

  // Handlers for Brand Inline Creation
  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setCreatingBrand(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBrandName.trim(),
          origin: newBrandOrigin.trim() || "Haute Lunetterie",
          tagline: newBrandTagline.trim() || "Independent Luxury Eyewear Architecture",
        }),
      });
      const data = await res.json();
      if (data.success && data.brand) {
        setBrandList((prev) => [...prev, data.brand]);
        setFormData((prev) => ({ ...prev, brand: data.brand.name }));
        toast.success(`Brand "${data.brand.name}" registered successfully`);
        setIsAddBrandOpen(false);
        setNewBrandName("");
        setNewBrandTagline("");
      } else {
        toast.error("Failed to register brand", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error creating brand", { description: err.message });
    } finally {
      setCreatingBrand(false);
    }
  };

  // Handlers for Category Inline Creation
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || `Bespoke optical collection for ${newCategoryName.trim()}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategoryList((prev) => [...prev, data.category]);
        setFormData((prev) => ({ ...prev, category: data.category.name }));
        toast.success(`Category "${data.category.name}" registered successfully`);
        setIsAddCategoryOpen(false);
        setNewCategoryName("");
        setNewCategoryDesc("");
      } else {
        toast.error("Failed to register category", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error creating category", { description: err.message });
    } finally {
      setCreatingCategory(false);
    }
  };

  // Primary Images Handlers
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Color Swatches Handlers
  const handleAddColor = () => {
    if (!newColor) return;
    if (!colors.includes(newColor)) {
      setColors((prev) => [...prev, newColor]);
    }
  };

  const handleRemoveColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  // Variant Handlers
  const handleAddVariant = () => {
    const nextIdx = colorVariants.length + 1;
    const newVar: ColorVariant = {
      id: `var-new-${Date.now()}`,
      sku: `SKU-${formData.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "FRAME"}-00${nextIdx}`,
      colorName: `Colorway ${nextIdx}`,
      colorHex: "#1A1816",
      price: formData.price,
      compareAtPrice: formData.originalPrice,
      available: true,
      featuredImage: images[0] || "/images/clean_frame_1.png",
      gallery: images.length > 0 ? [...images] : ["/images/clean_frame_1.png"],
    };
    setColorVariants((prev) => [...prev, newVar]);
  };

  const handleUpdateVariant = (index: number, updates: Partial<ColorVariant>) => {
    setColorVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updates } : v))
    );
  };

  const handleRemoveVariant = (index: number) => {
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariantPhoto = (variantIdx: number) => {
    const url = variantNewPhotoUrl[variantIdx]?.trim();
    if (!url) return;
    setColorVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIdx) return v;
        const currentGallery = v.gallery || [];
        return {
          ...v,
          gallery: [...currentGallery, url],
          featuredImage: v.featuredImage || url,
        };
      })
    );
    setVariantNewPhotoUrl((prev) => ({ ...prev, [variantIdx]: "" }));
  };

  const handleRemoveVariantPhoto = (variantIdx: number, photoIdx: number) => {
    setColorVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIdx) return v;
        const updatedGallery = (v.gallery || []).filter((_, pI) => pI !== photoIdx);
        return {
          ...v,
          gallery: updatedGallery,
          featuredImage: updatedGallery[0] || v.featuredImage,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setSaving(true);

    // Collect all hex colors from colorVariants if defined
    const variantColors = colorVariants.map((v) => v.colorHex).filter(Boolean);
    const mergedColors = Array.from(new Set([...colors, ...variantColors]));

    // Collect all unique images
    const variantImages = colorVariants.flatMap((v) => [v.featuredImage, ...(v.gallery || [])]).filter(Boolean) as string[];
    const mergedImages = Array.from(new Set([...images, ...variantImages]));

    const payload = {
      ...formData,
      img: images[0] || colorVariants[0]?.featuredImage || "/images/clean_frame_1.png",
      images: mergedImages.length > 0 ? mergedImages : ["/images/clean_frame_1.png"],
      colors: mergedColors.length > 0 ? mergedColors : ["#0A251C"],
      colorVariants,
    };

    try {
      const endpoint = isEdit
        ? `/api/admin/products/${initialData?.id}`
        : `/api/admin/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? "Frame updated successfully" : "Frame added to catalog");
        router.push("/admin/products");
      } else {
        toast.error("Failed to save frame", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error saving frame", { description: err.message });
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
              {isEdit ? `Edit Frame: ${formData.name}` : "Add New Frame to Catalog"}
            </h1>
            <p className="text-xs text-stone-500">
              Configure luxury frame specifications, optical geometry, and colorway galleries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products")}
            className="text-xs bg-white border-stone-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>{isEdit ? "Update Frame" : "Save Frame"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#E8DCCF] text-xs font-medium overflow-x-auto">
        {[
          { id: "basic", label: "1. Basic Details", icon: Layers },
          { id: "media", label: "2. Primary Media & Swatches", icon: ImageIcon },
          { id: "variants", label: "3. Colorways & Variants", icon: Palette, badge: colorVariants.length },
          { id: "pricing", label: "4. Pricing & Margin", icon: DollarSign },
          { id: "specs", label: "5. Optical Measurements", icon: Glasses },
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
              {typeof tab.badge === "number" && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  {tab.badge}
                </span>
              )}
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
                Frame Model Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Santos de Cartier Titanium Aviator Eyeglasses"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            {/* Brand Dropdown with Inline "+ Add Brand" Modal Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Luxury Brand *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C5A059] hover:text-[#0A251C] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Brand</span>
                </button>
              </div>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                {brandList.map((b) => (
                  <option key={b.slug || b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown with Inline "+ Add Category" Modal Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Eyewear Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C5A059] hover:text-[#0A251C] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Category</span>
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                {categoryList.map((c) => (
                  <option key={c.slug || c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Extended Frame Shape Options */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Optical Frame Shape
              </label>
              <select
                value={formData.shape}
                onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                {OPTICAL_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Gender Classification
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description & Craftsmanship Details
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details of acetate polishing, titanium hinges, and precision optical ergonomics..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIMARY MEDIA & SWATCHES */}
      {activeTab === "media" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Primary Frame Photography
            </h3>
            <p className="text-xs text-stone-500">
              Provide high-resolution transparent or studio images of the eyewear.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL (e.g. /images/clean_frame_1.png or CDN link)..."
              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddImageUrl}
              className="text-xs bg-[#0A251C] text-white hover:bg-[#1a382e]"
            >
              Add Image
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-4/3 rounded-lg border border-[#E8DCCF] overflow-hidden bg-[#FAF7F2] p-2 flex items-center justify-center group"
              >
                <img
                  src={url}
                  alt={`Angle ${idx + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/clean_frame_1.png";
                  }}
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-[#C5A059] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E8DCCF] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Colorways & Hex Swatches
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-9 h-9 rounded border border-[#E8DCCF] cursor-pointer"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddColor}
                className="text-xs bg-stone-700 text-white"
              >
                Add Swatch
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {colors.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8DCCF] text-xs"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-stone-300"
                    style={{ backgroundColor: c }}
                  />
                  <span className="font-mono text-[10px] text-stone-600">{c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(idx)}
                    className="text-stone-400 hover:text-rose-600 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RICH COLORWAYS & MULTI-ANGLE GALLERIES */}
      {activeTab === "variants" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-0.5">
                Colorway Variants & Angle Galleries ({colorVariants.length})
              </h3>
              <p className="text-xs text-stone-500">
                Manage individual frame finishes, SKUs, pricing overrides, and multi-angle photo catalogs.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddVariant}
              className="text-xs bg-[#0A251C] hover:bg-[#1a382e] text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Colorway</span>
            </Button>
          </div>

          {colorVariants.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-[#E8DCCF] rounded-xl">
              <Palette className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-600 font-semibold">No colorway variants configured</p>
              <p className="text-[11px] text-stone-400 mt-1 mb-3">Add distinct colorways to enable multi-finish selection for customers</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddVariant}
                className="text-xs border-[#E8DCCF]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Create First Colorway</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {colorVariants.map((variant, vIdx) => (
                <div
                  key={variant.id || vIdx}
                  className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl p-4 space-y-3"
                >
                  {/* Variant Top Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={variant.colorHex}
                          onChange={(e) => handleUpdateVariant(vIdx, { colorHex: e.target.value })}
                          className="w-8 h-8 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                          title="Click to pick swatch hex"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          value={variant.colorName}
                          onChange={(e) => handleUpdateVariant(vIdx, { colorName: e.target.value })}
                          placeholder="Colorway Name (e.g. Brushed Gold / Matte Black)"
                          className="px-2.5 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs font-semibold text-[#0A251C]"
                        />
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleUpdateVariant(vIdx, { sku: e.target.value })}
                          placeholder="SKU Code (e.g. CT0087O-001)"
                          className="px-2.5 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs font-mono text-stone-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-stone-600">₹</span>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleUpdateVariant(vIdx, { price: Number(e.target.value) })}
                          className="w-24 px-2 py-1 bg-white border border-[#E8DCCF] rounded text-xs font-semibold text-[#0A251C]"
                          title="Variant Price"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={variant.available !== false}
                          onChange={(e) => handleUpdateVariant(vIdx, { available: e.target.checked })}
                          className="rounded border-[#E8DCCF] text-[#C5A059] focus:ring-[#C5A059]"
                        />
                        <span>In Stock</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(vIdx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Angle Gallery for this Variant */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        Angle Photography ({(variant.gallery || []).length} photos)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={variantNewPhotoUrl[vIdx] || ""}
                        onChange={(e) =>
                          setVariantNewPhotoUrl((prev) => ({ ...prev, [vIdx]: e.target.value }))
                        }
                        placeholder="Paste angle image URL for this colorway..."
                        className="flex-1 px-3 py-1.5 bg-white border border-[#E8DCCF] rounded text-xs text-[#0A251C]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddVariantPhoto(vIdx)}
                        className="text-xs h-8 bg-stone-800 text-white hover:bg-stone-900"
                      >
                        Add Photo
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                      {(variant.gallery || []).map((imgUrl, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative aspect-square rounded-md border border-[#E8DCCF] bg-white overflow-hidden p-1 flex items-center justify-center group"
                        >
                          <img
                            src={imgUrl}
                            alt={`${variant.colorName} Angle ${pIdx + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/clean_frame_1.png";
                            }}
                          />
                          {pIdx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-[#C5A059] text-white text-[8px] font-bold px-1 rounded">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantPhoto(vIdx, pIdx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition"
                            title="Delete angle photo"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRICING */}
      {activeTab === "pricing" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Price (INR ₹) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                MRP / Strike Price (INR ₹)
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Discount Badge (% off)
              </label>
              <input
                type="number"
                value={formData.discountPct}
                onChange={(e) => setFormData({ ...formData, discountPct: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OPTICAL SPECIFICATIONS */}
      {activeTab === "specs" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lens Width (mm)
              </label>
              <input
                type="number"
                value={formData.measurements.lensWidth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, lensWidth: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Bridge Width (mm)
              </label>
              <input
                type="number"
                value={formData.measurements.bridgeWidth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, bridgeWidth: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Temple Length (mm)
              </label>
              <input
                type="number"
                value={formData.measurements.templeLength}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, templeLength: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Material Composition
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g. Beta Titanium & Italian Mazzucchelli Acetate"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>
          </div>
        </div>
      )}

      {/* INLINE MODAL: ADD BRAND */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DCCF]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                  Add New Luxury Brand
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Jacques Marie Mage, Matsuda, Cartier"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Country of Origin / Atelier Region
                </label>
                <input
                  type="text"
                  value={newBrandOrigin}
                  onChange={(e) => setNewBrandOrigin(e.target.value)}
                  placeholder="e.g. France, Japan, Italy, Germany"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={newBrandTagline}
                  onChange={(e) => setNewBrandTagline(e.target.value)}
                  placeholder="e.g. Haute Lunetterie & Handcrafted Heritage"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DCCF]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBrandOpen(false)}
                className="text-xs bg-white border-stone-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={creatingBrand}
                onClick={handleCreateBrandSubmit}
                className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
              >
                {creatingBrand ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    <span>Save Brand</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE MODAL: ADD CATEGORY */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DCCF]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                  Add New Eyewear Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Rimless Luxury, Blue-Light Blocking"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Description of the category collection..."
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DCCF]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-xs bg-white border-stone-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={creatingCategory}
                onClick={handleCreateCategorySubmit}
                className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
              >
                {creatingCategory ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    <span>Save Category</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
