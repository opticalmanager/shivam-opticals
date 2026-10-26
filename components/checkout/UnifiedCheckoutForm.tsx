"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ShieldCheck,
  Check,
  User,
  LogOut,
  MapPin,
  Plus,
  Loader2,
  Clock,
  Lock,
  CheckCircle2,
  CreditCard,
  Truck,
} from "lucide-react";
import { ShippingAddress, PaymentMethod } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getEstimatedDeliveryDate, formatCurrency } from "@/lib/utils";

interface UnifiedCheckoutFormProps {
  shippingAddress: ShippingAddress;
  onAddressChange: (address: ShippingAddress) => void;
  shippingMethod: "standard" | "express";
  onShippingMethodChange: (method: "standard" | "express") => void;
  shippingRates: {
    standard: number;
    express: number;
  };
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSubmitPay: () => void;
  isSubmitting: boolean;
  totalPayable: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Jammu & Kashmir",
  "Ladakh",
];

export const UnifiedCheckoutForm: React.FC<UnifiedCheckoutFormProps> = ({
  shippingAddress,
  onAddressChange,
  shippingMethod,
  onShippingMethodChange,
  shippingRates,
  paymentMethod,
  onPaymentMethodChange,
  onSubmitPay,
  isSubmitting,
  totalPayable,
}) => {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();

  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [activeAddressIdx, setActiveAddressIdx] = useState<number>(0);

  const savedAddresses = user.savedAddresses || [];

  // If user has saved addresses and not manually entering custom, keep synced
  useEffect(() => {
    if (isLoggedIn && savedAddresses.length > 0 && !useCustomAddress) {
      const selected = savedAddresses[activeAddressIdx] || savedAddresses[0];
      const names = (selected.fullName || user.name || "").split(" ");
      onAddressChange({
        ...selected,
        firstName: selected.firstName || names[0] || "",
        lastName: selected.lastName || names.slice(1).join(" ") || "",
        email: selected.email || user.email || shippingAddress.email || "",
        phone: selected.phone || user.phone || shippingAddress.phone || "",
      });
    }
  }, [isLoggedIn, savedAddresses.length, activeAddressIdx, useCustomAddress]);

  const handleFieldChange = (field: keyof ShippingAddress, val: string) => {
    onAddressChange({
      ...shippingAddress,
      [field]: val,
      fullName:
        field === "firstName"
          ? `${val} ${shippingAddress.lastName || ""}`.trim()
          : field === "lastName"
          ? `${shippingAddress.firstName || ""} ${val}`.trim()
          : shippingAddress.fullName,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Identification / Account Header */}
      <div className="bg-white border border-[#E8DEC8] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#C5A059]/40 flex items-center justify-center text-[#0A251C]">
              <User className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#716B64]">
                Account Details
              </span>
              <h3 className="text-sm font-bold text-[#0A251C]">
                {isLoggedIn ? user.name || user.phone : "Guest Checkout"}
              </h3>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="text-xs text-[#716B64] hover:text-red-600 flex items-center gap-1 cursor-pointer transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("/checkout")}
              className="px-4 py-2 rounded-xl bg-[#0A251C] hover:bg-[#C5A059] text-white hover:text-[#0A251C] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* 2. Delivery Address */}
      <div className="bg-white border border-[#E8DEC8] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-[#0A251C] text-base">
              Delivery Address
            </h3>
          </div>
        </div>

        {/* Saved Addresses Selector (if patron has saved addresses) */}
        {isLoggedIn && savedAddresses.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#716B64]">
              Saved Addresses
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedAddresses.map((addr, idx) => {
                const isSelected = !useCustomAddress && activeAddressIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setUseCustomAddress(false);
                      setActiveAddressIdx(idx);
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition relative ${
                      isSelected
                        ? "border-[#0A251C] bg-[#FAF7F2] ring-1 ring-[#0A251C]"
                        : "border-[#E8DEC8] hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#0A251C]">{addr.fullName || "Address"}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#16803E]" />
                      )}
                    </div>
                    <p className="text-[#716B64] line-clamp-2">{addr.streetAddress}</p>
                    <p className="text-[#716B64] mt-1 font-mono text-[11px]">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>
                );
              })}

              <div
                onClick={() => setUseCustomAddress(true)}
                className={`p-3.5 rounded-xl border border-dashed text-xs cursor-pointer transition flex items-center justify-center gap-2 ${
                  useCustomAddress
                    ? "border-[#0A251C] bg-[#FAF7F2] text-[#0A251C] font-bold"
                    : "border-neutral-300 text-[#716B64] hover:text-[#0A251C]"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Deliver to a New Address</span>
              </div>
            </div>
          </div>
        )}

        {/* Address Input Form (shown if guest or custom address selected or no saved addresses) */}
        {(!isLoggedIn || savedAddresses.length === 0 || useCustomAddress) && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.firstName || ""}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={shippingAddress.lastName || ""}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={shippingAddress.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="e.g. 9810012345"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={shippingAddress.email || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="e.g. patron@gmail.com"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                Street Address / House / Flat *
              </label>
              <input
                type="text"
                required
                value={shippingAddress.streetAddress || ""}
                onChange={(e) => handleFieldChange("streetAddress", e.target.value)}
                placeholder="House / Flat Number, Street Name, Landmark"
                className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  State *
                </label>
                <select
                  value={shippingAddress.state || "Delhi"}
                  onChange={(e) => handleFieldChange("state", e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-1">
                  Postal PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shippingAddress.pincode || ""}
                  onChange={(e) => handleFieldChange("pincode", e.target.value)}
                  placeholder="e.g. 110091"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Shipping Method */}
      <div className="bg-white border border-[#E8DEC8] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-[#0A251C] text-base">
              Delivery Method
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[10px] font-bold uppercase tracking-wider text-[#0A251C]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Tracked Delivery</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => onShippingMethodChange("standard")}
            className={`p-4 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between ${
              shippingMethod === "standard"
                ? "border-[#0A251C] bg-[#FAF7F2] ring-1 ring-[#0A251C]"
                : "border-[#E8DEC8] hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-[#0A251C]">Standard Delivery</span>
              </div>
              <p className="text-[#716B64]">3–5 Business Days • Doorstep Delivery</p>
              <p className="text-[11px] text-[#C5A059] font-medium mt-1">
                Estimated Delivery: {getEstimatedDeliveryDate(4)}
              </p>
            </div>
            <div className="font-mono font-bold text-xs text-[#0A251C]">
              {shippingRates.standard === 0 ? "FREE" : formatCurrency(shippingRates.standard)}
            </div>
          </div>

          <div
            onClick={() => onShippingMethodChange("express")}
            className={`p-4 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between ${
              shippingMethod === "express"
                ? "border-[#0A251C] bg-[#FAF7F2] ring-1 ring-[#0A251C]"
                : "border-[#E8DEC8] hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-[#0A251C]">Express Delivery</span>
              </div>
              <p className="text-[#716B64]">1–2 Business Days • Priority Dispatch</p>
              <p className="text-[11px] text-[#C5A059] font-medium mt-1">
                Estimated Delivery: {getEstimatedDeliveryDate(2)}
              </p>
            </div>
            <div className="font-mono font-bold text-xs text-[#0A251C]">
              {formatCurrency(shippingRates.express)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Payment Method */}
      <div className="bg-white border border-[#E8DEC8] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-[#0A251C] text-base">
              Payment Method
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16803E]/10 border border-[#16803E]/20 text-[10px] font-bold uppercase tracking-wider text-[#16803E]">
            <Lock className="w-3 h-3" />
            <span>100% Secure Checkout</span>
          </div>
        </div>

        {/* Razorpay Gateway Card */}
        <div
          onClick={() => onPaymentMethodChange("razorpay")}
          className="p-5 rounded-2xl border border-[#0A251C] bg-[#FAF7F2] ring-1 ring-[#0A251C] cursor-pointer transition shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-[#0A251C] bg-[#0A251C] flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-[#C5A059] rounded-full" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#0A251C] block">
                  Online Payment (UPI, Cards, NetBanking)
                </span>
                <span className="text-[11px] text-[#716B64]">
                  Instant UPI (Google Pay, PhonePe, Paytm), Credit &amp; Debit Cards, NetBanking
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16803E] bg-[#16803E]/10 border border-[#16803E]/30 px-2.5 py-0.5 rounded-full shrink-0">
              RECOMMENDED
            </span>
          </div>

          {/* Supported Methods Badges */}
          <div className="pt-2 border-t border-[#E8DEC8]/60 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#716B64]">
            <span className="px-2 py-1 rounded-md bg-white border border-[#E8DEC8]">UPI (Google Pay, PhonePe, Paytm)</span>
            <span className="px-2 py-1 rounded-md bg-white border border-[#E8DEC8]">Credit &amp; Debit Cards</span>
            <span className="px-2 py-1 rounded-md bg-white border border-[#E8DEC8]">NetBanking (50+ Banks)</span>
            <span className="px-2 py-1 rounded-md bg-white border border-[#E8DEC8]">Zero Extra Charges</span>
          </div>
        </div>

        {/* Submit Pay Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmitPay}
            className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              isSubmitting
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                : "bg-[#0A251C] hover:bg-black text-[#C5A059] hover:scale-[1.005]"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Opening Payment Window...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <span>Complete Payment ({formatCurrency(totalPayable)})</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-[#716B64] mt-2">
            Your payment information is encrypted and securely processed with full fraud protection.
          </p>
        </div>
      </div>
    </div>
  );
};
