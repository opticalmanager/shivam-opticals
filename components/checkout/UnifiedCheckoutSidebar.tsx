"use client";

import React, { useState } from "react";
import { Tag, ShieldCheck, X, Lock, CheckCircle2, Truck, Sparkles, Glasses, Eye } from "lucide-react";
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
  freeShippingThreshold?: number;
}

export const UnifiedCheckoutSidebar: React.FC<UnifiedCheckoutSidebarProps> = ({
  items,
  subtotal,
  shippingFee,
  shippingLabel = "FREE",
  discountAmount,
  totalPayable,
  freeShippingThreshold = 1999,
}) => {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Calculate separate frame and lens sub-amounts for transparent display
  const framesSubtotal = items.reduce(
    (acc, it) => acc + Number(it.product?.price || 0) * (it.quantity || 1),
    0
  );
  const lensesSubtotal = items.reduce(
    (acc, it) => acc + Number(it.lensConfig?.totalLensPrice || 0) * (it.quantity || 1),
    0
  );

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="w-full bg-[#FAF7F2] lg:bg-transparent rounded-2xl p-6 sm:p-7 space-y-6">
      {/* 1. Header with items count */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
        <div className="flex items-center gap-2">
          <Glasses className="w-4 h-4 text-[#C5A059]" />
          <h3 className="font-serif font-bold text-[#0A251C] text-base">
            Order Review
          </h3>
        </div>
        <span className="text-xs font-semibold text-[#716B64]">
          {items.reduce((acc, it) => acc + (it.quantity || 1), 0)} {items.length === 1 ? "Item" : "Items"}
        </span>
      </div>

      {/* 2. Itemized Products List */}
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

          const hasCustomLens = Boolean(item.lensConfig && item.lensConfig.lensPackage);
          const isExpanded = expandedItems[item.id] || false;

          return (
            <div
              key={item.id}
              className="p-3 bg-white rounded-xl border border-[#E8DEC8] shadow-2xs space-y-2.5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Product Thumbnail with Quantity Badge */}
                <div className="relative w-16 h-16 rounded-lg bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={imageSrc}
                    alt={item.product?.name || "Eyewear"}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0A251C] text-[#C5A059] text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {qty}
                  </span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0A251C] leading-snug">
                    {item.product?.name || "Designer Frame"}
                  </h4>
                  <p className="text-[11px] text-[#716B64] mt-0.5">
                    {item.product?.brand || "Shivam Opticals"}
                    {item.selectedColor ? ` • ${item.selectedColor}` : ""}
                  </p>
                  
                  {/* Frame price tag */}
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Frame: {formatCurrency(unitPrice)} {qty > 1 ? `× ${qty}` : ""}
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0 font-bold text-xs sm:text-sm text-[#0A251C] font-mono">
                  {formatCurrency(lineTotal)}
                </div>
              </div>

              {/* Clinical Lens Configuration Preview */}
              {hasCustomLens && (
                <div className="pt-2 border-t border-[#E8DEC8]/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#0A251C] font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="truncate max-w-[190px]">
                        {item.lensConfig?.lensPackage?.name}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[#0A251C]">
                      +{formatCurrency(lensPrice * qty)}
                    </span>
                  </div>

                  {/* Toggle prescription details */}
                  {item.lensConfig?.prescription && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => toggleItemExpand(item.id)}
                        className="text-[10px] text-[#C5A059] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        {isExpanded ? "Hide Rx Details" : "View Rx Details"}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DEC8] text-[10px] font-mono text-[#0A251C] space-y-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-bold text-[#716B64]">OD (Right):</span>{" "}
                              Sph {item.lensConfig.prescription.rightEye?.sph || "0.00"}{" "}
                              Cyl {item.lensConfig.prescription.rightEye?.cyl || "0.00"}{" "}
                              Ax {item.lensConfig.prescription.rightEye?.axis || "0"}
                            </div>
                            <div>
                              <span className="font-bold text-[#716B64]">OS (Left):</span>{" "}
                              Sph {item.lensConfig.prescription.leftEye?.sph || "0.00"}{" "}
                              Cyl {item.lensConfig.prescription.leftEye?.cyl || "0.00"}{" "}
                              Ax {item.lensConfig.prescription.leftEye?.axis || "0"}
                            </div>
                          </div>
                          {item.lensConfig.prescription.pd && (
                            <div className="text-[#716B64]">
                              Pupillary Distance (PD): <span className="text-[#0A251C] font-bold">{item.lensConfig.prescription.pd} mm</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Shiprocket Free Shipping Incentive Bar */}
      <div className="p-3 rounded-xl bg-white border border-[#E8DEC8] text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-[#0A251C]">
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Shiprocket Insured Delivery</span>
          </span>
          <span className={amountNeededForFreeShipping === 0 ? "text-[#16803E] font-bold" : "text-[#716B64]"}>
            {amountNeededForFreeShipping === 0
              ? "FREE DELIVERY UNLOCKED"
              : `Add ${formatCurrency(amountNeededForFreeShipping)} for FREE`}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DEC8]">
          <div
            className="h-full bg-gradient-to-r from-[#C5A059] to-[#0A251C] transition-all duration-300"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* 4. Privilege Voucher Form */}
      <div>
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
              className="px-4 py-2 bg-[#0A251C] hover:bg-[#C5A059] disabled:bg-neutral-200 text-[#C5A059] hover:text-[#0A251C] disabled:text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              {isApplying ? "..." : "Apply"}
            </button>
          </form>
        )}
      </div>

      {/* 5. Itemized Financial Charges Breakdown */}
      <div className="space-y-2.5 pt-3 border-t border-[#E8DEC8] text-xs sm:text-sm">
        <div className="flex justify-between text-[#716B64]">
          <span>Frames Subtotal</span>
          <span className="font-semibold text-[#0A251C] font-mono">{formatCurrency(framesSubtotal)}</span>
        </div>

        {lensesSubtotal > 0 && (
          <div className="flex justify-between text-[#716B64]">
            <span>Optical Lenses Subtotal</span>
            <span className="font-semibold text-[#0A251C] font-mono">{formatCurrency(lensesSubtotal)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between text-[#16803E]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Privilege Voucher Discount</span>
            </span>
            <span className="font-semibold font-mono">- {formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[#716B64]">
          <span>Shiprocket Insured Delivery</span>
          <span className="font-semibold text-[#0A251C] font-mono">
            {shippingFee === 0 ? (
              <span className="text-[#16803E] font-bold uppercase tracking-wider text-[11px]">
                {shippingLabel}
              </span>
            ) : (
              formatCurrency(shippingFee)
            )}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-base font-bold text-[#0A251C] pt-3 border-t border-[#E8DEC8]">
          <div>
            <span>Total Payable</span>
            <span className="block text-[10px] text-[#716B64] font-normal">
              Includes 18% GST (HSN 9003 & 9001)
            </span>
          </div>
          <span className="font-mono text-xl text-[#0A251C]">
            {formatCurrency(totalPayable)}
          </span>
        </div>
      </div>

      {/* 6. Security & Assurance Strip */}
      <div className="pt-2 border-t border-[#E8DEC8]/60 space-y-2 text-[11px] text-[#716B64]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>Shiprocket Insured Transit • Doorstep Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>Razorpay 256-bit SSL Secure Payment Gateway</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>Mayur Vihar Clinical Optical Lab Certified</span>
        </div>
      </div>
    </div>
  );
};
