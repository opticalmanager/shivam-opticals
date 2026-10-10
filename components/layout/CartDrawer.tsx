"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, X, Trash2, Lock, ArrowRight, Tag } from "lucide-react";

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
    discountAmount,
    grandTotal,
    freeDeliveryThreshold,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isCartOpen,
    closeCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");

  if (!isCartOpen) return null;

  const progressPct = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const amountLeft = Math.max(0, freeDeliveryThreshold - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyCoupon(promoInput)) {
      setPromoInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-xs"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Cart Header */}
        <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-[#1A1816]">
              Your Shopping Cart
            </h3>
            <span className="text-xs text-[#716B64] font-normal">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1 hover:text-[#C5A059] text-[#1A1816] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping meter */}
        <div className="bg-[#F4EFEA]/60 px-5 py-3 border-b border-[#E8E2D9]/60">
          <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            <span className="text-[#1A1816]">
              {amountLeft === 0
                ? "Free Express Delivery Unlocked!"
                : `Add ${formatCurrency(amountLeft)} for Free Delivery`}
            </span>
            <span className="text-[#C5A059]">100% Insured</span>
          </div>
          <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C5A059] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#716B64]">
              <div className="w-14 h-14 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-serif font-bold text-[#1A1816]">Your cart is currently empty</p>
              <p className="text-xs max-w-xs">Explore our handcrafted optical catalog to add luxury frames and lenses.</p>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-[#0A251C] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition cursor-pointer"
              >
                Explore Frames
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 pb-4 border-b border-[#E8E2D9]/70 last:border-b-0 items-start"
              >
                <div className="w-20 h-20 rounded-lg bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img
                    src={item.product.img}
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1816] truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-[#716B64] uppercase tracking-wider">
                        {item.product.brand} • {item.product.shape}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: item.selectedColor }}
                    />
                    <span className="text-[10px] text-[#716B64]">Selected Color</span>
                  </div>

                  {item.lensConfig?.packageName && (
                    <div className="mt-1 px-2 py-0.5 rounded bg-[#FAF3EB] text-[#8C6239] text-[10px] font-medium border border-[#E8DEC8] truncate">
                      {item.lensConfig.packageName}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center border border-[#E8E2D9] rounded bg-white text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-[11px]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-bold text-xs text-[#1A1816] font-mono">
                      {formatCurrency(
                        (item.product.price + (item.lensConfig?.packagePrice || 0)) * item.quantity
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E8E2D9] bg-[#FBF9F5] space-y-3">
            {/* Promo Code Form */}
            {appliedCoupon ? (
              <div className="p-2.5 bg-white border border-[#C5A059]/40 rounded flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{appliedCoupon} (12% OFF)</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-400 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (e.g. FLAT12)"
                  className="flex-1 uppercase px-3 py-1.5 bg-white border border-[#E8E2D9] text-xs rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1A1816] text-white hover:bg-[#C5A059] text-xs font-semibold uppercase tracking-wider rounded-xs transition cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#716B64]">
                <span>Subtotal</span>
                <span className="font-medium text-[#1A1816] font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#716B64]">
                <span>Anti-Reflective Coating & Fitting</span>
                <span className="text-[#C5A059] font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-[#716B64]">
                <span>Insured Courier Shipping</span>
                <span className="text-[#C5A059] font-bold">
                  {amountLeft === 0 ? "FREE" : "₹150"}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E8E2D9] flex justify-between text-sm font-bold text-[#1A1816]">
                <span>Estimated Total</span>
                <span className="font-mono text-base">
                  {formatCurrency(grandTotal + (amountLeft === 0 ? 0 : 150))}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-3.5 bg-[#1A1816] hover:bg-[#0A251C] text-white text-xs font-bold tracking-[0.2em] uppercase rounded-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>PROCEED TO SECURE CHECKOUT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <p className="text-[10px] text-center text-[#716B64] tracking-wider uppercase">
              14-Day Doorstep Returns • 1 Year Precision Warranty
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
