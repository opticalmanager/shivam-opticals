"use client";

import React, { useState, useEffect } from "react";
import { Truck, ShieldCheck, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminShippingPage() {
  const [shippingConfig, setShippingConfig] = useState<any>({
    freeShippingThreshold: 2000,
    standardShippingFee: 150,
    expressShippingFee: 350,
    defaultCarrier: "Delhivery Air",
    supportedCarriers: ["Delhivery Air", "BlueDart Express", "Mayur Vihar Lab Pickup"],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=shipping")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setShippingConfig(data.value);
        }
      })
      .catch((e) => console.warn("Failed to fetch shipping settings:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "shipping", value: shippingConfig }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Shipping rules updated successfully");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Shipping & Logistics Architecture
          </h1>
          <p className="text-xs text-stone-500">
            Define insured courier rules, free-shipping thresholds, and delivery options
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          <span>Save Changes</span>
        </Button>
      </div>

      {/* Free Shipping Rule Module */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#C5A059] mb-1">
            Storewide Transit Incentive
          </div>
          <h2 className="text-base font-bold text-[#0A251C] font-serif">Insured Courier Transit</h2>
          <p className="text-xs text-stone-600 max-w-xl mt-1 leading-relaxed">
            Orders surpassing this threshold receive complimentary insured delivery from the Mayur Vihar lab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100 text-xs">
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
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Standard Courier Rate (INR ₹)
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
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Default Primary Courier
            </label>
            <input
              type="text"
              value={shippingConfig.defaultCarrier}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  defaultCarrier: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
