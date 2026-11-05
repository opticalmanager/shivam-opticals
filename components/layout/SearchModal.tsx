"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  Tag,
  Glasses,
  Loader2,
} from "lucide-react";

// In-memory cache across modal toggles to eliminate refetch latency
let cachedModalCatalog: Product[] | null = null;

const RECENT_SEARCHES_STORAGE_KEY = "shivam_optics_recent_searches_v1";

const POPULAR_SEARCH_TAGS = [
  "Aviator",
  "Ray-Ban",
  "Cartier",
  "Square",
  "Round",
  "Meta Smart",
  "Titanium",
  "Polarized",
  "Sunglasses",
  "Eyeglasses",
  "Vogue",
];

const CURATED_CATEGORIES = [
  { label: "Sunglasses", href: "/products?type=sunglasses", count: "Luxury Sun" },
  { label: "Eyeglasses", href: "/products?type=eyeglasses", count: "Optical Frames" },
  { label: "Ray-Ban | Meta", href: "/products?category=meta-smart", count: "Smart Glasses" },
  { label: "New Arrivals", href: "/products?filter=new", count: "Latest Releases" },
];

export const SearchModal: React.FC = () => {
  const router = useRouter();
  const { isSearchModalOpen, closeSearchModal } = useAuth();

  const [query, setQuery] = useState<string>("");
  const [catalog, setCatalog] = useState<Product[]>(cachedModalCatalog || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch live catalog when modal opens if not already cached
  useEffect(() => {
    if (!isSearchModalOpen) return;

    // Focus input on open
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    if (cachedModalCatalog && cachedModalCatalog.length > 0) {
      setCatalog(cachedModalCatalog);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.products && Array.isArray(data.products)) {
          cachedModalCatalog = data.products;
          setCatalog(data.products);
        }
      })
      .catch((err) => {
        console.warn("SearchModal: Error loading live products catalog:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isSearchModalOpen]);

  // Save a search term to recent searches
  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== termToRemove);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearAllRecentSearches = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Execute full search navigation to /products page
  const executeSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    closeSearchModal();
    setQuery("");
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeSearch(query);
    }
  };

  // Smart multi-token filtering & matching
  const { filteredProducts, brandSuggestions, shapeSuggestions } = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || catalog.length === 0) {
      return { filteredProducts: [], brandSuggestions: [], shapeSuggestions: [] };
    }

    const tokens = cleanQuery
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    // Matching brands
    const matchingBrandMap = new Map<string, number>();
    // Matching shapes
    const matchingShapeMap = new Map<string, number>();

    const scored = catalog
      .map((p) => {
        const pName = (p.name || "").toLowerCase();
        const pBrand = (p.brand || "").toLowerCase();
        const pShape = (p.shape || "").toLowerCase();
        const pCategory = (p.category || "").toLowerCase();
        const pType = (p.type || "").toLowerCase();
        const pColor = (p.color || "").toLowerCase();
        const pSku = (p.sku || "").toLowerCase();

        const searchable = `${pName} ${pBrand} ${pShape} ${pCategory} ${pType} ${pColor} ${pSku}`;

        // Verify all tokens match
        const matchesAll = tokens.every((token) => {
          const cleanToken = token.replace(/[-_]/g, "");
          const cleanSearchable = searchable.replace(/[-_]/g, "");
          return searchable.includes(token) || cleanSearchable.includes(cleanToken);
        });

        if (!matchesAll) return null;

        // Tally brands and shapes
        if (p.brand) {
          matchingBrandMap.set(p.brand, (matchingBrandMap.get(p.brand) || 0) + 1);
        }
        if (p.shape) {
          const normShape = p.shape.charAt(0).toUpperCase() + p.shape.slice(1).toLowerCase();
          matchingShapeMap.set(normShape, (matchingShapeMap.get(normShape) || 0) + 1);
        }

        // Calculate score
        let score = 0;
        if (pBrand.startsWith(cleanQuery)) score += 30;
        else if (pBrand.includes(cleanQuery)) score += 20;

        if (pName.startsWith(cleanQuery)) score += 25;
        else if (pName.includes(cleanQuery)) score += 15;

        if (pShape === cleanQuery) score += 18;
        if (pCategory.includes(cleanQuery)) score += 12;

        if (p.isBestSeller) score += 5;
        score += (p.rating || 4) * 2;

        return { product: p, score };
      })
      .filter((item): item is { product: Product; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    const brands = Array.from(matchingBrandMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const shapes = Array.from(matchingShapeMap.entries())
      .map(([shape, count]) => ({ shape, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      filteredProducts: scored,
      brandSuggestions: brands,
      shapeSuggestions: shapes,
    };
  }, [query, catalog]);

  // Fallback recommended products when 0 matches
  const fallbackRecommended = useMemo(() => {
    if (filteredProducts.length > 0 || catalog.length === 0) return [];
    return catalog
      .slice()
      .sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return (Number(b.rating) || 5) - (Number(a.rating) || 5);
      })
      .slice(0, 3);
  }, [filteredProducts.length, catalog]);

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-12 flex items-start justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeSearchModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden z-50 border border-[#E8DEC8] flex flex-col max-h-[88vh]">
        {/* Search Input Bar (Form with Enter Key Support) */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-4 border-b border-[#E8DEC8] flex items-center gap-3 bg-[#FAF7F2] shrink-0"
        >
          <Search className="w-5 h-5 text-[#C5A059] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, frame shape, model, or style..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none text-[#0A251C] placeholder:text-[#716B64] font-medium"
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-40 cursor-pointer"
          >
            <span>Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={closeSearchModal}
            className="p-1.5 hover:text-[#C5A059] text-stone-400 transition cursor-pointer rounded-lg hover:bg-[#FAF3EB]"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Live Autocomplete / Suggestion Strip When Typing */}
        {query.trim().length > 0 && (brandSuggestions.length > 0 || shapeSuggestions.length > 0) && (
          <div className="px-4 py-2 bg-[#FAF3EB]/80 border-b border-[#E8DEC8] flex flex-wrap items-center gap-2 text-xs shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#716B64]">
              Suggestions:
            </span>
            {brandSuggestions.map(({ brand, count }) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  closeSearchModal();
                  router.push(`/products?brand=${encodeURIComponent(brand)}`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-[#0A251C] text-[11px] font-medium transition cursor-pointer"
              >
                <span>{brand}</span>
                <span className="text-[10px] text-[#716B64]">({count})</span>
              </button>
            ))}
            {shapeSuggestions.map(({ shape, count }) => (
              <button
                key={shape}
                type="button"
                onClick={() => {
                  closeSearchModal();
                  router.push(`/products?shape=${encodeURIComponent(shape.toLowerCase())}`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-[#0A251C] text-[11px] font-medium transition cursor-pointer"
              >
                <span>{shape}</span>
                <span className="text-[10px] text-[#716B64]">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
              <p className="text-xs text-[#716B64]">Searching Shivam Optical Atelier catalog...</p>
            </div>
          ) : query.trim() === "" ? (
            /* INITIAL STATE: When user hasn't typed anything yet */
            <div className="space-y-5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#716B64] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-[10px] text-[#716B64] hover:text-[#0A251C] transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => executeSearch(term)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] hover:border-[#C5A059] hover:bg-[#FAF3EB] text-xs text-[#1A1816] transition cursor-pointer"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="text-stone-400 hover:text-stone-700 ml-0.5"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#716B64] flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Popular Searches</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => executeSearch(tag)}
                      className="px-3 py-1 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] hover:text-[#C5A059] text-xs font-medium text-[#1A1816] transition cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Categories */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#716B64] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Browse Collections</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CURATED_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      onClick={closeSearchModal}
                      className="p-2.5 rounded-xl border border-[#E8DEC8] bg-[#FAF7F2] hover:bg-[#FAF3EB] hover:border-[#C5A059] transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#0A251C] group-hover:text-[#C5A059] transition-colors">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-[#716B64]">{cat.count}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* NO MATCHES STATE: Elegant recovery with recommendations, never blank */
            <div className="space-y-4">
              <div className="text-center py-6 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8] p-5">
                <Glasses className="w-8 h-8 text-[#C5A059] mx-auto mb-2 opacity-80" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                  No Frames Matched &ldquo;{query}&rdquo;
                </h4>
                <p className="text-xs text-[#716B64] max-w-sm mx-auto mb-3">
                  Check your spelling, try searching for a brand like &ldquo;Ray-Ban&rdquo;, or frame shape like &ldquo;Aviator&rdquo;.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["Aviator", "Square", "Round", "Ray-Ban", "Cartier"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setQuery(t)}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-[11px] font-medium text-[#0A251C] transition cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {fallbackRecommended.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Popular Atelier Styles You May Like</span>
                  </div>
                  <div className="space-y-2">
                    {fallbackRecommended.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={closeSearchModal}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8DEC8] hover:border-[#C5A059] hover:bg-[#FAF3EB]/50 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-white border border-[#E8DEC8] p-1 flex items-center justify-center shrink-0">
                            <img
                              src={product.img || product.images?.[0] || "/images/placeholder.jpg"}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h5 className="font-sans text-xs font-semibold text-[#1A1816] group-hover:text-[#C5A059] transition-colors leading-snug line-clamp-1">
                              {product.name}
                            </h5>
                            <p className="text-[11px] text-[#716B64]">
                              {product.brand} • {product.shape} • {product.category}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#0A251C]">
                          {formatCurrency(product.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SEARCH RESULTS LIST */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#716B64] font-medium pb-1 border-b border-[#E8DEC8]/60">
                <span>Matching Designer Eyewear ({filteredProducts.length})</span>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold">
                  Press Enter to view all
                </span>
              </div>

              {filteredProducts.slice(0, 8).map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => {
                    saveRecentSearch(query);
                    closeSearchModal();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 hover:border-[#C5A059] hover:bg-[#FAF3EB]/40 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-13 h-13 rounded-lg bg-white border border-[#E8DEC8] p-1 flex items-center justify-center shrink-0">
                      <img
                        src={product.img || product.images?.[0] || "/images/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans text-xs sm:text-sm font-semibold text-[#1A1816] group-hover:text-[#C5A059] transition-colors leading-snug truncate">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-[#716B64] truncate">
                        {product.brand} • {product.shape} • {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#0A251C]">
                      {formatCurrency(product.price)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#C5A059] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer / View All CTA Button */}
        {query.trim().length > 0 && filteredProducts.length > 0 && (
          <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DEC8] shrink-0">
            <button
              type="button"
              onClick={() => executeSearch(query)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition flex items-center justify-between cursor-pointer"
            >
              <span>View All {filteredProducts.length} Results in Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
