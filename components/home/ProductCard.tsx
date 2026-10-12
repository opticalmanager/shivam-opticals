"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isSaved = isInWishlist(product.id);

  // Real Dynamic Discount: Only calculate if originalPrice is legitimately higher than price
  const hasRealDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct = hasRealDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : (product.discountPct && product.discountPct > 0 ? product.discountPct : 0);

  // Resolve all available color variants accurately
  const availableVariants = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((v, i) => ({
        id: v.id || `v-${i}`,
        colorName: v.colorName || `Color ${i + 1}`,
        colorHex: v.colorHex || "#1A1816",
      }));
    }
    if (product.colorVariants && product.colorVariants.length > 0) {
      return product.colorVariants.map((cv, i) => ({
        id: cv.id || `cv-${i}`,
        colorName: cv.colorName || `Color ${i + 1}`,
        colorHex: cv.colorHex || "#1A1816",
      }));
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors.map((c, i) => ({
        id: `c-${i}`,
        colorName: c.startsWith("#") ? `Color ${i + 1}` : c,
        colorHex: c.startsWith("#") ? c : "#1A1816",
      }));
    }
    return [
      {
        id: "c-0",
        colorName: product.color || "Black",
        colorHex: product.colorHex || "#1A1816",
      },
    ];
  }, [product]);

  const totalColors = availableVariants.length;
  const displayImg = product.img || product.images?.[0] || "/images/placeholder.jpg";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, availableVariants[0]?.colorHex || "#1A1816");
    openCart();
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card group bg-white border border-[#E8DEC8] hover:border-[#C5A059]/60 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative select-none">
      {/* Upper Space: Image Canvas with Overlaid Discount Badge and Heart Icon */}
      <div className="relative w-full h-48 sm:h-52 bg-[#FAF7F2]/60 flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b border-[#E8DEC8]/60">
        {/* Dynamic Discount Badge (Overlaid Top-Left) */}
        {discountPct > 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#512D2B] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs pointer-events-none">
            SAVE {discountPct}%
          </span>
        )}

        {/* Wishlist Heart Icon (Overlaid Top-Right) */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E8DEC8] bg-white/95 hover:bg-white flex items-center justify-center text-neutral-400 hover:text-red-500 transition shadow-xs cursor-pointer hover:scale-105"
          title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
          aria-label="Wishlist toggle"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isSaved ? "fill-red-500 text-red-500" : "text-neutral-400"
            }`}
          />
        </button>

        {/* Eyewear Image Perfectly Centered & Fitting the Canvas */}
        <Link
          href={`/product/${product.id}`}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          <img
            src={displayImg}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/clean_frame_1.png";
            }}
            className="w-full h-full max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>
      </div>

      {/* Lower Space: Product Details */}
      <div className="p-3 sm:p-4 pt-3 flex flex-col flex-1 justify-between">
        <div className="flex flex-col items-center text-center">
          {/* Brand Header */}
          <div className="text-[10px] font-semibold tracking-[0.25em] text-[#6B7280] uppercase mb-0.5">
            {product.brand}
          </div>

          {/* Product Model Name */}
          <Link href={`/product/${product.id}`} className="block text-center w-full">
            <h4
              className="text-xs sm:text-sm font-bold text-[#1A1816] tracking-wide text-center truncate w-full hover:text-[#C5A059] transition cursor-pointer"
              title={product.name}
            >
              {product.name}
            </h4>
          </Link>

          {/* Price Row: Real Selling Price and Strikethrough Original Price */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] sm:text-xs text-[#6B7280]">From</span>
            <span className="text-xs sm:text-sm font-bold text-[#16803E]">
              {formatCurrency(product.price)}
            </span>
            {hasRealDiscount && (
              <span className="text-[11px] sm:text-xs text-[#DD2E2E] line-through font-normal">
                {formatCurrency(product.originalPrice!)}
              </span>
            )}
          </div>

          {/* Colors Row: Swatches & Accurate Count */}
          <div className="flex flex-col items-center gap-1 mt-1.5 mb-0.5">
            {availableVariants.length > 1 && (
              <div className="flex items-center gap-1.5 justify-center flex-wrap max-w-full">
                {availableVariants.slice(0, 5).map((v, idx) => (
                  <span
                    key={v.id || idx}
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: v.colorHex || "#1A1816" }}
                    title={v.colorName}
                  />
                ))}
                {availableVariants.length > 5 && (
                  <span className="text-[9px] text-[#6B7280] font-mono font-medium">
                    +{availableVariants.length - 5}
                  </span>
                )}
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] text-[#6B7280]">
              Available in {totalColors} {totalColors === 1 ? "Colour" : "Colours"}
            </span>
          </div>
        </div>
      </div>

      {/* Full-Width Luxury Button: ADD TO CART */}
      <button
        onClick={handleAddToCart}
        className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#0A251C] text-[#0A251C] hover:text-white text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#E8DEC8] rounded-b-2xl"
      >
        <span>ADD TO CART</span>
        <ShoppingBag className="w-3 h-3" />
      </button>
    </div>
  );
};
