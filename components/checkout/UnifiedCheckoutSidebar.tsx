"use client";

import React, { useState } from "react";
import { Tag, ShieldCheck, X, Lock } from "lucide-react";
import { CartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface UnifiedCheckoutSidebarProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  shippingLabel?: string;
  discountAmount: number;
  totalPayable: number;
}

export const UnifiedCheckoutSidebar: React.FC<UnifiedCheckoutSidebarProps> = ({
  items,
  subtotal,
  shippingFee,
  shippingLabel = "FREE",
  discountAmount,
  totalPayable,
}) => {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    try {
      const res = await applyCoupon(couponInput.trim().toUpperCase());
      if (res.success) {
        setCouponInput("");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] lg:bg-transparent rounded-2xl p-6 sm:p-7 space-y-6">
      {/* 1. Itemized Products List */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => {
          const qty = item.quantity || 1;
          const unitPrice = Number(item.product?.price || 0);
          const lensPrice = Number(item.lensConfig?.totalLensPrice || 0);
          const lineTotal = (unitPrice + lensPrice) * qty;

          const imageSrc =
            item.product?.images?.[0] ||
            item.product?.img ||
            "https://pub-4770ee76ded14c04b1a8924c300214b5.r2.dev/placeholder-frame.webp";

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3.5 pb-3 border-b border-[#E8DEC8] last:border-b-0"
            >
              {/* Product Thumbnail with Quantity Badge */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-16 h-16 rounded-xl bg-white border border-[#E8DEC8] flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                  <img
                    src={imageSrc}
                    alt={item.product?.name || "Eyewear"}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0A251C] text-[#C5A059] text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {qty}
                  </span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0A251C] truncate">
                    {item.product?.name || "Designer Frame"}
                  </h4>
                  <p className="text-[11px] text-[#716B64] truncate">
                    {item.product?.brand || "Shivam Optics"} • {item.selectedColor || "Standard"}
                  </p>
                  {item.lensConfig?.lensPackage && (
                    <span className="inline-block text-[10px] text-[#C5A059] font-medium truncate max-w-[200px]">
                      {item.lensConfig.lensPackage.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Line Price */}
              <div className="text-right shrink-0 font-bold text-xs sm:text-sm text-[#0A251C] font-mono">
                {formatCurrency(lineTotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Promo / Privilege Voucher Form */}
      <div className="pt-2">
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#16803E]/30 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#16803E]" />
              <div>
                <span className="font-bold text-[#16803E] uppercase tracking-wider">
                  {appliedCoupon}
                </span>
                <span className="text-[#716B64] ml-2 text-[11px]">Privilege Applied</span>
              </div>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-[#716B64] hover:text-red-600 transition p-1 cursor-pointer"
              title="Remove privilege voucher"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Privilege Voucher (e.g. FLAT12)"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1 bg-white border border-[#E8DEC8] rounded-xl px-3.5 py-2 text-xs text-[#0A251C] uppercase placeholder:normal-case placeholder:text-neutral-400 focus:outline-none focus:border-[#C5A059] transition"
            />
            <button
              type="submit"
              disabled={isApplying || !couponInput.trim()}
              className="px-4 py-2 bg-[#0A251C] hover:bg-[#C5A059] disabled:bg-neutral-200 text-white hover:text-[#0A251C] disabled:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              {isApplying ? "..." : "Apply"}
            </button>
          </form>
        )}
      </div>

      {/* 3. Financial Totals */}
      <div className="space-y-3 pt-3 border-t border-[#E8DEC8] text-xs sm:text-sm">
        <div className="flex justify-between text-[#716B64]">
          <span>Subtotal</span>
          <span className="font-semibold text-[#0A251C]">{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-[#16803E]">
            <span>Privilege Discount</span>
            <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[#716B64]">
          <span>Shipping & White-Glove Delivery</span>
          <span className="font-semibold text-[#0A251C]">
            {shippingFee === 0 ? (
              <span className="text-[#16803E] font-bold uppercase tracking-wider text-[11px]">
                {shippingLabel}
              </span>
            ) : (
              formatCurrency(shippingFee)
            )}
          </span>
        </div>

        <div className="flex justify-between text-base font-bold text-[#0A251C] pt-2 border-t border-[#E8DEC8]">
          <span>Total Payable</span>
          <span className="font-mono text-lg text-[#0A251C]">
            {formatCurrency(totalPayable)}
          </span>
        </div>
      </div>

      {/* 4. Atelier Guarantee Footnote */}
      <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#716B64]">
        <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
        <span>Mayur Vihar Optical Lab Certified • 100% Authentic</span>
      </div>
    </div>
  );
};
