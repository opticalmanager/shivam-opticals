"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  X,
  Trash2,
  Lock,
  ArrowRight,
  Tag,
  Sparkles,
  Plus,
  Minus,
  Check,
} from "lucide-react";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
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
    isCartOpen,
    closeCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const currentTotal = rawSubtotal + cleaningKitPrice;
  const progressPct = Math.min(100, Math.round((currentTotal / freeDeliveryThreshold) * 100));
  const amountLeft = Math.max(0, freeDeliveryThreshold - currentTotal);
  const isDeliveryFree = amountLeft === 0 || currentTotal === 0;
  const deliveryCharge = isDeliveryFree ? 0 : 150;
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg bg-[#FCFAF7] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-[#E8DEC8]">
        {/* Cart Header */}
        <div className="p-5 border-b border-[#E8DEC8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-[#0A251C] font-serif">
              Shopping Bag
            </h3>
            <span className="bg-[#0A251C] text-[#C5A059] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-sans">
              {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 hover:text-[#C5A059] text-[#1A1816] rounded-full hover:bg-[#FAF3EB] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complimentary Shipping Progress */}
        <div className="bg-[#FAF3EB] px-5 py-3 border-b border-[#E8DEC8]">
          <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            <span className="text-[#0A251C]">
              {isDeliveryFree
                ? "Complimentary Insured Delivery Unlocked"
                : `Add ${formatCurrency(amountLeft)} for Free Delivery`}
            </span>
            <span className="text-[#C5A059] font-bold">Pan-India Express</span>
          </div>
          <div className="w-full bg-[#E8DEC8] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C5A059] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-600">
              <div className="w-16 h-16 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-serif font-bold text-[#0A251C]">Your Bag is Currently Empty</p>
              <p className="text-xs max-w-xs text-stone-500 leading-relaxed">
                Explore our handcrafted optical catalog to select designer frames and precision laboratory lenses.
              </p>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black transition cursor-pointer shadow-sm"
              >
                Explore Eyewear Catalog
              </button>
            </div>
          ) : (
            <>
              {/* Atelier Assurance Note */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E8DEC8] shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059] uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Clinical Optical Assembly</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Every customized frame undergoes robotic laser lens calibration, ultrasonic sanitization, and 1-year atelier warranty.
                </p>
              </div>

              {/* Items Card List */}
              <div className="space-y-3.5">
                {items.map((item) => {
                  const itemLensPrice = item.lensConfig ? (item.lensConfig.totalLensPrice ?? item.lensConfig.packagePrice ?? 0) : 0;
                  const unitPrice = item.product.price + itemLensPrice;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E8DEC8] p-4 rounded-xl shadow-2xs space-y-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-20 h-20 rounded-lg bg-[#FCFAF7] border border-[#E8DEC8] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.selectedVariant?.image || item.product.img || item.product.images[0] || "/images/clean_frame_1.png"}
                            alt={item.product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <div>
                              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block">
                                {item.product.brand}
                              </span>
                              <h4 className="font-sans text-xs sm:text-[13px] font-semibold text-[#0A251C] truncate leading-snug">
                                {item.product.name}
                              </h4>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-stone-400 hover:text-rose-600 transition p-1 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {item.selectedColor && (
                            <span className="text-[11px] text-stone-500 block mt-0.5">
                              Colorway: {item.selectedColor}
                            </span>
                          )}

                          {/* Lens Breakdown Badge */}
                          {item.lensConfig && item.lensConfig.lensType !== "frame-only" ? (
                            <div className="bg-[#FAF3EB] border border-[#E8DEC8] p-2 rounded-lg text-[11px] mt-2 space-y-0.5">
                              <span className="font-bold text-[#0A251C] block uppercase text-[10px]">
                                {item.lensConfig.lensPackage?.name || item.lensConfig.packageName || "Custom Prescription Lenses"}
                              </span>
                              {item.lensConfig.prescription && (
                                <span className="text-stone-600 block text-[10px] font-mono">
                                  Rx: OD {item.lensConfig.prescription.rightEye.sph} / OS {item.lensConfig.prescription.leftEye.sph} • PD {item.lensConfig.prescription.pd}mm
                                </span>
                              )}
                              <span className="text-[#C5A059] font-bold block text-[10px]">
                                Lens Surcharge: +{formatCurrency(itemLensPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 block mt-1 uppercase font-semibold">
                              Frame Only (Demo Lenses)
                            </span>
                          )}

                          {/* Price & Quantity Controls */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                            <span className="font-mono font-bold text-xs sm:text-sm text-[#0A251C]">
                              {formatCurrency(unitPrice * item.quantity)}
                            </span>

                            <div className="flex items-center border border-[#E8DEC8] rounded-lg overflow-hidden bg-white text-xs">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="px-2.5 py-1 text-stone-700 hover:bg-[#FAF3EB] cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-3 py-1 font-bold font-mono text-[11px] bg-[#FCFAF7]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="px-2.5 py-1 text-stone-700 hover:bg-[#FAF3EB] cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-Fog Lens Cleaning Kit Add-on */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E8DEC8] flex items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[#0A251C] block uppercase">
                    Anti-Fog Optical Cleaning Kit (+₹100)
                  </span>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    Includes 60ml antimicrobial spray and lint-free microfiber atelier cloth.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeCleaningKit}
                  onChange={(e) => setIncludeCleaningKit(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E8DEC8] text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                />
              </div>

              {/* Voucher Code Form */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E8DEC8] space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#0A251C]">
                  <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Privilege & Promo Code</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs">
                    <span className="font-bold text-emerald-800">
                      Code &quot;{appliedCoupon}&quot; active ({discountPercentage}% Off)
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-stone-500 hover:text-rose-600 underline font-semibold cursor-pointer"
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
                        placeholder="Try 'FLAT12' or 'SHIVAM10'..."
                        className="flex-1 bg-[#FCFAF7] border border-[#E8DEC8] px-3 py-1.5 text-xs rounded-lg uppercase focus:outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="submit"
                        disabled={isApplying}
                        className="bg-[#0A251C] text-[#C5A059] px-4 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
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
            </>
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E8DEC8] bg-[#FAF7F2] space-y-3.5 shrink-0 shadow-lg">
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-stone-600">
                <span>Catalog Subtotal</span>
                <span className="font-mono font-bold text-[#0A251C]">{formatCurrency(rawSubtotal)}</span>
              </div>

              {includeCleaningKit && (
                <div className="flex justify-between text-stone-600">
                  <span>Anti-Fog Lens Cleaning Kit</span>
                  <span className="font-mono font-bold text-[#0A251C]">{formatCurrency(cleaningKitPrice)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Voucher Discount ({discountPercentage}%)</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Insured Courier Shipping</span>
                <span className="font-mono font-bold text-[#0A251C]">
                  {isDeliveryFree ? "FREE" : formatCurrency(deliveryCharge)}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold text-[#0A251C] pt-2 border-t border-[#E8DEC8]">
                <span>Grand Total</span>
                <span className="font-mono text-base sm:text-lg text-[#0A251C] font-bold">
                  {formatCurrency(finalPayable)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>PROCEED TO SECURE CHECKOUT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <Link
                href="/cart"
                onClick={closeCart}
                className="text-stone-600 hover:text-[#C5A059] font-medium transition"
              >
                View Full Bag Page →
              </Link>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                1-Year Precision Warranty
              </span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
