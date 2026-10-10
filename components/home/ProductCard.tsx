"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  const originalPrice = product.originalPrice || (product.price > 0 ? Math.round(product.price * 1.25) : 0);
  const discount =
    product.discountPct ||
    (originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0);
  const colorCount = product.colors?.length || (product.variants?.length ? product.variants.length : 1);
  const displayImg = product.img || product.images?.[0] || "/images/placeholder.jpg";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.colors?.[0] || "#1A1816");
    openCart();
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card group bg-white border border-[#D1D5DB] rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 relative">
      {/* Upper Section */}
      <div className="p-3 pt-2.5 pb-2 flex flex-col items-center">
        {/* Top Row: Wishlist Heart & Burgundy 'SAVE XX%' Pill */}
        <div className="w-full flex items-center justify-between mb-1">
          <button
            onClick={handleToggleWishlist}
            className="w-6 h-6 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-400 hover:text-red-500 transition shadow-xs z-10 cursor-pointer"
            title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart
              className={`w-3 h-3 ${
                isSaved ? "fill-red-500 text-red-500" : "text-neutral-400"
              }`}
            />
          </button>

          {discount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#512D2B] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
              SAVE {discount}%
            </span>
          )}
        </div>

        {/* Eyewear Image Container */}
        <Link
          href={`/product/${product.id}`}
          className="w-full h-24 flex items-center justify-center p-1 my-1 cursor-pointer"
        >
          <img
            src={displayImg}
            alt={product.name}
            loading="lazy"
            className="h-24 max-h-24 max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Brand Header */}
        <div className="text-[10px] font-semibold tracking-[0.25em] text-[#6B7280] uppercase mt-1 text-center">
          {product.brand}
        </div>

        {/* Bold Model / Product Title */}
        <Link href={`/product/${product.id}`} className="block text-center w-full">
          <h4
            className="text-sm font-bold text-[#1A1816] tracking-wide mt-0.5 text-center truncate w-full hover:text-[#C5A059] transition cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h4>
        </Link>

        {/* Price Row */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-xs text-[#6B7280]">From</span>
          <span className="text-xs font-bold text-[#16803E]">
            {formatCurrency(product.price)}
          </span>
          {originalPrice > product.price && (
            <span className="text-xs sm:text-sm text-[#DD2E2E] line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Colors Subtitle */}
        <div className="text-[11px] text-[#6B7280] mt-0.5 mb-1 text-center">
          Available in {colorCount} {colorCount === 1 ? "Color" : "Colors"}
        </div>
      </div>

      {/* Full-Width Bottom Button: ADD TO CART */}
      <button
        onClick={handleAddToCart}
        className="w-full py-2 bg-[#D9D9D9] hover:bg-[#0A251C] hover:text-white text-[#1A1816] text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#D1D5DB] rounded-b-2xl"
      >
        <span>ADD TO CART</span>
        <ShoppingBag className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};
