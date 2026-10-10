import React from "react";
import { Search, RotateCcw } from "lucide-react";

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  brand: string;
  onBrandChange: (val: string) => void;
  shape?: string;
  onShapeChange?: (val: string) => void;
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
  shapes?: string[];
  onReset: () => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  shape = "",
  onShapeChange,
  categories,
  brands,
  shapes = [],
  onReset,
}) => {
  const hasActiveFilters = Boolean(search || category || brand || shape);

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-xl p-3 shadow-2xs space-y-2.5">
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by frame model, brand, or shape..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full sm:w-36">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Dropdown */}
        <div className="w-full sm:w-36">
          <select
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059] cursor-pointer"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.name || b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shape Dropdown */}
        {shapes.length > 0 && onShapeChange && (
          <div className="w-full sm:w-36">
            <select
              value={shape}
              onChange={(e) => onShapeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059] cursor-pointer"
            >
              <option value="">All Shapes</option>
              {shapes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
