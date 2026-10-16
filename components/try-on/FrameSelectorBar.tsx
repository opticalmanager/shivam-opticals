"use client";

import React from "react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { hasTryOnModel } from "@/lib/try-on/products/TryOnProductConfig";

interface FrameSelectorBarProps {
  products: Product[];
  activeProduct: Product;
  onSelectProduct: (product: Product) => void;
}

export const FrameSelectorBar: React.FC<FrameSelectorBarProps> = ({
  products,
  activeProduct,
  onSelectProduct,
}) => {
  // Only display products that actually have .glb models configured
  const tryOnAvailableProducts = products.filter(hasTryOnModel);

  if (tryOnAvailableProducts.length <= 1) {
    return null;
  }

  return (
    <div className="w-full bg-black/60 backdrop-blur-md border-t border-white/10 p-2.5 sm:p-3 overflow-x-auto scrollbar-none flex items-center gap-3">
      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400 shrink-0 pl-1 hidden sm:inline">
        Try Other Frames:
      </span>

      <div className="flex items-center gap-2.5">
        {tryOnAvailableProducts.map((p) => {
          const isActive = p.id === activeProduct.id;
          const imgUrl = p.img || (p.images && p.images[0]) || "/images/clean_frame_1.png";

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProduct(p)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 text-left ${
                isActive
                  ? "bg-[#0A251C] border-[#C5A059] ring-1 ring-[#C5A059] shadow-md"
                  : "bg-white/10 hover:bg-white/20 border-white/15 text-stone-300"
              }`}
            >
              <div className="w-10 h-6 shrink-0 flex items-center justify-center bg-white/5 rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={p.name} className="w-full h-full object-contain" />
              </div>
              <div className="pr-1">
                <div className={`text-[10px] font-bold truncate max-w-[110px] ${isActive ? "text-[#C5A059]" : "text-white"}`}>
                  {p.brand || "SHIVAM OPTICALS"}
                </div>
                <div className="text-[9px] text-stone-300 font-mono">
                  {formatCurrency(p.price)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
