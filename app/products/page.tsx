"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Glasses,
  Zap,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/home/ProductCard";

const ITEMS_PER_PAGE = 24;

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial params from URL
  const initialType =
    searchParams.get("type") ||
    searchParams.get("category") ||
    (searchParams.get("filter") === "meta" ? "meta-smart" : "");
  const initialShape = searchParams.get("shape") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialGender = searchParams.get("gender") || "";
  const initialSale = searchParams.get("sale") === "true";
  const initialFilter = searchParams.get("filter") || "";
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialType || "all");
  const [selectedGender, setSelectedGender] = useState<string>(initialGender || "all");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [selectedShapes, setSelectedShapes] = useState<string[]>(
    initialShape ? [initialShape] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand ? [initialBrand] : []
  );
  const [selectedOffers, setSelectedOffers] = useState<string[]>(() => {
    const list: string[] = [];
    if (initialSale) list.push("sale");
    if (initialFilter === "new") list.push("new");
    return list;
  });
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProductsList(data.products);
        }
      })
      .catch((err) => console.warn("Failed to load live catalog from Supabase:", err));
  }, []);

  // Sync state if URL search parameters change dynamically
  useEffect(() => {
    const currentType =
      searchParams.get("type") ||
      searchParams.get("category") ||
      (searchParams.get("filter") === "meta" ? "meta-smart" : "");
    if (currentType) {
      setSelectedCategory(currentType);
    }
    const currentGender = searchParams.get("gender");
    if (currentGender) {
      setSelectedGender(currentGender);
    }
    const currentShape = searchParams.get("shape");
    if (currentShape) {
      setSelectedShapes([currentShape]);
    }
    const currentBrand = searchParams.get("brand");
    if (currentBrand) {
      setSelectedBrands([currentBrand]);
    }
    const currentFilter = searchParams.get("filter");
    if (currentFilter === "new") {
      setSelectedOffers((prev) => (prev.includes("new") ? prev : [...prev, "new"]));
    }
    if (searchParams.get("sale") === "true") {
      setSelectedOffers((prev) => (prev.includes("sale") ? prev : [...prev, "sale"]));
    }
    const currentSearch = searchParams.get("search") || searchParams.get("q") || "";
    setSearchQuery(currentSearch);
  }, [searchParams]);

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [
    selectedCategory,
    selectedGender,
    selectedPrice,
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
    price: true,
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
    setSelectedPrice("all");
    setSelectedShapes([]);
    setSelectedBrands([]);
    setSelectedOffers([]);
    setSearchQuery("");
    setBrandSearchQuery("");
    setShowSearchSuggestions(false);
    setSortBy("featured");
    setVisibleCount(ITEMS_PER_PAGE);
    router.replace("/products");
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
      const name = (p.name || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();

      if (cat === "sunglasses" || typ === "sunglasses") counts.sunglasses++;
      if (cat === "eyeglasses" || typ === "eyeglasses") counts.eyeglasses++;
      if (cat.includes("contact") || typ.includes("contact")) counts["contact-lenses"]++;
      if (
        cat === "meta-smart" ||
        typ === "meta-smart" ||
        cat.includes("meta") ||
        slug.includes("meta") ||
        (name.includes("meta") &&
          (name.includes("ray-ban") ||
            name.includes("smart") ||
            name.includes("wayfarer") ||
            name.includes("headliner") ||
            name.includes("skyler")))
      ) {
        counts["meta-smart"]++;
      }
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
          const pName = (p.name || "").toLowerCase();
          const pSlug = (p.slug || "").toLowerCase();

          if (cat === "sunglasses" && pCat !== "sunglasses" && pType !== "sunglasses") return false;
          if (cat === "eyeglasses" && pCat !== "eyeglasses" && pType !== "eyeglasses") return false;
          if (cat === "meta-smart") {
            const isMeta =
              pCat === "meta-smart" ||
              pType === "meta-smart" ||
              pCat.includes("meta") ||
              pSlug.includes("meta") ||
              (pName.includes("meta") &&
                (pName.includes("ray-ban") ||
                  pName.includes("smart") ||
                  pName.includes("wayfarer") ||
                  pName.includes("headliner") ||
                  pName.includes("skyler")));
            if (!isMeta) return false;
          }
          if (cat === "kids" && pCat !== "kids" && p.gender !== "kids") return false;
          if (cat === "contact-lenses" && !pCat.includes("contact") && !pType.includes("contact"))
            return false;
        }

        // Gender filter
        if (selectedGender !== "all") {
          if (selectedGender === "men" && p.gender !== "men" && p.gender !== "unisex")
            return false;
          if (selectedGender === "women" && p.gender !== "women" && p.gender !== "unisex")
            return false;
          if (selectedGender === "kids" && p.gender !== "kids") return false;
        }

        // Price filter
        if (selectedPrice !== "all") {
          const price = Number(p.price) || 0;
          if (selectedPrice === "under-5k" && price >= 5000) return false;
          if (selectedPrice === "5k-15k" && (price < 5000 || price > 15000)) return false;
          if (selectedPrice === "15k-25k" && (price < 15000 || price > 25000)) return false;
          if (selectedPrice === "above-25k" && price < 25000) return false;
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
        if (selectedOffers.includes("sale") && (!p.discountPct || p.discountPct <= 0) && !p.isOnSale) {
          return false;
        }
        if (selectedOffers.includes("new") && !p.isNewArrival) {
          return false;
        }

        // Search query (Smart Multi-Token Matching Logic)
        if (searchQuery.trim()) {
          const rawTokens = searchQuery
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, " ")
            .split(/\s+/)
            .filter(Boolean);

          if (rawTokens.length > 0) {
            const searchable = [
              p.name,
              p.brand,
              p.shape,
              p.category,
              p.type,
              p.color,
              p.colorHex,
              ...(p.colors || []),
              p.rimType,
              p.material,
              p.subtitle,
              p.description,
              p.sku,
              p.gender,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesAll = rawTokens.every((token) => {
              const cleanToken = token.replace(/[-_]/g, "");
              const cleanSearchable = searchable.replace(/[-_]/g, "");
              return searchable.includes(token) || cleanSearchable.includes(cleanToken);
            });

            if (!matchesAll) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        return 0; // featured
      });
  }, [
    productsList,
    selectedCategory,
    selectedGender,
    selectedPrice,
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
        "meta-smart": "Ray-Ban | Meta Smart Glasses",
        kids: "Kids & Teens",
      };
      chips.push({
        label: `Category: ${catLabels[selectedCategory] || selectedCategory}`,
        onRemove: () => setSelectedCategory("all"),
      });
    }
    if (selectedGender !== "all") {
      chips.push({
        label: `Gender: ${selectedGender === "men" ? "Men's" : selectedGender === "women" ? "Women's" : selectedGender}`,
        onRemove: () => setSelectedGender("all"),
      });
    }
    if (selectedPrice !== "all") {
      const priceLabels: Record<string, string> = {
        "under-5k": "Under ₹5,000",
        "5k-15k": "₹5,000 - ₹15,000",
        "15k-25k": "₹15,000 - ₹25,000",
        "above-25k": "Luxury ₹25,000+",
      };
      chips.push({
        label: `Price: ${priceLabels[selectedPrice] || selectedPrice}`,
        onRemove: () => setSelectedPrice("all"),
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
        label: o === "sale" ? "On Sale" : o === "new" ? "New Arrivals" : "Special Offer",
        onRemove: () => toggleOffer(o),
      });
    });
    if (searchQuery.trim()) {
      chips.push({
        label: `Search: "${searchQuery}"`,
        onRemove: () => {
          setSearchQuery("");
          setShowSearchSuggestions(false);
          const params = new URLSearchParams(searchParams.toString());
          params.delete("search");
          params.delete("q");
          router.replace(`/products?${params.toString()}`);
        },
      });
    }
    return chips;
  }, [
    selectedCategory,
    selectedGender,
    selectedPrice,
    selectedShapes,
    selectedBrands,
    selectedOffers,
    searchQuery,
    searchParams,
    router,
  ]);

  // Intelligent Fallback: Similar & Recommended Products when filteredProducts is empty
  const similarProducts = useMemo(() => {
    if (filteredProducts.length > 0 || productsList.length === 0) return [];

    // 1. Partial query match: products matching AT LEAST ONE token
    if (searchQuery.trim()) {
      const queryTokens = searchQuery
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

      if (queryTokens.length > 0) {
        const scored = productsList
          .map((p) => {
            const searchable = [
              p.name,
              p.brand,
              p.shape,
              p.category,
              p.type,
              p.color,
              p.material,
              p.subtitle,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            let score = 0;
            queryTokens.forEach((t) => {
              if (searchable.includes(t)) score += 1;
              if (p.brand?.toLowerCase().includes(t)) score += 3;
              if (p.name?.toLowerCase().includes(t)) score += 3;
              if (p.shape?.toLowerCase().includes(t)) score += 2;
            });
            return { product: p, score };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score || (Number(b.product.rating) || 0) - (Number(a.product.rating) || 0))
          .map((item) => item.product);

        if (scored.length > 0) {
          return scored.slice(0, 8);
        }
      }
    }

    // 2. Category match
    if (selectedCategory && selectedCategory !== "all") {
      const catMatches = productsList.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const typ = (p.type || "").toLowerCase();
        return cat === selectedCategory || typ === selectedCategory;
      });
      if (catMatches.length > 0) {
        return catMatches.slice(0, 8);
      }
    }

    // 3. Brand or Shape match
    if (selectedBrands.length > 0 || selectedShapes.length > 0) {
      const brandOrShape = productsList.filter((p) => {
        const matchBrand = selectedBrands.some(
          (b) => b.toLowerCase() === (p.brand || "").toLowerCase()
        );
        const matchShape = selectedShapes.some(
          (s) => s.toLowerCase() === (p.shape || "").toLowerCase()
        );
        return matchBrand || matchShape;
      });
      if (brandOrShape.length > 0) {
        return brandOrShape.slice(0, 8);
      }
    }

    // 4. Default Curated Luxury Best-Sellers & High-Rated Frames
    return productsList
      .slice()
      .sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return (Number(b.rating) || 5) - (Number(a.rating) || 5);
      })
      .slice(0, 8);
  }, [
    filteredProducts.length,
    searchQuery,
    selectedCategory,
    selectedBrands,
    selectedShapes,
    productsList,
  ]);

  // Catalog live search suggestions (Brands, Shapes)
  const catalogSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const suggestions: { label: string; value: string; type: string }[] = [];

    // Matching brands
    sortedBrands.forEach((b) => {
      if (b.toLowerCase().includes(q)) {
        suggestions.push({ label: b, value: b, type: "Brand" });
      }
    });

    // Matching shapes
    sortedShapes.forEach((s) => {
      if (s.toLowerCase().includes(q)) {
        suggestions.push({ label: `${s} Frames`, value: s, type: "Shape" });
      }
    });

    return suggestions.slice(0, 6);
  }, [searchQuery, sortedBrands, sortedShapes]);

  const handleCatalogSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchSuggestions(false);
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
      params.delete("q");
    }
    router.replace(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* ================= BREADCRUMB & PAGE HEADER ================= */}
      <section className="bg-[#FAF3EB]/70 border-b border-[#E8DEC8] py-4">
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
              {selectedCategory === "meta-smart"
                ? "RAY-BAN | META SMART GLASSES"
                : selectedCategory !== "all"
                ? selectedCategory.toUpperCase()
                : "ALL PRODUCTS"}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#716B64]">
              Showing {displayedProducts.length} of {filteredProducts.length} Frames (
              {productsList.length} Total)
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
      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Filter & Sort Bar */}
        <div className="lg:hidden flex items-center justify-between gap-2.5 pb-4 mb-4 border-b border-[#E8DEC8]">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 py-2.5 px-3.5 rounded-xl border border-[#0A251C] bg-white text-xs uppercase font-bold tracking-wider text-[#0A251C] flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-[#FAF3EB] active:scale-[0.99] transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Filters {activeChips.length > 0 && `(${activeChips.length})`}</span>
          </button>
          <div className="flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-[#E8DEC8] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1A1816] outline-none cursor-pointer"
            >
              <option value="featured">Featured Designer Frames</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Slide-Over Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-[#FCFAF7] border-l border-[#E8DEC8] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-4 border-b border-[#E8DEC8] bg-[#FAF3EB] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#0A251C]">
                    Filter Eyewear {activeChips.length > 0 && `(${activeChips.length})`}
                  </h3>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 hover:text-black transition cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Filter Options */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 1. CATEGORY */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("category")}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                      CATEGORY
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.category ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.category
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1.5">
                      {[
                        { key: "all", label: "All Products" },
                        { key: "sunglasses", label: "Sunglasses" },
                        { key: "eyeglasses", label: "Eyeglasses" },
                        { key: "meta-smart", label: "Ray-Ban | Meta Smart Glasses" },
                        { key: "kids", label: "Kids & Teens" },
                        { key: "contact-lenses", label: "Contact Lenses" },
                      ].map((cat) => (
                        <label
                          key={cat.key}
                          onClick={() => setSelectedCategory(cat.key)}
                          className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedCategory === cat.key
                              ? "bg-[#0A251C] text-white font-semibold"
                              : "text-neutral-700 hover:bg-[#FAF3EB]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {cat.key === "meta-smart" && (
                              <svg
                                className={`w-3 h-2 ${
                                  selectedCategory === cat.key ? "text-[#76A9EA]" : "text-[#0A66C2]"
                                }`}
                                viewBox="0 0 24 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                              >
                                <path d="M6 1C3.238 1 1 3.238 1 6s2.238 5 5 5c3.2 0 4.5-5 6-5s2.8 5 6 5c2.762 0 5-2.238 5-5s-2.238-5-5-5c-3.2 0-4.5 5-6 5s-2.8-5-6-5z" />
                              </svg>
                            )}
                            <span>{cat.label}</span>
                          </div>
                          {categoryCounts[cat.key] !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                selectedCategory === cat.key
                                  ? "bg-white/20 text-[#C5A059]"
                                  : "text-neutral-500 bg-[#F4EFEA]"
                              }`}
                            >
                              {categoryCounts[cat.key]}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. GENDER */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("gender")}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                      GENDER
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.gender ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.gender
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1.5">
                      {[
                        { val: "all", label: "All Products" },
                        { val: "men", label: "Men's Collection" },
                        { val: "women", label: "Women's Collection" },
                        { val: "kids", label: "Kids & Teens" },
                      ].map((g) => (
                        <label
                          key={g.val}
                          onClick={() => handleGenderChange(g.val)}
                          className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedGender === g.val
                              ? "bg-[#FAF3EB] text-[#0A251C] font-semibold border-l-2 border-[#C5A059]"
                              : "text-neutral-700 hover:bg-[#FAF3EB]/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGender === g.val}
                            onChange={() => handleGenderChange(g.val)}
                            className="w-4 h-4 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. PRICE RANGE */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("price")}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                      PRICE RANGE
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.price ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.price
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1.5">
                      {[
                        { val: "all", label: "All Prices" },
                        { val: "under-5k", label: "Under ₹5,000" },
                        { val: "5k-15k", label: "₹5,000 - ₹15,000" },
                        { val: "15k-25k", label: "₹15,000 - ₹25,000" },
                        { val: "above-25k", label: "Luxury Collection (₹25,000+)" },
                      ].map((pTier) => (
                        <label
                          key={pTier.val}
                          onClick={() => setSelectedPrice(pTier.val)}
                          className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedPrice === pTier.val
                              ? "bg-[#FAF3EB] text-[#0A251C] font-semibold border-l-2 border-[#C5A059]"
                              : "text-neutral-700 hover:bg-[#FAF3EB]/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile_price_tier"
                            checked={selectedPrice === pTier.val}
                            onChange={() => setSelectedPrice(pTier.val)}
                            className="w-3.5 h-3.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span>{pTier.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. FRAME SHAPE */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("shape")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                        FRAME SHAPE
                      </span>
                      {selectedShapes.length > 0 && (
                        <span className="text-[10px] bg-[#C5A059] text-white font-bold px-1.5 py-0.2 rounded-full">
                          {selectedShapes.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.shape ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.shape
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1 max-h-52 overflow-y-auto pr-1">
                      {sortedShapes.map((shape) => (
                        <label
                          key={shape}
                          className="flex items-center justify-between text-xs text-neutral-700 hover:text-black cursor-pointer select-none py-1 px-1.5 rounded hover:bg-[#FAF3EB]/60 transition"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedShapes.includes(shape)}
                              onChange={() => toggleShape(shape)}
                              className="w-4 h-4 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                            />
                            <span>{shape}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {shapeCounts[shape] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. LUXURY BRAND */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("brand")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                        LUXURY BRAND
                      </span>
                      {selectedBrands.length > 0 ? (
                        <span className="text-[10px] bg-[#C5A059] text-white font-bold px-1.5 py-0.2 rounded-full">
                          {selectedBrands.length}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({sortedBrands.length})
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.brand ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.brand
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-2">
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search 40+ brands..."
                          value={brandSearchQuery}
                          onChange={(e) => setBrandSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-7 py-2 text-[11px] bg-white border border-[#E8DEC8] rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#0A251C]"
                        />
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2.5" />
                        {brandSearchQuery && (
                          <button
                            onClick={() => setBrandSearchQuery("")}
                            className="absolute right-2 top-2.5 text-neutral-400 hover:text-black cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        {filteredDisplayBrands.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic py-2">
                            No brands matching &quot;{brandSearchQuery}&quot;
                          </p>
                        ) : (
                          filteredDisplayBrands.map((brand) => (
                            <label
                              key={brand}
                              className="flex items-center justify-between text-xs text-neutral-700 hover:text-black cursor-pointer select-none py-1 px-1.5 rounded hover:bg-[#FAF3EB]/60 transition"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedBrands.includes(brand)}
                                  onChange={() => toggleBrand(brand)}
                                  className="w-4 h-4 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
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
                  </div>
                </div>

                {/* 6. OFFERS & DEALS */}
                <div className="border-b border-[#E8DEC8]/80 pb-4">
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => toggleSection("offers")}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[#1A1816]">
                      OFFERS &amp; DEALS
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ${
                        openSections.offers ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.offers
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-neutral-700 hover:text-black cursor-pointer select-none py-1">
                        <input
                          type="checkbox"
                          checked={selectedOffers.includes("sale")}
                          onChange={() => toggleOffer("sale")}
                          className="w-4 h-4 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#BB4D00] font-semibold">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          On Sale Price Applied
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-neutral-700 hover:text-black cursor-pointer select-none py-1">
                        <input
                          type="checkbox"
                          checked={selectedOffers.includes("new")}
                          onChange={() => toggleOffer("new")}
                          className="w-4 h-4 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#0A251C] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          New Arrivals Only
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-4 border-t border-[#E8DEC8] bg-[#FAF3EB] flex items-center gap-2.5 shrink-0">
                {activeChips.length > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-wider border border-[#E8DEC8] rounded-xl hover:bg-white text-stone-700 transition cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-sm text-center cursor-pointer"
                >
                  Show {filteredProducts.length} Frames
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ================= DESKTOP PERSISTENT FILTER SIDEBAR ================= */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-24">
            <div className="bg-white/95 backdrop-blur-md border border-[#E8DEC8] rounded-2xl p-4 sm:p-5 shadow-xs max-h-[calc(100vh-115px)] flex flex-col overflow-hidden">
              {/* Header with Total Count & Reset Pill */}
              <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[#E8DEC8] shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-serif text-sm font-bold tracking-wider text-[#0A251C] uppercase">
                    Filter Eyewear
                  </span>
                </div>
                {activeChips.length > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] font-semibold text-[#C5A059] hover:text-[#0A251C] transition cursor-pointer flex items-center gap-1"
                    title="Clear all active filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset ({activeChips.length})
                  </button>
                )}
              </div>

              {/* Scrollable Accordion Area with Custom Smooth Scrollbar */}
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 divide-y divide-[#E8DEC8]/60 scroll-smooth">
                {/* 1. CATEGORY ACCORDION */}
                <div className="pt-2">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("category")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                        CATEGORY
                      </span>
                      {selectedCategory !== "all" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.category ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.category
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      {[
                        { key: "all", label: "All Products" },
                        { key: "sunglasses", label: "Sunglasses" },
                        { key: "eyeglasses", label: "Eyeglasses" },
                        { key: "meta-smart", label: "Ray-Ban | Meta Smart Glasses" },
                        { key: "kids", label: "Kids & Teens" },
                        { key: "contact-lenses", label: "Contact Lenses" },
                      ].map((cat) => (
                        <label
                          key={cat.key}
                          onClick={() => setSelectedCategory(cat.key)}
                          className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedCategory === cat.key
                              ? "bg-[#0A251C] text-white font-medium shadow-2xs"
                              : "text-neutral-700 hover:bg-[#FAF3EB] hover:text-black"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {cat.key === "meta-smart" && (
                              <svg
                                className={`w-3 h-2 ${
                                  selectedCategory === cat.key ? "text-[#76A9EA]" : "text-[#0A66C2]"
                                }`}
                                viewBox="0 0 24 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                              >
                                <path d="M6 1C3.238 1 1 3.238 1 6s2.238 5 5 5c3.2 0 4.5-5 6-5s2.8 5 6 5c2.762 0 5-2.238 5-5s-2.238-5-5-5c-3.2 0-4.5 5-6 5s-2.8-5-6-5z" />
                              </svg>
                            )}
                            <span className="truncate">{cat.label}</span>
                          </div>
                          {categoryCounts[cat.key] !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                selectedCategory === cat.key
                                  ? "bg-white/20 text-[#C5A059]"
                                  : "text-neutral-400 bg-[#F4EFEA]"
                              }`}
                            >
                              {categoryCounts[cat.key]}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. GENDER ACCORDION */}
                <div className="pt-3">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("gender")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                        GENDER
                      </span>
                      {selectedGender !== "all" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.gender ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.gender
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      {[
                        { val: "all", label: "All Products" },
                        { val: "men", label: "Men's Collection" },
                        { val: "women", label: "Women's Collection" },
                        { val: "kids", label: "Kids & Teens" },
                      ].map((g) => (
                        <label
                          key={g.val}
                          onClick={() => handleGenderChange(g.val)}
                          className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedGender === g.val
                              ? "bg-[#FAF3EB] text-[#0A251C] font-semibold border-l-2 border-[#C5A059]"
                              : "text-neutral-700 hover:bg-[#FAF3EB]/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGender === g.val}
                            onChange={() => handleGenderChange(g.val)}
                            className="w-3.5 h-3.5 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. PRICE RANGE ACCORDION */}
                <div className="pt-3">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("price")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                        PRICE RANGE
                      </span>
                      {selectedPrice !== "all" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.price ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.price
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      {[
                        { val: "all", label: "All Prices" },
                        { val: "under-5k", label: "Under ₹5,000" },
                        { val: "5k-15k", label: "₹5,000 - ₹15,000" },
                        { val: "15k-25k", label: "₹15,000 - ₹25,000" },
                        { val: "above-25k", label: "Luxury Collection (₹25,000+)" },
                      ].map((pTier) => (
                        <label
                          key={pTier.val}
                          onClick={() => setSelectedPrice(pTier.val)}
                          className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
                            selectedPrice === pTier.val
                              ? "bg-[#FAF3EB] text-[#0A251C] font-semibold border-l-2 border-[#C5A059]"
                              : "text-neutral-700 hover:bg-[#FAF3EB]/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="desktop_price_tier"
                            checked={selectedPrice === pTier.val}
                            onChange={() => setSelectedPrice(pTier.val)}
                            className="w-3.5 h-3.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                          />
                          <span>{pTier.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. FRAME SHAPE ACCORDION */}
                <div className="pt-3">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("shape")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                        FRAME SHAPE
                      </span>
                      {selectedShapes.length > 0 && (
                        <span className="text-[10px] bg-[#C5A059] text-white font-bold px-1.5 py-0.2 rounded-full">
                          {selectedShapes.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.shape ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.shape
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-1 max-h-52 overflow-y-auto pr-1">
                      {sortedShapes.map((shape) => (
                        <label
                          key={shape}
                          className="flex items-center justify-between text-xs text-neutral-600 hover:text-black cursor-pointer select-none py-1 px-1.5 rounded hover:bg-[#FAF3EB]/60 transition"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedShapes.includes(shape)}
                              onChange={() => toggleShape(shape)}
                              className="w-3.5 h-3.5 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                            />
                            <span>{shape}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {shapeCounts[shape] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. LUXURY BRAND ACCORDION */}
                <div className="pt-3">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("brand")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                        LUXURY BRAND
                      </span>
                      {selectedBrands.length > 0 ? (
                        <span className="text-[10px] bg-[#C5A059] text-white font-bold px-1.5 py-0.2 rounded-full">
                          {selectedBrands.length}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({sortedBrands.length})
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.brand ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.brand
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-2">
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search 40+ brands..."
                          value={brandSearchQuery}
                          onChange={(e) => setBrandSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-7 py-1.5 text-[11px] bg-white border border-[#E8DEC8] rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#0A251C]"
                        />
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
                        {brandSearchQuery && (
                          <button
                            onClick={() => setBrandSearchQuery("")}
                            className="absolute right-2 top-2 text-neutral-400 hover:text-black cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        {filteredDisplayBrands.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic py-2">
                            No brands matching &quot;{brandSearchQuery}&quot;
                          </p>
                        ) : (
                          filteredDisplayBrands.map((brand) => (
                            <label
                              key={brand}
                              className="flex items-center justify-between text-xs text-neutral-600 hover:text-black cursor-pointer select-none py-1 px-1.5 rounded hover:bg-[#FAF3EB]/60 transition"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedBrands.includes(brand)}
                                  onChange={() => toggleBrand(brand)}
                                  className="w-3.5 h-3.5 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                                />
                                <span className="truncate max-w-[130px]">{brand}</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {brandCounts[brand] || 0}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. OFFERS & DEALS ACCORDION */}
                <div className="pt-3 pb-1">
                  <button
                    className="w-full flex items-center justify-between text-left py-1.5 px-1 rounded-lg hover:bg-[#FAF3EB]/70 transition-colors group cursor-pointer select-none"
                    onClick={() => toggleSection("offers")}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1816]">
                      OFFERS &amp; DEALS
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716B64] transition-transform duration-300 ease-in-out ${
                        openSections.offers ? "rotate-180 text-[#0A251C]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openSections.offers
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden space-y-2">
                      <label className="flex items-center gap-2 text-xs text-neutral-600 hover:text-black cursor-pointer select-none py-1 px-1 rounded hover:bg-[#FAF3EB]/60 transition">
                        <input
                          type="checkbox"
                          checked={selectedOffers.includes("sale")}
                          onChange={() => toggleOffer("sale")}
                          className="w-3.5 h-3.5 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#BB4D00] font-semibold">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          On Sale Price Applied
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-neutral-600 hover:text-black cursor-pointer select-none py-1 px-1 rounded hover:bg-[#FAF3EB]/60 transition">
                        <input
                          type="checkbox"
                          checked={selectedOffers.includes("new")}
                          onChange={() => toggleOffer("new")}
                          className="w-3.5 h-3.5 rounded border-[#E8DEC8] text-[#0A251C] focus:ring-0 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#0A251C] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          New Arrivals Only
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN AREA: SPOTLIGHT + SORT BAR + PRODUCT GRID ================= */}
          <section className="flex-1 w-full min-w-0">
            {/* Meta Smart Glasses Hero Spotlight Banner (Smartly Shown when Meta is selected) */}
            {selectedCategory === "meta-smart" && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A251C] via-[#11382C] to-[#0A251C] text-white p-6 sm:p-8 mb-6 border border-[#C5A059]/40 shadow-sm animate-in fade-in-50 duration-300">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border border-[#76A9EA] bg-[#E8F2FD]/15 text-[#76A9EA] mb-3 backdrop-blur-xs">
                    <svg
                      className="w-3 h-2 text-[#76A9EA]"
                      viewBox="0 0 24 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M6 1C3.238 1 1 3.238 1 6s2.238 5 5 5c3.2 0 4.5-5 6-5s2.8 5 6 5c2.762 0 5-2.238 5-5s-2.238-5-5-5c-3.2 0-4.5 5-6 5s-2.8-5-6-5z" />
                    </svg>
                    <span>RAY-BAN | META OFFICIAL COLLECTION</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white mb-2">
                    Next-Generation AI Smart Glasses
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed mb-4 font-light">
                    The iconic style of Ray-Ban infused with cutting-edge Meta AI. Capture POV
                    photos and 1080p videos with the ultra-wide 12MP camera, listen to music with
                    immersive open-ear spatial audio, and livestream hands-free.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#E8DEC8]">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
                      Ultra-Wide 12MP Camera
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
                      5-Mic Spatial Audio
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
                      Voice-Activated Meta AI
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
                      Transitions &amp; Polarized
                    </span>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#C5A059]/15 blur-3xl pointer-events-none" />
              </div>
            )}

            {/* Controls Bar: Search & Sort with Live Autocomplete */}
            <div className="bg-white rounded-xl border border-[#E8DEC8] p-3 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 relative">
              {/* Search in Catalog with Autocomplete Suggestions */}
              <div ref={searchContainerRef} className="relative w-full md:w-80">
                <form onSubmit={handleCatalogSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search brand, shape, model..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchSuggestions(true);
                    }}
                    onFocus={() => setShowSearchSuggestions(true)}
                    className="w-full pl-9 pr-8 py-2 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:border-[#C5A059] transition text-[#1A1816]"
                  />
                  <Search className="w-4 h-4 text-[#C5A059] absolute left-3 top-2.5 pointer-events-none" />
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchSuggestions(false);
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("search");
                        params.delete("q");
                        router.replace(`/products?${params.toString()}`);
                      }}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Suggestions Dropdown below catalog search */}
                {showSearchSuggestions && searchQuery.trim().length > 0 && catalogSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[#E8DEC8] shadow-xl z-30 p-2 text-xs divide-y divide-stone-100 max-h-60 overflow-y-auto animate-in fade-in duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#716B64]">
                      Matching Brands &amp; Shapes
                    </div>
                    {catalogSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(item.value);
                          setShowSearchSuggestions(false);
                          const params = new URLSearchParams(searchParams.toString());
                          params.set("search", item.value);
                          router.replace(`/products?${params.toString()}`);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FAF3EB] text-[#1A1816] flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-medium">{item.label}</span>
                        <span className="text-[10px] text-[#716B64] bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E8DEC8]">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
                    className="bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#0A251C] cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF3EB] text-[#1A1816] border border-[#E8DEC8]"
                  >
                    <span>{chip.label}</span>
                    <button
                      onClick={chip.onRemove}
                      className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                      aria-label={`Remove filter ${chip.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Product Grid: Never shows a blank screen */}
            {filteredProducts.length === 0 ? (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* UPPER: Clear No-Matches Notice with helpful quick actions */}
                <div className="bg-[#FAF3EB]/70 rounded-2xl border border-[#E8DEC8] p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0A251C] mb-1.5">
                    {searchQuery.trim()
                      ? `No exact matches found for "${searchQuery}"`
                      : "No matching frames found for selected filters"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#716B64] max-w-md mx-auto mb-5 leading-relaxed">
                    {searchQuery.trim()
                      ? "We couldn't find an exact match for your search term. Check for typos, try broader keywords, or browse our recommended atelier frames below."
                      : "No eyewear matches all currently active filters. Try clearing some filters or exploring our curated designer styles."}
                  </p>

                  {/* Recovery Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchSuggestions(false);
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete("search");
                          params.delete("q");
                          router.replace(`/products?${params.toString()}`);
                        }}
                        className="px-4 py-2 rounded-lg bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-xs font-semibold text-[#0A251C] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5 text-stone-400" />
                        <span>Clear Search Query</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-5 py-2 rounded-lg bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>

                  {/* Suggested Search Terms */}
                  <div className="pt-4 border-t border-[#E8DEC8]/60 flex flex-wrap items-center justify-center gap-2 text-xs text-[#716B64]">
                    <span className="font-semibold text-[#0A251C] text-[11px] uppercase tracking-wider">
                      Suggested Searches:
                    </span>
                    {["Aviator", "Square", "Round", "Ray-Ban", "Cartier", "Polarized", "Titanium", "Sunglasses"].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                            setShowSearchSuggestions(false);
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("search", tag);
                            router.replace(`/products?${params.toString()}`);
                          }}
                          className="px-2.5 py-1 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] hover:text-[#C5A059] text-[11px] font-medium text-[#1A1816] transition cursor-pointer shadow-2xs"
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* LOWER: Similar & Recommended Designer Frames Grid */}
                {similarProducts.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DEC8] pb-3 mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0A251C]">
                            Similar &amp; Recommended Designer Frames
                          </h3>
                          <span className="text-[10px] bg-[#FAF3EB] text-[#C5A059] border border-[#E8DEC8] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Atelier Picks
                          </span>
                        </div>
                        <p className="text-xs text-[#716B64] mt-0.5">
                          Hand-selected luxury styles from Shivam Optical tailored for you
                        </p>
                      </div>
                      <span className="text-xs text-[#716B64] font-medium">
                        Showing {similarProducts.length} Recommendations
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {similarProducts.map((p) => (
                        <ProductCard key={`sim-${p.id}`} product={p} />
                      ))}
                    </div>
                  </div>
                )}
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
                      className="px-8 py-3 bg-[#0A251C] text-white text-xs uppercase font-bold tracking-widest rounded-full hover:bg-[#C5A059] hover:text-[#0A251C] transition shadow-md cursor-pointer inline-flex items-center gap-2"
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
