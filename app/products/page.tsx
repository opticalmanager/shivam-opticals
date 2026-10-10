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

const ITEMS_PER_PAGE = 24;

function CatalogContent() {
  const searchParams = useSearchParams();

  // Initial params from URL
  const initialType = searchParams.get("type") || searchParams.get("category") || "";
  const initialShape = searchParams.get("shape") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialSale = searchParams.get("sale") === "true";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialType || "all");
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
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

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

  // Sync category if URL parameter changes
  useEffect(() => {
    if (initialType) {
      setSelectedCategory(initialType);
    }
  }, [initialType]);

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [
    selectedCategory,
    selectedGender,
    selectedShapes,
    selectedBrands,
    selectedOffers,
    searchQuery,
    sortBy,
  ]);

  // Accordion toggle states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    category: true,
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
    setSelectedCategory("all");
    setSelectedGender("all");
    setSelectedShapes([]);
    setSelectedBrands([]);
    setSelectedOffers([]);
    setSearchQuery("");
    setBrandSearchQuery("");
    setSortBy("featured");
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: productsList.length,
      sunglasses: 0,
      eyeglasses: 0,
      "contact-lenses": 0,
      "meta-smart": 0,
      kids: 0,
    };
    productsList.forEach((p) => {
      const cat = (p.category || "").toLowerCase();
      const typ = (p.type || "").toLowerCase();
      if (cat === "sunglasses" || typ === "sunglasses") counts.sunglasses++;
      if (cat === "eyeglasses" || typ === "eyeglasses") counts.eyeglasses++;
      if (cat.includes("contact") || typ.includes("contact")) counts["contact-lenses"]++;
      if (cat === "meta-smart" || typ === "meta-smart") counts["meta-smart"]++;
      if (cat === "kids" || p.gender === "kids") counts.kids++;
    });
    return counts;
  }, [productsList]);

  // Dynamic Brand Counts & Sorted List
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    productsList.forEach((p) => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return counts;
  }, [productsList]);

  const sortedBrands = useMemo(() => {
    return Object.keys(brandCounts).sort((a, b) => {
      const diff = (brandCounts[b] || 0) - (brandCounts[a] || 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
  }, [brandCounts]);

  const filteredDisplayBrands = useMemo(() => {
    if (!brandSearchQuery.trim()) return sortedBrands;
    const q = brandSearchQuery.toLowerCase();
    return sortedBrands.filter((b) => b.toLowerCase().includes(q));
  }, [sortedBrands, brandSearchQuery]);

  // Dynamic Frame Shape Counts & List
  const shapeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    productsList.forEach((p) => {
      if (p.shape) {
        const norm = p.shape.charAt(0).toUpperCase() + p.shape.slice(1).toLowerCase();
        counts[norm] = (counts[norm] || 0) + 1;
      }
    });
    return counts;
  }, [productsList]);

  const sortedShapes = useMemo(() => {
    return Object.keys(shapeCounts).sort((a, b) => {
      return (shapeCounts[b] || 0) - (shapeCounts[a] || 0);
    });
  }, [shapeCounts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((p) => {
        // Category Filter
        if (selectedCategory && selectedCategory !== "all") {
          const cat = selectedCategory.toLowerCase();
          const pCat = (p.category || "").toLowerCase();
          const pType = (p.type || "").toLowerCase();
          if (cat === "sunglasses" && pCat !== "sunglasses" && pType !== "sunglasses") return false;
          if (cat === "eyeglasses" && pCat !== "eyeglasses" && pType !== "eyeglasses") return false;
          if (cat === "meta-smart" && pCat !== "meta-smart" && pType !== "meta-smart") return false;
          if (cat === "kids" && pCat !== "kids" && p.gender !== "kids") return false;
          if (cat === "contact-lenses" && !pCat.includes("contact") && !pType.includes("contact")) return false;
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
            (s) => s.toLowerCase() === (p.shape || "").toLowerCase()
          );
          if (!matchesShape) return false;
        }

        // Brand filter
        if (selectedBrands.length > 0) {
          const matchesBrand = selectedBrands.some(
            (b) => b.toLowerCase() === (p.brand || "").toLowerCase()
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
          const matchesName = (p.name || "").toLowerCase().includes(q);
          const matchesBrand = (p.brand || "").toLowerCase().includes(q);
          const matchesShape = (p.shape || "").toLowerCase().includes(q);
          if (!matchesName && !matchesBrand && !matchesShape) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // featured
      });
  }, [
    productsList,
    selectedCategory,
    selectedGender,
    selectedShapes,
    selectedBrands,
    selectedOffers,
    searchQuery,
    sortBy,
  ]);

  // Displayed products subset for progressive rendering performance
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (selectedCategory !== "all") {
      const catLabels: Record<string, string> = {
        sunglasses: "Sunglasses",
        eyeglasses: "Eyeglasses",
        "contact-lenses": "Contact Lenses",
        "meta-smart": "Smart Glasses",
        kids: "Kids & Teens",
      };
      chips.push({
        label: `Category: ${catLabels[selectedCategory] || selectedCategory}`,
        onRemove: () => setSelectedCategory("all"),
      });
    }
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
  }, [selectedCategory, selectedGender, selectedShapes, selectedBrands, selectedOffers, searchQuery]);

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
              {selectedCategory !== "all" ? selectedCategory.toUpperCase() : "ALL SILHOUETTES"}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#716B64]">
              Showing {displayedProducts.length} of {filteredProducts.length} Frames ({productsList.length} Total)
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
                Filters {activeChips.length > 0 && `(${activeChips.length})`}
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
              {/* 1. CATEGORY ACCORDION */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("category")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    CATEGORY
                  </span>
                  {openSections.category ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.category && (
                  <div className="mt-3 space-y-2">
                    {[
                      { key: "all", label: "All Silhouettes" },
                      { key: "sunglasses", label: "Sunglasses" },
                      { key: "eyeglasses", label: "Eyeglasses" },
                      { key: "meta-smart", label: "Smart Glasses" },
                      { key: "kids", label: "Kids & Teens" },
                      { key: "contact-lenses", label: "Contact Lenses" },
                    ].map((cat) => (
                      <label
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className="flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="cat_radio"
                            checked={selectedCategory === cat.key}
                            onChange={() => setSelectedCategory(cat.key)}
                            className="w-3.5 h-3.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span className={selectedCategory === cat.key ? "font-semibold text-neutral-900" : ""}>
                            {cat.label}
                          </span>
                        </div>
                        {categoryCounts[cat.key] !== undefined && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {categoryCounts[cat.key]}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. GENDER ACCORDION */}
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

              {/* 3. FRAME SHAPE ACCORDION */}
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
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {sortedShapes.map((shape) => (
                      <label
                        key={shape}
                        className="flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedShapes.includes(shape)}
                            onChange={() => toggleShape(shape)}
                            className="w-3.5 h-3.5 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span>{shape}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {shapeCounts[shape] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. LUXURY BRAND ACCORDION (WITH SEARCH & DYNAMIC LIST) */}
              <div className="border-b border-neutral-200/80 pb-5">
                <button
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  onClick={() => toggleSection("brand")}
                >
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                    LUXURY BRAND ({sortedBrands.length})
                  </span>
                  {openSections.brand ? (
                    <ChevronUp className="w-4 h-4 text-[#1A1816]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A1816]" />
                  )}
                </button>

                {openSections.brand && (
                  <div className="mt-3">
                    {/* Brand Search Box */}
                    <div className="relative mb-2.5">
                      <input
                        type="text"
                        placeholder="Search 40+ brands..."
                        value={brandSearchQuery}
                        onChange={(e) => setBrandSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-neutral-50 border border-neutral-200 rounded text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#0A251C]"
                      />
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
                    </div>

                    {/* Brands Checklist */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {filteredDisplayBrands.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 italic py-2">
                          No brands matching &quot;{brandSearchQuery}&quot;
                        </p>
                      ) : (
                        filteredDisplayBrands.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer select-none py-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => toggleBrand(brand)}
                                className="w-3.5 h-3.5 rounded border-neutral-300 text-[#0A251C] focus:ring-0 cursor-pointer"
                              />
                              <span className="truncate max-w-[140px]">{brand}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {brandCounts[brand] || 0}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. OFFERS & DEALS ACCORDION */}
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
                  Try clearing some filters or searching for alternative shapes or brands.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-[#0A251C] text-white text-xs uppercase tracking-widest rounded-lg hover:bg-[#C5A059] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {displayedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Progressive Load More Button */}
                {visibleCount < filteredProducts.length && (
                  <div className="mt-12 text-center pb-8">
                    <p className="text-xs text-[#716B64] mb-3">
                      Showing {displayedProducts.length} of {filteredProducts.length} Designer Frames
                    </p>
                    <button
                      onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                      className="px-8 py-3 bg-[#0A251C] text-white text-xs uppercase font-bold tracking-widest rounded-full hover:bg-[#C5A059] transition shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>Load More Frames</span>
                    </button>
                  </div>
                )}
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
