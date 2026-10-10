"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  Check,
  ChevronRight,
  Glasses,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function StandaloneCartPage() {
  const {
    items,
    subtotal,
    discountAmount,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeItem,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const deliveryFee = subtotal >= 1999 || subtotal === 0 ? 0 : 150;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyCoupon(couponInput)) {
      toast.success("Promo code applied successfully!");
      setCouponInput("");
    } else {
      toast.error("Invalid coupon code. Try 'FLAT12'.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Header Banner */}
      <section className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold">
            <Link href="/" className="hover:text-[#0A251C] transition">Home</Link>
            <span>/</span>
            <span className="text-[#C5A059] font-bold">Shopping Bag</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
            Your Eyewear Atelier Bag
          </h1>
          <p className="text-xs text-stone-500">
            Review your selected frames and customized lens packages prior to laboratory assembly
          </p>
        </div>
      </section>

      {/* 2. Main Cart Content */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8DEC8] p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-[#0A251C]">
              Your Bag is Currently Empty
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore our handcrafted Italian acetate and Danish titanium frames with complimentary zero-power blue-light or computerized vision lenses.
            </p>
            <Link
              href="/products"
              className="inline-flex py-3 px-8 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition"
            >
              Browse Luxury Frames
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs divide-y divide-[#E8DEC8]">
                {items.map((it) => (
                  <div key={it.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] p-1 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.product.img || "/images/clean_frame_1.png"}
                          alt={it.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                          {it.product.brand}
                        </span>
                        <h3 className="font-serif font-bold text-sm text-[#0A251C]">
                          <Link href={`/product/${it.product.id}`} className="hover:text-[#C5A059] transition">
                            {it.product.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-stone-500">
                          Colorway: {it.selectedColor}
                        </p>
                        {it.lensConfig?.packageName && (
                          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                            Lens Tier: {it.lensConfig.packageName}
                          </p>
                        )}
                        <p className="font-mono font-bold text-sm text-[#0A251C] mt-1">
                          {formatCurrency(it.product.price + (it.lensConfig?.packagePrice || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(it.id, -1)}
                          className="p-2 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 font-mono font-bold">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(it.id, 1)}
                          className="p-2 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="p-2 text-stone-400 hover:text-red-600 transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary Card */}
            <div className="lg:col-span-4 space-y-4 sticky top-24">
              <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-base text-[#0A251C] border-b border-[#E8DEC8] pb-3">
                  Order Summary
                </h3>

                {/* Subtotals */}
                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Catalog Subtotal</span>
                    <span className="font-mono font-bold text-[#0A251C]">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount ({appliedCoupon})</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Insured Shipping</span>
                    <span className="font-mono font-bold text-[#0A251C]">
                      {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E8DEC8] flex justify-between text-sm font-bold text-[#0A251C]">
                    <span>Grand Total</span>
                    <span className="font-mono text-base text-[#0A251C]">
                      {formatCurrency(grandTotal + deliveryFee)}
                    </span>
                  </div>
                </div>

                {/* Coupon Box */}
                <div className="pt-2 border-t border-[#E8DEC8]">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code {appliedCoupon} Active</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-stone-400 hover:text-red-600 transition text-[11px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Promo Code (e.g. FLAT12)"
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase rounded-xl transition"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="pt-2 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Insured shipping with BlueDart Express & GST Tax Invoice</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
