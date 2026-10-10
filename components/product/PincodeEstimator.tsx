"use client";

import React, { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle2, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

interface PincodeEstimatorProps {
  isRx?: boolean;
}

export const PincodeEstimator: React.FC<PincodeEstimatorProps> = ({ isRx = false }) => {
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    serviceable: boolean;
    carrier?: string;
    estimatedDeliveryDate?: string;
    message?: string;
  } | null>(null);

  // Load previously checked pincode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shivam_delivery_pincode");
      if (saved && /^\d{6}$/.test(saved)) {
        setPincode(saved);
        checkPincode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const checkPincode = async (pinToCheck?: string) => {
    const pin = (pinToCheck || pincode).trim();
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setResult({
        serviceable: false,
        message: "Please enter a valid 6-digit postal PIN code",
      });
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/shipping/estimate-delivery?pincode=${pin}&isRx=${isRx ? "true" : "false"}`);
      const data = await res.json();

      if (data.success && data.serviceable) {
        setResult({
          serviceable: true,
          carrier: data.carrier || "BlueDart Express Air",
          estimatedDeliveryDate: data.estimatedDeliveryDate,
        });
        try {
          localStorage.setItem("shivam_delivery_pincode", pin);
        } catch {
          // ignore
        }
      } else {
        setResult({
          serviceable: false,
          message: data.message || "Delivery currently unavailable for this PIN code.",
        });
      }
    } catch {
      setResult({
        serviceable: false,
        message: "Unable to verify delivery date at this moment.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode();
  };

  return (
    <div className="border border-[#E8DEC8] bg-[#FAF7F2] rounded-xl p-3.5 space-y-2.5 text-xs text-[#1A1816]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0A251C]">
          <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Estimated Atelier Delivery</span>
        </div>
        <span className="text-[10px] text-stone-500 uppercase tracking-wider">
          Insured Air Transit
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPincode(val);
              if (result) setResult(null);
            }}
            placeholder="Enter 6-digit PIN (e.g. 110001)"
            className="w-full pl-8 pr-2 py-1.5 bg-white border border-[#E8DEC8] rounded-lg text-xs font-mono text-[#1A1816] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <button
          type="submit"
          disabled={checking || pincode.length !== 6}
          className="px-3 py-1.5 bg-[#0A251C] hover:bg-black disabled:opacity-50 text-[#C5A059] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          {checking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Check</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="pt-1.5 border-t border-[#E8DEC8]">
          {result.serviceable ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Delivery by <strong className="underline decoration-[#C5A059]">{result.estimatedDeliveryDate}</strong>
                </span>
              </div>
              <div className="text-[11px] text-stone-600 pl-5">
                Dispatched via {result.carrier} • Transit Insurance Included
              </div>
              {isRx && (
                <div className="text-[10px] text-amber-800 bg-amber-50 rounded px-2 py-1 mt-1 border border-amber-200">
                  Includes 48h optical surfacing & 12-point clinical inspection buffer
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-rose-700">
              {result.message}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Complimentary Armored Transit</span>
        </div>
        <span>Dispatched from Mayur Vihar Atelier (110091)</span>
      </div>
    </div>
  );
};
