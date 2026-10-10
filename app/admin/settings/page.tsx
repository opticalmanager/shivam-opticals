"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  Store,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Save,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "general";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // General store settings state
  const [generalConfig, setGeneralConfig] = useState({
    storeName: "Shivam Optics",
    tagline: "Haute Lunetterie Atelier & Optometry",
    email: "concierge@shivamoptics.in",
    phone: "097799 90207",
    currency: "INR (₹)",
    operatingHours: "Monday - Sunday: 10:30 AM - 09:00 PM",
    address: "Pocket 1, Mayur Vihar Phase 1, New Delhi - 110091",
  });

  // Store & Atelier Policies state
  const [storePolicies, setStorePolicies] = useState({
    mandatoryVerification: true,
    titaniumWarranty: true,
    whiteGloveTrial: true,
    complimentaryCaseAndCloth: true,
  });

  // Notifications state
  const [notificationsConfig, setNotificationsConfig] = useState({
    orderEmail: true,
    labAssemblyWhatsApp: true,
    dispatchSms: true,
    lowStockStaffAlert: true,
  });

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/settings?key=general").then((r) => r.json()),
      fetch("/api/admin/settings?key=store").then((r) => r.json()),
      fetch("/api/admin/settings?key=notifications").then((r) => r.json()),
    ])
      .then(([genData, storeData, notifData]) => {
        if (genData.success && genData.value) {
          setGeneralConfig((prev) => ({ ...prev, ...genData.value }));
        }
        if (storeData.success && storeData.value) {
          setStorePolicies((prev) => ({ ...prev, ...storeData.value }));
        }
        if (notifData.success && notifData.value) {
          setNotificationsConfig((prev) => ({ ...prev, ...notifData.value }));
        }
      })
      .catch((e) => console.warn("Failed to load settings:", e))
      .finally(() => setLoading(false));
  }, []);

  const saveSetting = async (key: string, value: any, successMsg: string) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(successMsg);
      } else {
        toast.error("Failed to save", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Error saving settings", { description: e.message });
    } finally {
      setSavingKey(null);
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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-3 border-b border-[#E8DCCF]">
        <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
          Settings & Atelier Configuration
        </h1>
        <p className="text-xs text-stone-500">
          Universal configuration for store identity, laboratory policies, and team operations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E8DCCF] text-xs font-medium overflow-x-auto">
        {[
          { id: "general", label: "General Atelier", icon: Sliders },
          { id: "store", label: "Policies & Standards", icon: Store },
          { id: "notifications", label: "Alerts & Notifications", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#C5A059] text-[#0A251C] font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* GENERAL TAB */}
      {activeTab === "general" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Atelier Identity & Contact</h3>
              <p className="text-xs text-stone-500">Core business metadata shown on customer invoices & storefront</p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={savingKey === "general"}
              onClick={() => saveSetting("general", generalConfig, "Atelier details saved")}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Boutique Name</label>
              <input
                type="text"
                value={generalConfig.storeName}
                onChange={(e) => setGeneralConfig({ ...generalConfig, storeName: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Tagline</label>
              <input
                type="text"
                value={generalConfig.tagline}
                onChange={(e) => setGeneralConfig({ ...generalConfig, tagline: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Email</label>
              <input
                type="email"
                value={generalConfig.email}
                onChange={(e) => setGeneralConfig({ ...generalConfig, email: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Boutique Phone</label>
              <input
                type="text"
                value={generalConfig.phone}
                onChange={(e) => setGeneralConfig({ ...generalConfig, phone: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Registered Boutique Address</label>
              <input
                type="text"
                value={generalConfig.address}
                onChange={(e) => setGeneralConfig({ ...generalConfig, address: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STORE POLICIES TAB */}
      {activeTab === "store" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Optical Laboratory Protocols</h3>
              <p className="text-xs text-stone-500">Quality verification flags and packaging guarantees</p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={savingKey === "store"}
              onClick={() => saveSetting("store", storePolicies, "Policies saved")}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save</span>
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DCCF] bg-[#FAF7F2] cursor-pointer">
              <input
                type="checkbox"
                checked={storePolicies.mandatoryVerification}
                onChange={(e) => setStorePolicies({ ...storePolicies, mandatoryVerification: e.target.checked })}
                className="rounded text-[#C5A059]"
              />
              <div>
                <span className="font-bold text-[#0A251C] block">Mandatory 4-Point Prescription Verification</span>
                <span className="text-stone-500 text-[11px]">Require lab lead to verify sphere, cylinder, axis, and pupil distance before dispatch.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DCCF] bg-[#FAF7F2] cursor-pointer">
              <input
                type="checkbox"
                checked={storePolicies.titaniumWarranty}
                onChange={(e) => setStorePolicies({ ...storePolicies, titaniumWarranty: e.target.checked })}
                className="rounded text-[#C5A059]"
              />
              <div>
                <span className="font-bold text-[#0A251C] block">24-Month Titanium Manufacturing Warranty</span>
                <span className="text-stone-500 text-[11px]">Include official warranty certificate on all genuine titanium frame shipments.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DCCF] bg-[#FAF7F2] cursor-pointer">
              <input
                type="checkbox"
                checked={storePolicies.complimentaryCaseAndCloth}
                onChange={(e) => setStorePolicies({ ...storePolicies, complimentaryCaseAndCloth: e.target.checked })}
                className="rounded text-[#C5A059]"
              />
              <div>
                <span className="font-bold text-[#0A251C] block">Complimentary Hard Leather Case & Microfiber Cloth</span>
                <span className="text-stone-500 text-[11px]">Every dispatched order automatically includes boutique accessories.</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Customer Alerts</h3>
              <p className="text-xs text-stone-500">Dispatch notifications and lab assembly alerts</p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={savingKey === "notifications"}
              onClick={() => saveSetting("notifications", notificationsConfig, "Notification preferences saved")}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save</span>
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DCCF] bg-[#FAF7F2] cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsConfig.orderEmail}
                onChange={(e) => setNotificationsConfig({ ...notificationsConfig, orderEmail: e.target.checked })}
                className="rounded text-[#C5A059]"
              />
              <div>
                <span className="font-bold text-[#0A251C] block">Order Confirmation Email</span>
                <span className="text-stone-500 text-[11px]">Send itemized tax invoice receipt to patron immediately upon checkout.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DCCF] bg-[#FAF7F2] cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsConfig.dispatchSms}
                onChange={(e) => setNotificationsConfig({ ...notificationsConfig, dispatchSms: e.target.checked })}
                className="rounded text-[#C5A059]"
              />
              <div>
                <span className="font-bold text-[#0A251C] block">Dispatch & Courier Tracking SMS</span>
                <span className="text-stone-500 text-[11px]">Send tracking URL and courier partner info when order moves to Dispatched stage.</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
