"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Printer,
  Package,
  Truck,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface StepOrderSummaryProps {
  order: Order;
  onContinueShopping: () => void;
}

export const StepOrderSummary: React.FC<StepOrderSummaryProps> = ({
  order,
  onContinueShopping,
}) => {
  const handlePrintInvoice = () => {
    window.print();
  };

  const steps = [
    { label: "Confirmed", status: "completed", desc: "Payment received & verified" },
    { label: "Lab Assembly", status: "current", desc: "Mayur Vihar optical lens grinding" },
    { label: "Quality Check", status: "upcoming", desc: "Laser alignment & PD verification" },
    { label: "Dispatched", status: "upcoming", desc: "Express courier with live tracking" },
    { label: "Delivered", status: "upcoming", desc: "Doorstep handoff with microfiber kit" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Confirmation Card */}
      <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xs text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF7F2] border-2 border-[#16803E]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#16803E] shadow-2xs">
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block mb-1">
          SHIVAM OPTICS ATELIER ORDER CONFIRMED
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#0A251C] tracking-tight mb-2">
          Thank you for choosing Shivam Optics
        </h2>
        <p className="text-xs sm:text-sm text-[#716B64] max-w-lg mx-auto">
          An SMS confirmation and order invoice have been queued for{" "}
          <strong className="text-[#0A251C]">{order.shippingAddress.email || order.shippingAddress.phone}</strong>.
        </p>

        {/* Order Meta Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#E8DEC8]">
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-4 py-2 text-left">
            <span className="text-[10px] uppercase font-bold text-[#716B64] block">ORDER ID</span>
            <span className="font-mono font-bold text-[#0A251C] text-sm">{order.id}</span>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-4 py-2 text-left">
            <span className="text-[10px] uppercase font-bold text-[#716B64] block">TRACKING NUMBER</span>
            <span className="font-mono font-bold text-[#C5A059] text-sm">{order.trackingNumber}</span>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl px-4 py-2 text-left">
            <span className="text-[10px] uppercase font-bold text-[#716B64] block">ESTIMATED DELIVERY</span>
            <span className="font-bold text-[#0A251C] text-sm">{order.estimatedDeliveryDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={handlePrintInvoice}
            className="px-5 py-2.5 rounded-xl border border-[#E8DEC8] bg-[#FAF7F2] hover:bg-[#FAF3EB] text-[#0A251C] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#716B64]" />
            <span>Print Tax Invoice (GST 9003)</span>
          </button>

          <button
            type="button"
            onClick={onContinueShopping}
            className="px-6 py-2.5 rounded-xl bg-[#0A251C] hover:bg-[#C5A059] text-white hover:text-[#0A251C] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Optical Lab 5-Stage Stepper */}
      <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-serif font-bold text-[#0A251C] text-base sm:text-lg">
              Mayur Vihar Optical Lab Assembly Queue
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#16803E] bg-[#16803E]/10 px-2.5 py-1 rounded-full border border-[#16803E]/20">
            IN CLINICAL ASSEMBLY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {steps.map((st, i) => (
            <div
              key={st.label}
              className={`p-4 rounded-xl border text-center transition ${
                st.status === "completed"
                  ? "bg-[#FAF7F2] border-[#16803E]/40"
                  : st.status === "current"
                  ? "bg-[#FAF7F2] border-[#C5A059] ring-1 ring-[#C5A059]/40"
                  : "bg-white border-neutral-200 opacity-60"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xs ${
                  st.status === "completed"
                    ? "bg-[#16803E] text-white"
                    : st.status === "current"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {i + 1}
              </div>
              <h4 className="text-xs font-bold text-[#0A251C] mb-1">{st.label}</h4>
              <p className="text-[10px] text-[#716B64] leading-tight">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Items & Shipping Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 shadow-2xs">
          <h4 className="font-serif font-bold text-[#0A251C] text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C5A059]" />
            <span>Prescription & Frame Packages</span>
          </h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs pb-2 border-b border-neutral-100 last:border-b-0">
                <div>
                  <div className="font-bold text-[#0A251C]">{item.product?.name}</div>
                  <div className="text-[11px] text-[#716B64]">
                    {item.lensConfig?.lensPackage?.name || "Frame Only"}
                  </div>
                </div>
                <div className="font-mono font-bold text-[#0A251C]">
                  {formatCurrency(
                    ((item.product?.price || 0) + (item.lensConfig?.totalLensPrice || 0)) *
                      (item.quantity || 1)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 shadow-2xs">
          <h4 className="font-serif font-bold text-[#0A251C] text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#C5A059]" />
            <span>Delivery Destination</span>
          </h4>
          <div className="text-xs text-[#716B64] space-y-1">
            <p className="font-bold text-[#0A251C]">
              {order.shippingAddress.fullName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}
            </p>
            <p>{order.shippingAddress.streetAddress}</p>
            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
            <p className="pt-2 text-[11px] font-mono">
              Phone: {order.shippingAddress.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
