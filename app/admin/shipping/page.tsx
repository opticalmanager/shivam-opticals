"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Save,
  Loader2,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminShippingPage() {
  const [shippingConfig, setShippingConfig] = useState<any>({
    freeShippingThreshold: 5000,
    standardShippingFee: 250,
    expressShippingFee: 490,
    defaultCarrier: "BlueDart Express",
    supportedCarriers: ["BlueDart Express", "Delhivery Air", "DTDC Priority Air"],
    enableWhiteGloveHomeTrial: true,
    trialDepositAmount: 3000,
    shiprocketEmail: "service.viralnest@gmail.com",
    shiprocketPickupLocation: "Mayur Vihar Atelier",
    shiprocketPickupCity: "Delhi",
    shiprocketPickupPincode: "110091",
    fulfillmentMode: "manual_1click",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Simulated cart value to preview the storefront incentive bar
  const [previewCartValue, setPreviewCartValue] = useState(3800);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings?key=shipping").then((r) => r.json()),
      fetch("/api/admin/shipping/shiprocket").then((r) => r.json()).catch(() => ({ connected: false })),
    ])
      .then(([settingsData, connectionData]) => {
        if (settingsData.success && settingsData.value) {
          setShippingConfig((prev: any) => ({
            ...prev,
            ...settingsData.value,
          }));
        }
        if (connectionData) {
          setApiConnected(Boolean(connectionData.connected));
        }
      })
      .catch((e) => console.warn("Failed to load shipping data:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch latest to preserve all API/webhook secrets while saving rules
      const existingRes = await fetch("/api/admin/settings?key=shipping");
      const existingData = await existingRes.json();
      const mergedConfig = {
        ...(existingData.value || {}),
        ...shippingConfig,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "shipping", value: mergedConfig }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Shipping rules and storefront incentives saved successfully");
      } else {
        toast.error("Failed to save rules", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Save error", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  // Calculate incentive delta for preview
  const threshold = Number(shippingConfig.freeShippingThreshold || 5000);
  const remainingForFreeShipping = Math.max(0, threshold - previewCartValue);
  const incentivePercentage = Math.min(100, Math.round((previewCartValue / threshold) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-[1400px] mx-auto">
      {/* Header with Configure API button in top right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Shipping &amp; Logistics Operating Center
          </h1>
          <p className="text-xs text-stone-500">
            Manage storefront delivery incentives, customer shipping rates, and white-glove atelier trials
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top-Right Configure API Button */}
          <Link href="/admin/shipping/api">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-[#E8DCCF] bg-white text-[#0A251C] hover:bg-[#FAF7F2] h-8 shadow-2xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" />
              <span>Configure Carrier API &amp; Webhook</span>
            </Button>
          </Link>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs h-8 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            <span>Save Rules</span>
          </Button>
        </div>
      </div>

      {/* 1. Carrier Connection Status Mini-Banner */}
      <div className="bg-[#FAF3EB] border border-[#E8DCCF] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E8DCCF] flex items-center justify-center text-[#C5A059] shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-[#0A251C]">
              <span>Carrier Provider: Shiprocket Logistics</span>
              {apiConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  API Active
                </span>
              ) : (
                <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full uppercase">
                  Credentials Stored
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Pickup Origin: {shippingConfig.shiprocketPickupCity || "New Delhi"} ({shippingConfig.shiprocketPickupPincode || "110091"}) • AWB Gate: {shippingConfig.fulfillmentMode || "manual_1click"}
            </p>
          </div>
        </div>

        <Link
          href="/admin/shipping/api"
          className="text-xs font-semibold text-[#C5A059] hover:underline self-start sm:self-auto flex items-center gap-1"
        >
          <span>Manage API Credentials &amp; Webhook</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Note about Product-Specific Packaging Dimensions */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 flex items-start gap-3 text-xs text-stone-600">
        <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-[#0A251C]">
            Packaging Dimensions are Product-Specific
          </div>
          <p className="text-[11px] leading-relaxed">
            Box dimensions and dead weights are defined individually per eyewear product or custom case. When an order arrives, the system auto-fetches the packaging specs directly from the ordered product, allowing opticians to review or adjust them before booking the AWB.
          </p>
        </div>
      </div>

      {/* 2. Storewide Incentive Policy (Free Shipping & Threshold) */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#0A251C]">
                  Storewide Complimentary Insured Delivery Policy
                </h2>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                  Cart &amp; Checkout Incentive
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Encourages higher cart values by unlocking free insured air transit when orders exceed the threshold
              </p>
            </div>
          </div>
        </div>

        {/* Incentive Settings Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Free Shipping Threshold (INR ₹)
            </label>
            <input
              type="number"
              value={shippingConfig.freeShippingThreshold}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  freeShippingThreshold: Number(e.target.value),
                })
              }
              placeholder="5000"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C] font-semibold focus:outline-none focus:border-[#C5A059]"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Orders reaching this subtotal receive complimentary insured delivery
            </p>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Standard Courier Rate (Sub-Threshold) (INR ₹)
            </label>
            <input
              type="number"
              value={shippingConfig.standardShippingFee}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  standardShippingFee: Number(e.target.value),
                })
              }
              placeholder="250"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Charged to the customer when the order subtotal is below the threshold
            </p>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Express Priority Air Add-On (INR ₹)
            </label>
            <input
              type="number"
              value={shippingConfig.expressShippingFee || 490}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  expressShippingFee: Number(e.target.value),
                })
              }
              placeholder="490"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Client upgrade fee for next-day priority air transit
            </p>
          </div>
        </div>

        {/* Carrier Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Default Primary Carrier Partner
            </label>
            <input
              type="text"
              value={shippingConfig.defaultCarrier || "BlueDart Express"}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  defaultCarrier: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Supported Logistics Carriers
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(shippingConfig.supportedCarriers || ["BlueDart Express", "Delhivery Air", "DTDC Priority Air"]).map(
                (carrier: string) => (
                  <span
                    key={carrier}
                    className="bg-[#FAF7F2] border border-[#E8DCCF] text-[#0A251C] px-2.5 py-1 rounded-md text-[11px] font-medium"
                  >
                    {carrier}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Live Storefront Incentive Simulator */}
        <div className="pt-3 border-t border-stone-100 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DCCF] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A251C]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Live Storefront Incentive Simulator (Client View in Cart &amp; Checkout)</span>
            </div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Real-time customer preview
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 whitespace-nowrap">Simulate Cart Subtotal:</span>
            <input
              type="range"
              min={1000}
              max={10000}
              step={200}
              value={previewCartValue}
              onChange={(e) => setPreviewCartValue(Number(e.target.value))}
              className="flex-1 accent-[#C5A059] cursor-pointer"
            />
            <span className="text-xs font-bold text-[#0A251C] font-mono min-w-[70px] text-right">
              ₹{previewCartValue.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Client-Facing Progress Bar Simulation */}
          <div className="p-3.5 bg-white border border-[#E8DCCF] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0A251C]">
                {remainingForFreeShipping > 0 ? (
                  <>
                    Add <strong className="text-[#C5A059]">₹{remainingForFreeShipping.toLocaleString("en-IN")}</strong> more to unlock Complimentary Insured Air Transit
                  </>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Complimentary Insured Air Transit Unlocked
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-stone-500">{incentivePercentage}%</span>
            </div>

            <div className="w-full bg-[#FAF7F2] border border-[#E8DCCF] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  remainingForFreeShipping === 0 ? "bg-emerald-600" : "bg-[#C5A059]"
                }`}
                style={{ width: `${incentivePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Luxury Atelier Service (White-Glove Home Trial) */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Luxury Atelier Service
            </div>
            <h2 className="text-base font-bold text-[#0A251C]">
              White-Glove In-Home Frame Trial
            </h2>
            <p className="text-xs text-stone-600 max-w-xl mt-1 leading-relaxed">
              Optician hand-delivers a curated case of up to 5 designer frames directly to the client residence or executive suite with digital pupillometer.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <span className="text-stone-600">Active</span>
            <input
              type="checkbox"
              checked={shippingConfig.enableWhiteGloveHomeTrial}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  enableWhiteGloveHomeTrial: e.target.checked,
                })
              }
              className="rounded text-[#C5A059] w-4 h-4 cursor-pointer accent-[#C5A059]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Home Trial Security Hold Deposit (INR ₹)
            </label>
            <input
              type="number"
              value={shippingConfig.trialDepositAmount}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  trialDepositAmount: Number(e.target.value),
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Eligible Metro Clusters
            </label>
            <div className="text-stone-600 text-xs py-1.5">
              Delhi NCR, Mayur Vihar, Noida, South Delhi, Gurugram
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
