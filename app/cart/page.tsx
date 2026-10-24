"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Lock,
  ArrowLeft,
  Glasses,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function StandaloneCartPage() {
  const router = useRouter();
  const {
    items,
    cartCount,
    rawSubtotal,
    cleaningKitPrice,
    includeCleaningKit,
    setIncludeCleaningKit,
    discountAmount,
    discountPercentage,
    grandTotal,
    freeDeliveryThreshold,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeItem,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const currentTotal = rawSubtotal + cleaningKitPrice;
  const isDeliveryFree = currentTotal >= freeDeliveryThreshold || currentTotal === 0;
  const deliveryCharge = isDeliveryFree ? 0 : 150;
  const progressPct = Math.min(100, Math.round((currentTotal / freeDeliveryThreshold) * 100));
  const amountLeft = Math.max(0, freeDeliveryThreshold - currentTotal);
  const finalPayable = grandTotal + deliveryCharge;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplying(true);
    setPromoFeedback(null);
    const res = await applyCoupon(promoInput);
    setIsApplying(false);
    if (res.success) {
      setPromoInput("");
    } else {
      setPromoFeedback(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1816] pb-24">
      {/* 1. Header Banner */}
      <section className="bg-[#FAF7F2] border-b border-[#E8DEC8] py-8 px-4 sm:px-6 lg:px-8">
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
            Review your selected frames and lenses before checkout.
          </p>
        </div>
      </section>

      {/* 2. Main Cart Content */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8DEC8] p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-[#0A251C]">
              Your Bag is Currently Empty
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore our handcrafted Italian acetate, titanium frames, and German Zeiss lenses calibrated for zero-distortion optical precision.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 py-3 px-8 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Luxury Eyewear</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Delivery meter alert */}
              <div className="bg-[#FAF3EB] border border-[#E8DEC8] p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#0A251C] uppercase tracking-wide">
                    {isDeliveryFree
                      ? "Complimentary Insured Delivery Active"
                      : `Add ${formatCurrency(amountLeft)} more for Free Express Delivery`}
                  </span>
                  <span className="text-[#C5A059] font-mono">{progressPct}%</span>
                </div>
                <div className="w-full bg-[#E8DEC8] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C5A059] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Items Table Card */}
              <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs divide-y divide-[#E8DEC8]">
                {items.map((it) => {
                  const itemLensPrice = it.lensConfig ? (it.lensConfig.totalLensPrice ?? it.lensConfig.packagePrice ?? 0) : 0;
                  const unitPrice = it.product.price + itemLensPrice;

                  return (
                    <div
                      key={it.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl bg-[#FCFAF7] border border-[#E8DEC8] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.selectedVariant?.image || it.product.img || it.product.images?.[0] || "/images/clean_frame_1.png"}
                            alt={it.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            {it.product.brand}
                          </span>
                          <h3 className="font-sans font-semibold text-sm text-[#0A251C]">
                            <Link href={`/product/${it.product.id}`} className="hover:text-[#C5A059] transition">
                              {it.product.name}
                            </Link>
                          </h3>
                          <p className="text-xs text-stone-500">
                            Colorway: {it.selectedColor || "Standard"}
                          </p>

                          {/* Lens package details */}
                          {it.lensConfig && it.lensConfig.lensType !== "frame-only" ? (
                            <div className="mt-1.5 p-2 rounded-lg bg-[#FAF3EB] border border-[#E8DEC8] text-[11px] space-y-0.5">
                              <span className="font-bold text-[#0A251C] block uppercase text-[10px]">
                                {it.lensConfig.lensPackage?.name || it.lensConfig.packageName || "Prescription Lenses"}
                              </span>
                              {it.lensConfig.prescription && (
                                <span className="text-stone-600 block text-[10px] font-mono">
                                  Rx: OD {it.lensConfig.prescription.rightEye.sph} / OS {it.lensConfig.prescription.leftEye.sph} • PD {it.lensConfig.prescription.pd}mm
                                </span>
                              )}
                              <span className="text-[#C5A059] font-bold block text-[10px]">
                                Lens Package: +{formatCurrency(itemLensPrice)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-stone-400 font-semibold uppercase mt-1">
                              Frame Only (Demo Lenses)
                            </p>
                          )}

                          <p className="font-mono font-bold text-sm text-[#0A251C] mt-1.5">
                            {formatCurrency(unitPrice * it.quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="flex items-center border border-[#E8DEC8] rounded-xl bg-white overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, -1)}
                            className="p-2 hover:bg-[#FAF3EB] transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5 text-stone-700" />
                          </button>
                          <span className="px-3.5 font-mono font-bold text-xs bg-[#FCFAF7]">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, 1)}
                            className="p-2 hover:bg-[#FAF3EB] transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-stone-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cleaning Kit Addon */}
              <div className="bg-white rounded-2xl border border-[#E8DEC8] p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0A251C] uppercase block">
                    Anti-Fog Optical Cleaning Kit (+₹100)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    60ml medical-grade lens cleaner and premium microfiber cloth designed for coated lenses.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeCleaningKit}
                  onChange={(e) => setIncludeCleaningKit(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E8DEC8] text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Summary Card */}
            <div className="lg:col-span-4 space-y-4 sticky top-24">
              <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-base text-[#0A251C] border-b border-[#E8DEC8] pb-3">
                  Order Summary ({cartCount} {cartCount === 1 ? "Item" : "Items"})
                </h3>

                {/* Subtotals */}
                <div className="space-y-2 text-xs text-stone-600 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-[#0A251C]">{formatCurrency(rawSubtotal)}</span>
                  </div>

                  {includeCleaningKit && (
                    <div className="flex justify-between">
                      <span>Anti-Fog Cleaning Kit</span>
                      <span className="font-mono font-bold text-[#0A251C]">{formatCurrency(cleaningKitPrice)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount ({discountPercentage}%)</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="font-mono font-bold text-[#0A251C]">
                      {isDeliveryFree ? "FREE" : formatCurrency(deliveryCharge)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E8DEC8] flex justify-between text-sm font-bold text-[#0A251C]">
                    <span>Total</span>
                    <span className="font-mono text-base text-[#0A251C]">
                      {formatCurrency(finalPayable)}
                    </span>
                  </div>
                </div>

                {/* Coupon Box */}
                <div className="pt-2 border-t border-[#E8DEC8] space-y-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code &quot;{appliedCoupon}&quot; Active</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-stone-500 hover:text-rose-600 underline font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Coupon code (e.g. FLAT12)"
                          className="flex-1 uppercase px-3 py-2 bg-[#FCFAF7] border border-[#E8DEC8] text-xs rounded-xl focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="submit"
                          disabled={isApplying}
                          className="px-4 py-2 bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase rounded-xl hover:bg-black transition cursor-pointer disabled:opacity-50"
                        >
                          {isApplying ? "Validating..." : "Apply"}
                        </button>
                      </div>
                      {promoFeedback && (
                        <p className="text-[11px] text-amber-700 mt-1">{promoFeedback}</p>
                      )}
                    </form>
                  )}
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="w-full py-4 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Trust Badges */}
                <div className="pt-2 border-t border-[#E8DEC8] grid grid-cols-2 gap-2 text-[10px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>1-Year Warranty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Free Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
