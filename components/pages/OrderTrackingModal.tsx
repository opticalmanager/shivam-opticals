"use client";

import React, { useState } from "react";
import { X, Search, CheckCircle2, Truck, Package, Clock, ShieldCheck, MapPin, Glasses } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

export const OrderTrackingModal: React.FC = () => {
  const { isTrackingModalOpen, closeTrackingModal, selectedTrackingOrder, orders } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [activeOrder, setActiveOrder] = useState<Order | null>(
    selectedTrackingOrder || (orders.length > 0 ? orders[0] : null)
  );

  if (!isTrackingModalOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    const found = orders.find(
      (o) => o.trackingNumber.toUpperCase() === query || o.id.toUpperCase() === query
    );
    if (found) {
      setActiveOrder(found);
    } else {
      alert(`No order found matching "${query}". Please check your order reference.`);
    }
  };

  const currentDisplayOrder = activeOrder || selectedTrackingOrder || (orders.length > 0 ? orders[0] : null);

  const STAGES = [
    {
      id: "confirmed",
      title: "Order Confirmed & Rx Verified",
      desc: "Prescription parameters checked by certified optical master",
    },
    {
      id: "optician_assembly",
      title: "Robotic Lens Surfacing & Edging",
      desc: "Precision surfacing, cylinder axis alignment & anti-reflective hard coating",
    },
    {
      id: "quality_check",
      title: "12-Point Clinical Inspection",
      desc: "Pupillary distance verification, frame alignment & tension testing",
    },
    {
      id: "dispatched",
      title: "Insured Courier Dispatched",
      desc: "Packed in custom shock-proof luxury presentation vault box",
    },
    {
      id: "delivered",
      title: "Delivered to Doorstep",
      desc: "Complete with certificate of optical authenticity & warranty card",
    },
  ];

  const getStageIndex = (status?: string) => {
    switch (status) {
      case "confirmed":
        return 0;
      case "optician_assembly":
        return 1;
      case "quality_check":
        return 2;
      case "dispatched":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(currentDisplayOrder?.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FCFAF7] border border-[#E8DEC8] rounded-3xl max-w-2xl w-full my-8 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A251C] text-white px-6 py-5 flex items-center justify-between border-b border-[#C5A059]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FAF3EB]/10 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              <Truck className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="font-serif text-sm tracking-widest uppercase font-bold text-[#C5A059]">
                SHIVAM OPTICAL ORDER TRACKER
              </h3>
              <p className="text-[10px] text-stone-300 font-sans tracking-wider uppercase">
                Real-Time Clinical Assembly & Delivery Status
              </p>
            </div>
          </div>
          <button
            onClick={closeTrackingModal}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-[#C5A059] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs font-sans text-stone-800">
          {/* Tracking Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Order Number or AWB Tracking ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white border border-[#E8DEC8] px-4 py-3 pl-10 text-xs text-[#1A1816] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059] rounded-xl"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              className="bg-[#C5A059] hover:bg-[#B08B45] text-white px-5 py-3 text-xs uppercase font-bold tracking-wider rounded-xl transition cursor-pointer shrink-0"
            >
              Locate Order
            </button>
          </form>

          {currentDisplayOrder ? (
            <div className="space-y-6">
              {/* Order Meta Header Card */}
              <div className="bg-[#FAF3EB] border border-[#E8DEC8] p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] tracking-widest text-[#716B64] uppercase font-bold">
                    Order Reference
                  </div>
                  <div className="font-mono text-sm font-bold text-[#0A251C]">
                    {currentDisplayOrder.trackingNumber || currentDisplayOrder.id}
                  </div>
                  <div className="text-[11px] text-[#716B64]">
                    Placed on{" "}
                    {new Date(currentDisplayOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="space-y-1 sm:text-right">
                  <div className="text-[10px] tracking-widest text-[#716B64] uppercase font-bold">
                    Estimated Delivery
                  </div>
                  <div className="text-sm font-bold text-[#C5A059]">
                    {currentDisplayOrder.estimatedDeliveryDate || "3-5 Business Days"}
                  </div>
                  <div className="text-[11px] text-[#716B64]">
                    Total:{" "}
                    <span className="font-bold text-[#0A251C]">
                      {formatCurrency(currentDisplayOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Stage Optical Lab Progression */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#0A251C]">
                  Optical Laboratory Progress
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E8DEC8]">
                  {STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stage.id} className="relative flex items-start gap-4">
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#FCFAF7] transition-all ${
                            isCompleted
                              ? "bg-[#C5A059] text-white"
                              : "bg-[#E8DEC8] text-stone-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent
                                ? "text-[#C5A059]"
                                : isCompleted
                                ? "text-[#0A251C]"
                                : "text-stone-400"
                            }`}
                          >
                            {stage.title}
                          </div>
                          <p className="text-[11px] text-[#716B64] mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address */}
              {currentDisplayOrder.shippingAddress && (
                <div className="bg-white border border-[#E8DEC8] p-4 rounded-xl flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#716B64] space-y-0.5">
                    <span className="font-bold text-[#0A251C]">
                      {currentDisplayOrder.shippingAddress.fullName}
                    </span>
                    <p>
                      {currentDisplayOrder.shippingAddress.streetAddress}
                      {currentDisplayOrder.shippingAddress.apartment
                        ? `, ${currentDisplayOrder.shippingAddress.apartment}`
                        : ""}
                    </p>
                    <p>
                      {currentDisplayOrder.shippingAddress.city},{" "}
                      {currentDisplayOrder.shippingAddress.state} -{" "}
                      {currentDisplayOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <Glasses className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-[#0A251C]">No Active Orders in History</p>
              <p className="text-xs text-stone-400">
                Enter your order number or tracking ID above to check optical assembly status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
