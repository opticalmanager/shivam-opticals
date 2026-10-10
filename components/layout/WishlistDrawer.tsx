"use client";

import React from "react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Heart, X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export const WishlistDrawer: React.FC = () => {
  const {
    wishlistProducts,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    isWishlistOpen,
    closeWishlist,
    wishlistCount,
  } = useWishlist();
  const { addToCartDirect } = useCart();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeWishlist}
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
      />

      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FCFAF7] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-[#E8DEC8]">
        {/* Header */}
        <div className="p-5 border-b border-[#E8DEC8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-[#0A251C] font-serif">
              Saved Favorites
            </h3>
            <span className="bg-[#0A251C] text-[#C5A059] text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
              {wishlistCount} {wishlistCount === 1 ? "FRAME" : "FRAMES"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {wishlistCount > 0 && (
              <button
                onClick={clearWishlist}
                className="text-[11px] text-stone-500 hover:text-rose-600 transition underline cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeWishlist}
              className="p-1.5 hover:text-[#C5A059] text-[#1A1816] rounded-full hover:bg-[#FAF3EB] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wishlist Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-600">
              <div className="w-16 h-16 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059]">
                <Heart className="w-8 h-8" />
              </div>
              <p className="text-base font-serif font-bold text-[#0A251C]">Your Wishlist is Empty</p>
              <p className="text-xs max-w-xs text-stone-500 leading-relaxed">
                Tap the bookmark icon on any designer eyewear frame to curate your personal style vault.
              </p>
              <Link
                href="/products"
                onClick={closeWishlist}
                className="mt-2 px-6 py-2.5 bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black transition cursor-pointer shadow-sm"
              >
                Browse Eyewear Catalog
              </Link>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-[#E8DEC8] p-3.5 rounded-xl shadow-2xs flex gap-3.5 items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.img || product.images?.[0] || "/images/clean_frame_1.png"}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <h4 className="text-xs font-bold text-[#0A251C] truncate">{product.name}</h4>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                      {product.shape} • {product.gender}
                    </p>
                    <div className="font-bold text-xs text-[#0A251C] font-mono mt-1">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToCartDirect(product);
                      removeFromWishlist(product.id);
                    }}
                    className="p-2 rounded-lg bg-[#0A251C] text-[#C5A059] hover:bg-black transition text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Move to Bag"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px] uppercase font-bold">Add</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 border-t border-[#E8DEC8] bg-[#FAF7F2] shrink-0 text-center">
            <Link
              href="/products"
              onClick={closeWishlist}
              className="text-xs font-bold uppercase tracking-wider text-[#0A251C] hover:text-[#C5A059] transition flex items-center justify-center gap-1.5"
            >
              <span>Continue Browsing Frames</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
};
