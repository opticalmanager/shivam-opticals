"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PRODUCTS } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { Search, X, ArrowRight } from "lucide-react";

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, closeSearchModal } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.shape.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      <div
        onClick={closeSearchModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200 border border-[#E8E2D9]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex items-center gap-3 bg-[#FBF9F5]">
          <Search className="w-5 h-5 text-[#C5A059] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, frame shape, material, or style..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none text-[#1A1816] placeholder:text-[#716B64]"
          />
          <button
            onClick={closeSearchModal}
            className="p-1 hover:text-[#C5A059] text-stone-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popular Tags */}
        <div className="px-5 py-2.5 bg-[#FAF3EB]/50 border-b border-[#E8DEC8]/50 flex items-center gap-2 overflow-x-auto text-[11px] text-[#716B64]">
          <span className="font-bold uppercase tracking-wider text-[#0A251C]">Trending:</span>
          {["Aviator", "Square", "Round", "Titanium", "Sunglasses", "GAST"].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8DEC8] hover:border-[#C5A059] transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-[380px] overflow-y-auto p-4 sm:p-5">
          {query.trim() === "" ? (
            <div className="text-center py-10 text-xs text-[#716B64]">
              Start typing to search our designer eyewear collection.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#716B64]">
              No frames matched &ldquo;{query}&rdquo;. Try searching for Aviator, Square, or GAST.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={closeSearchModal}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 hover:border-[#C5A059] hover:bg-[#FAF3EB]/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1A1816] group-hover:text-[#C5A059] transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-[#716B64]">
                        {product.brand} • {product.shape} • {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#1A1816]">
                      {formatCurrency(product.price)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#C5A059] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
