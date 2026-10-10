"use client";

import React from "react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Heart, X, Trash2, ShoppingBag } from "lucide-react";

export const WishlistDrawer: React.FC = () => {
  const { wishlistProducts, toggleWishlist, isWishlistOpen, closeWishlist, totalWishlist } = useWishlist();
  const { addItem } = useCart();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeWishlist}
        className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-xs"
      />

      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-[#1A1816]">
              Saved Favorites
            </h3>
            <span className="text-xs text-[#716B64] font-normal">
              ({totalWishlist} {totalWishlist === 1 ? "item" : "items"})
            </span>
          </div>
          <button
            onClick={closeWishlist}
            className="p-1 hover:text-[#C5A059] text-[#1A1816] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#716B64]">
              <div className="w-14 h-14 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#BB4D00]">
                <Heart className="w-7 h-7" />
              </div>
              <p className="text-sm font-serif font-bold text-[#1A1816]">Your Wishlist is Empty</p>
              <p className="text-xs max-w-xs">Tap the heart icon on any optical frame to bookmark your favorite designer styles.</p>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-3.5 pb-4 border-b border-[#E8E2D9]/70 last:border-b-0 items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center p-1 shrink-0">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1A1816] truncate">{product.name}</h4>
                    <p className="text-[10px] text-[#716B64] uppercase tracking-wider">
                      {product.brand} • {product.shape}
                    </p>
                    <div className="font-bold text-xs text-[#1A1816] font-mono mt-1">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addItem(product, product.colors[0] || "#1A1816");
                      toggleWishlist(product.id);
                    }}
                    className="p-2 rounded bg-[#0A251C] text-white hover:bg-black transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Move to Cart"
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
      </aside>
    </div>
  );
};
