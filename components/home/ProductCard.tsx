"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";
import { getProductFallbackImage } from "@/lib/productsService";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const isSaved = isInWishlist(product.id);

  // Real Dynamic Discount: Only calculate if originalPrice is legitimately higher than price
  const hasRealDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct = hasRealDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : (product.discountPct && product.discountPct > 0 ? product.discountPct : 0);

  // Resolve all available color variants accurately
  const availableVariants = useMemo(() => {
    let raw: { id: string; colorName: string; colorHex: string; image?: string }[] = [];
    if (product.variants && product.variants.length > 0) {
      raw = product.variants.map((v, i) => ({
        id: v.id || `v-${i}`,
        colorName: v.colorName || `Color ${i + 1}`,
        colorHex: v.colorHex || "#1A1816",
        image: v.image || v.images?.[0],
      }));
    } else if (product.colorVariants && product.colorVariants.length > 0) {
      raw = product.colorVariants.map((cv, i) => ({
        id: cv.id || `cv-${i}`,
        colorName: cv.colorName || `Color ${i + 1}`,
        colorHex: cv.colorHex || "#1A1816",
        image: cv.featuredImage || cv.gallery?.[0],
      }));
    } else if (product.colors && product.colors.length > 0) {
      raw = product.colors.map((c, i) => ({
        id: `c-${i}`,
        colorName: c.startsWith("#") ? `Color ${i + 1}` : c,
        colorHex: c.startsWith("#") ? c : "#1A1816",
        image: product.images?.[i] || product.img,
      }));
    } else {
      raw = [
        {
          id: "c-0",
          colorName: product.color || "Black",
          colorHex: product.colorHex || "#1A1816",
          image: product.img || product.images?.[0],
        },
      ];
    }

    // Deduplicate so each dot represents a genuine distinct colorway
    const seen = new Set<string>();
    const deduplicated: typeof raw = [];
    for (const v of raw) {
      const cleanName = (v.colorName || "").replace(/\s+/g, " ").trim().toLowerCase();
      const isPlaceholder = !cleanName || cleanName === "atelier signature noir";
      const key = isPlaceholder ? `${v.colorHex || ""}-${v.image || ""}` : cleanName;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(v);
      }
    }
    return deduplicated;
  }, [product]);

  const totalColors = availableVariants.length;
  const activeVariant = availableVariants[selectedVariantIdx] || availableVariants[0];
  const fallbackImg = getProductFallbackImage(product.shape, product.slug);
  const displayImg = activeVariant?.image || product.images?.[0] || product.img || fallbackImg;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, activeVariant?.colorHex || "#1A1816");
    openCart();
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card group bg-white border border-[#E8DEC8] hover:border-[#C5A059]/60 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 relative select-none">
      {/* Upper Space: Seamless White Image Canvas with Overlaid Badges */}
      <div className="p-3 pt-2.5 pb-2 flex flex-col items-center">
        {/* Eyewear Image Container with Floating Badges */}
        <div className="relative w-full h-28 sm:h-32 flex items-center justify-center mb-1">
          {/* Dynamic Discount Badge (Overlaid Top-Left) */}
          {discountPct > 0 && (
            <span className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-full bg-[#512D2B] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs pointer-events-none">
              SAVE {discountPct}%
            </span>
          )}

          {/* Wishlist Heart Icon (Overlaid Top-Right) */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full border border-[#E8DEC8] bg-white/95 hover:bg-white flex items-center justify-center text-neutral-400 hover:text-red-500 transition shadow-xs cursor-pointer hover:scale-105"
            title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            aria-label="Wishlist toggle"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isSaved ? "fill-red-500 text-red-500" : "text-neutral-400"
              }`}
            />
          </button>

          {/* Eyewear Image Perfectly Fitted in Upper White Space */}
          <Link
            href={`/product/${product.id}`}
            className="w-full h-full flex items-center justify-center p-1 cursor-pointer"
          >
            <img
              key={`${product.id}-${selectedVariantIdx}`}
              src={displayImg}
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (product.images && product.images[0] && target.src !== product.images[0]) {
                  target.src = product.images[0];
                } else if (product.img && target.src !== product.img) {
                  target.src = product.img;
                } else {
                  target.src = fallbackImg;
                }
              }}
              className="w-full h-full max-h-28 sm:max-h-32 object-contain filter drop-shadow-sm group-hover:scale-105 transition-all duration-200 animate-in fade-in"
            />
          </Link>
        </div>

        {/* Brand Header */}
        <div className="font-sans text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.25em] text-[#716B64] uppercase mt-1 text-center">
          {product.brand}
        </div>

        {/* Product Model Name */}
        <Link href={`/product/${product.id}`} className="block text-center w-full px-1">
          <h4
            className="font-sans text-xs sm:text-[13px] md:text-sm font-semibold text-[#1A1816] tracking-[0.01em] leading-snug mt-0.5 text-center truncate w-full hover:text-[#C5A059] transition cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h4>
        </Link>

        {/* Minimalist Numeric Rating Badge */}
        {product.rating && (
          <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-[#716B64]">
            <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059] shrink-0" />
            <span className="font-semibold text-[#1A1816] text-[11px]">
              {Number(product.rating).toFixed(1)}
            </span>
            {product.reviewCount && product.reviewCount > 0 ? (
              <span className="text-[10px] text-[#716B64]">
                ({product.reviewCount})
              </span>
            ) : null}
          </div>
        )}

        {/* Price Row: Real Selling Price and Strikethrough Original Price */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
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
        <div className="flex flex-col items-center gap-1 mt-1.5 mb-1">
          {availableVariants.length > 1 && (
            <div className="flex items-center gap-1.5 justify-center flex-wrap max-w-full">
              {availableVariants.slice(0, 5).map((v, idx) => (
                <button
                  key={v.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIdx(idx);
                  }}
                  className={`w-3 h-3 rounded-full border transition-all duration-150 shrink-0 cursor-pointer ${
                    selectedVariantIdx === idx
                      ? "border-[#0A251C] ring-2 ring-[#C5A059] scale-125 shadow-xs"
                      : "border-neutral-300 opacity-80 hover:opacity-100 hover:scale-110"
                  }`}
                  style={{ backgroundColor: v.colorHex || "#1A1816" }}
                  title={v.colorName}
                  aria-label={`Select color ${v.colorName}`}
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

      {/* Full-Width Luxury Button: ADD TO CART */}
      <button
        onClick={handleAddToCart}
        className="w-full py-2 bg-[#FAF7F2] hover:bg-[#0A251C] text-[#0A251C] hover:text-white text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#E8DEC8] rounded-b-2xl"
      >
        <span>ADD TO CART</span>
        <ShoppingBag className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};
