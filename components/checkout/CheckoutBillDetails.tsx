"use client";

import React, { useState } from "react";
import { Tag, ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckoutBillDetailsProps {
  subtotal: number;
  discount: number;
  shippingFee?: number;
  totalPayable: number;
  ctaText?: string;
  onCtaClick?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  showCtaButton?: boolean;
}

export const CheckoutBillDetails: React.FC<CheckoutBillDetailsProps> = ({
  subtotal,
  discount,
  shippingFee = 0,
  totalPayable,
  ctaText,
  onCtaClick,
  isSubmitting = false,
  disabled = false,
  showCtaButton = true,
}) => {
  const [isPriceExpanded, setIsPriceExpanded] = useState(false);
  const [isDiscountExpanded, setIsDiscountExpanded] = useState(false);

  const savingsAmount = discount > 0 ? discount : Math.round(subtotal * 0.12);

  return (
    <div className="w-full space-y-4">
      {/* Bill Card Container */}
      <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 shadow-2xs">
        {/* Savings Pill Banner */}
        {savingsAmount > 0 && (
          <div className="bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl p-3 sm:p-3.5 flex items-center gap-2 mb-5">
            <Tag className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold text-[#0A251C]">
              You are saving {formatCurrency(savingsAmount)} on this order
            </span>
          </div>
        )}

        {/* Bill Heading */}
        <h3 className="font-serif font-bold text-[#0A251C] text-base sm:text-lg tracking-tight mb-4">
          Order Summary
        </h3>

        {/* Breakdown Items */}
        <div className="space-y-3 text-xs sm:text-sm">
          {/* Total item price */}
          <div>
            <div
              onClick={() => setIsPriceExpanded(!isPriceExpanded)}
              className="flex items-center justify-between text-[#716B64] cursor-pointer hover:text-[#0A251C] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Total item price</span>
                {isPriceExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>
              <span className="font-semibold text-[#1A1816]">{formatCurrency(subtotal)}</span>
            </div>
            {isPriceExpanded && (
              <div className="pl-3 pr-1 py-1 text-[11px] text-[#716B64] flex justify-between">
                <span>Includes Frames &amp; Lenses</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}
          </div>

          {/* Total discount */}
          <div>
            <div
              onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
              className="flex items-center justify-between text-[#716B64] cursor-pointer hover:text-[#0A251C] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Total discount</span>
                {isDiscountExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>
              <span className="font-semibold text-[#16803E]">
                {discount > 0 ? `- ${formatCurrency(discount)}` : "None"}
              </span>
            </div>
            {isDiscountExpanded && (
              <div className="pl-3 pr-1 py-1 text-[11px] text-[#16803E] flex justify-between">
                <span>Coupon Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
          </div>

          {/* Shipping fee */}
          <div className="flex items-center justify-between text-[#716B64]">
            <span>Delivery Charges</span>
            <span className="font-semibold text-[#1A1816]">
              {shippingFee === 0 ? (
                <span className="text-[#16803E] uppercase font-bold tracking-wider text-[11px]">
                  FREE
                </span>
              ) : (
                formatCurrency(shippingFee)
              )}
            </span>
          </div>

          {/* GST */}
          <div className="flex items-center justify-between text-[11px] text-[#716B64]">
            <span>Taxes (GST)</span>
            <span>Included in Price</span>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E8DEC8] pt-3 flex items-center justify-between text-sm sm:text-base font-bold text-[#0A251C]">
            <span>Total Amount</span>
            <span className="text-lg font-mono font-bold text-[#0A251C]">
              {formatCurrency(totalPayable)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {showCtaButton && onCtaClick && (
          <div className="mt-6 pt-2">
            <button
              type="button"
              disabled={disabled || isSubmitting}
              onClick={onCtaClick}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                disabled || isSubmitting
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-[#0A251C] hover:bg-[#C5A059] text-white hover:text-[#0A251C]"
              }`}
            >
              <span>{isSubmitting ? "Processing Payment..." : ctaText || "Pay Now"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-4 pt-4 border-t border-[#E8DEC8]/60 flex items-center justify-center gap-2 text-[11px] text-[#716B64]">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>100% Safe &amp; Secure Payment</span>
        </div>
      </div>
    </div>
  );
};
