"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  X,
  Glasses,
  Zap,
  Clock,
  RotateCcw,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/home/ProductCard";

function CatalogContent() {
  const searchParams = useSearchParams();

  // Initial params
  const initialType = searchParams.get("type") || "";
  const initialShape = searchParams.get("shape") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialSale = searchParams.get("sale") === "true";

  // Filter States
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedShapes, setSelectedShapes] = useState<string[]>(
    initialShape ? [initialShape] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand ? [initialBrand] : []
  );
  const [selectedOffers, setSelectedOffers] = useState<string[]>(
    initialSale ? ["sale"] : []
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      })
      .catch((err) => console.warn("Failed to load live catalog from Supabase:", err));
  }, []);

  // Accordion toggle states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    gender: true,
    shape: true,
    brand: true,
    offers: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleShape = (shape: string) => {
    setSelectedShapes((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleOffer = (offer: string) => {
    setSelectedOffers((prev) =>
      prev.includes(offer) ? prev.filter((o) => o !== offer) : [...prev, offer]
    );
  };

  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
  };

  const resetAllFilters = () => {
    setSelectedGender("all");
    setSelectedShapes([]);
    setSelectedBrands([]);
    setSelectedOffers([]);
    setSearchQuery("");
    setSortBy("featured");
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Type param from URL
      if (initialType && p.type !== initialType) {
        return false;
      }

      // Gender filter
      if (selectedGender !== "all") {
        if (selectedGender === "men" && p.gender !== "men" && p.gender !== "unisex")
          return false;
        if (selectedGender === "women" && p.gender !== "women" && p.gender !== "unisex")
          return false;
        if (selectedGender === "kids" && p.gender !== "kids")
          return false;
      }

      // Shape filter
      if (selectedShapes.length > 0) {
        const matchesShape = selectedShapes.some(
          (s) => s.toLowerCase() === p.shape.toLowerCase()
        );
        if (!matchesShape) return false;
      }

      // Brand filter
      if (selectedBrands.length > 0) {
        const matchesBrand = selectedBrands.some(
          (b) => b.toLowerCase() === p.brand.toLowerCase()
        );
        if (!matchesBrand) return false;
      }

      // Offers filter
      if (selectedOffers.includes("sale") && (!p.discountPct || p.discountPct <= 0)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesShape = p.shape.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesShape) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0; // featured
    });
  }, [
    initialType,
    selectedGender,
    selectedShapes,
    selectedBrands,
    selectedOffers,
    searchQuery,
    sortBy,
  ]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (selectedGender !== "all") {
      chips.push({
        label: `Gender: ${selectedGender}`,
        onRemove: () => setSelectedGender("all"),
      });
    }
    selectedShapes.forEach((s) => {
      chips.push({
        label: `Shape: ${s}`,
        onRemove: () => toggleShape(s),
      });
    });
    selectedBrands.forEach((b) => {
      chips.push({
        label: `Brand: ${b}`,
        onRemove: () => toggleBrand(b),
      });
    });
    selectedOffers.forEach((o) => {
      chips.push({
        label: o === "sale" ? "On Sale" : "Special Offer",
        onRemove: () => toggleOffer(o),
      });
    });
    if (searchQuery.trim()) {
      chips.push({
        label: `Search: "${searchQuery}"`,
        onRemove: () => setSearchQuery(""),
      });
    }
    return chips;
  }, [selectedGender, selectedShapes, selectedBrands, selectedOffers, searchQuery]);

  return (
    <div className="w-full">
      {/* ================= BREADCRUMB & PAGE HEADER ================= */}
      <section className="bg-[#FAF3EB]/60 border-b border-[#E8DEC8] py-4">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center space-x-2 text-xs text-[#716B64] tracking-wider">
            <Link href="/" className="hover:text-[#C5A059] transition">
              HOME
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#C5A059] transition">
              CATALOG
            </Link>
            <span>/</span>
            <span className="text-[#1A1816] font-semibold uppercase">
              {initialType ? initialType.toUpperCase() : "ALL SILHOUETTES"}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#716B64]">
              Showing {filteredProducts.length} of {productsList.length} Frames
            </span>
            {activeChips.length > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-[#BB4D00] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= MAIN CATALOG WORKSPACE (SIDEBAR + 4-COL GRID) ================= */}
      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ================= LEFT FILTER SIDEBAR ================= */}
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 bg-transparent lg:sticky lg:top-28">
            {/* Mobile Filter Toggle Header */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-[#E8DEC8] mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1A1816]">
                Filters
              </span>
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="px-3 py-1.5 rounded-full border border-[#1A1816] text-xs uppercase font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter Catalog</span>
              </button>
            </div>

            <div
              className={`space-y-6 ${
                mobileFilterOpen ? "block" : "hidden lg:block"
              }`}
            >
              {/* 1. GENDER ACCORDION */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("gender")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    GENDER
                  </span>
                  {openSections.gender ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.gender && (
                  <div className="mt-3 space-y-2.5">
                    {[
                      { val: "all", label: "All Silhouettes" },
                      { val: "men", label: "Men's Collection" },
                      { val: "women", label: "Women's Collection" },
                      { val: "kids", label: "Kids & Teens" },
                    ].map((g) => (
                      <label
                        key={g.val}
                        className="flex items-center gap-2.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGender === g.val}
                          onChange={() => handleGenderChange(g.val)}
                          className="w-4 h-4 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span>{g.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. FRAME SHAPE ACCORDION */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("shape")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    FRAME SHAPE
                  </span>
                  {openSections.shape ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.shape && (
                  <div className="mt-3 space-y-2.5">
                    {[
                      "Aviator",
                      "Cat Eye",
                      "Rectangle",
                      "Round",
                      "Square",
                      "Geometric",
                      "Wayfarer",
                    ].map((shape) => (
                      <label
                        key={shape}
                        className="flex items-center gap-2.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedShapes.includes(shape)}
                          onChange={() => toggleShape(shape)}
                          className="w-4 h-4 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span>{shape}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. LUXURY BRAND ACCORDION */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("brand")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    LUXURY BRAND
                  </span>
                  {openSections.brand ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.brand && (
                  <div className="mt-3 space-y-2.5">
                    {[
                      "Cartier",
                      "Fastrack",
                      "Tom Ford",
                      "GAST",
                      "Ray-Ban",
                      "Jacques Marie Mage",
                      "Lindberg",
                      "Prada",
                      "Gucci",
                    ].map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-2.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. OFFERS & DEALS ACCORDION */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("offers")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    OFFERS &amp; DEALS
                  </span>
                  {openSections.offers ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.offers && (
                  <div className="mt-3 space-y-2.5">
                    <label className="flex items-center gap-2.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedOffers.includes("sale")}
                        onChange={() => toggleOffer("sale")}
                        className="w-4 h-4 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                      />
                      <span className="flex items-center gap-1 text-[#BB4D00] font-semibold">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        On Sale Price Applied
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedOffers.includes("bundle")}
                        onChange={() => toggleOffer("bundle")}
                        className="w-4 h-4 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Multiple Offers Available
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN AREA: SORT BAR + PRODUCT GRID ================= */}
          <section className="flex-1 w-full">
            {/* Controls Bar: Search & Sort */}
            <div className="bg-white rounded-xl border border-[#E8DEC8] p-3 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search in Catalog */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search by brand, shape, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FCFAF7] border border-neutral-200 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:border-[#0A251C] transition"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500 whitespace-nowrap hidden sm:inline">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#FCFAF7] border border-neutral-200 rounded-lg px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#0A251C] cursor-pointer"
                  >
                    <option value="featured">Featured Designer Frames</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating (Highest)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF3EB] text-[#1A1816] border border-neutral-200"
                  >
                    <span>{chip.label}</span>
                    <button
                      onClick={chip.onRemove}
                      className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200 p-8">
                <Glasses className="w-12 h-12 mx-auto text-[#C5A059]/60 mb-3" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#1A1816] mb-1">
                  No Matching Designer Frames
                </h4>
                <p className="text-xs text-neutral-500 mb-4">
                  Try clearing some filters or searching for alternative shapes.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-[#0A251C] text-white text-xs uppercase tracking-widest rounded-lg hover:bg-[#C5A059] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1340px] mx-auto py-24 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#716B64]">
            Loading Eyewear Catalog...
          </p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
