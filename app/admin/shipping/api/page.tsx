"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Webhook,
  Activity,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Layers,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminShippingApiSettingsPage() {
  const [shippingConfig, setShippingConfig] = useState<any>({
    shiprocketEmail: "service.viralnest@gmail.com",
    shiprocketPassword: "ou6wb4ob*JiuAl6zW5^KM7DWX*Ln#wpx",
    shiprocketPickupLocation: "work",
    shiprocketPickupAddress: "Pocket 1, Mayur Vihar Phase 1",
    shiprocketPickupCity: "New Delhi",
    shiprocketPickupState: "Delhi",
    shiprocketPickupPincode: "110091",
    shiprocketWebhookSecret: "shivam_shiprocket_sec_2026",
    fulfillmentMode: "manual_1click",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message?: string;
  }>({
    tested: false,
    connected: false,
  });

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/delivery`
    : "https://shivamoptical.in/api/webhooks/delivery";

  useEffect(() => {
    fetch("/api/admin/settings?key=shipping")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setShippingConfig((prev: any) => ({
            ...prev,
            ...data.value,
          }));
        }
      })
      .catch((e) => console.warn("Failed to fetch shipping settings:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // First fetch current entire shipping config to merge preserving rates/incentives
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
        toast.success("Shiprocket API & Webhook settings saved successfully");
      } else {
        toast.error("Failed to save settings", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Save error", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/admin/shipping/shiprocket");
      const data = await res.json();
      setConnectionStatus({
        tested: true,
        connected: data.connected,
        message: data.message,
      });

      if (data.connected) {
        toast.success("Shiprocket API Connected", {
          description: "Live authentication verified with Shiprocket logistics server.",
        });
      } else {
        toast.info("Shiprocket Credentials Stored", {
          description: data.message || "Verify your API user settings in the Shiprocket dashboard.",
        });
      }
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        connected: false,
        message: err.message || "Network error while connecting to Shiprocket",
      });
      toast.error("Connection Test Failed", { description: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(shippingConfig.shiprocketWebhookSecret || "shivam_shiprocket_sec_2026");
    setCopiedSecret(true);
    toast.success("Webhook Secret copied to clipboard");
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-[1400px] mx-auto">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div className="space-y-1">
          <Link
            href="/admin/shipping"
            className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-[#C5A059] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Shipping Rules &amp; Incentives</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
              Logistics API &amp; Webhook Synchronization
            </h1>
            <span className="text-[10px] bg-[#FAF3EB] text-[#C5A059] border border-[#E8DCCF] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Carrier Gateway
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Configure Shiprocket credentials, pickup dispatch origin, fulfillment gates, and real-time tracking webhooks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="text-xs h-8 border-[#E8DCCF] text-stone-700 bg-white hover:bg-[#FAF7F2] cursor-pointer"
          >
            {testingConnection ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#C5A059]" />
            ) : (
              <Activity className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" />
            )}
            <span>Test Connection</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs h-8 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            <span>Save API Settings</span>
          </Button>
        </div>
      </div>

      {/* Connection Test Result Banner */}
      {connectionStatus.tested && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            connectionStatus.connected
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          {connectionStatus.connected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="font-semibold">
              {connectionStatus.connected
                ? "Shiprocket API Connected & Operational"
                : "Shiprocket Connection Notice"}
            </div>
            <div className="text-[11px] leading-relaxed">
              {connectionStatus.message ||
                (connectionStatus.connected
                  ? "Authentication verified. Real-time rates, AWB booking, and pickup scheduling are active."
                  : "Please verify email and password match an active API User configured in Shiprocket Settings.")}
            </div>
          </div>
        </div>
      )}

      {/* 1. Shiprocket API Credentials Card */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0A251C]">Shiprocket Authentication Credentials</h2>
            <p className="text-xs text-stone-500">
              API credentials used to generate session tokens and book shipments automatically
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Shiprocket Account Email
            </label>
            <input
              type="email"
              value={shippingConfig.shiprocketEmail || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketEmail: e.target.value,
                })
              }
              placeholder="service.viralnest@gmail.com"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Shiprocket API Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={shippingConfig.shiprocketPassword || ""}
                onChange={(e) =>
                  setShippingConfig({
                    ...shippingConfig,
                    shiprocketPassword: e.target.value,
                  })
                }
                placeholder="Enter API Password"
                className="w-full px-3 py-2 pr-9 bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg text-xs text-[#0A251C] font-mono focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Atelier Pickup Location Card */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0A251C]">
                Primary Atelier Pickup Location (Consignment Origin)
              </h2>
              <p className="text-xs text-stone-500">
                Couriers will arrive at this address to collect boxed eyewear orders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShippingConfig({
                ...shippingConfig,
                shiprocketPickupLocation: "work",
                shiprocketPickupAddress: "Pocket 1, Mayur Vihar Phase 1",
                shiprocketPickupCity: "New Delhi",
                shiprocketPickupState: "Delhi",
                shiprocketPickupPincode: "110091",
              })
            }
            className="text-[11px] font-bold text-[#C5A059] hover:underline cursor-pointer bg-[#FAF3EB] px-2.5 py-1 rounded-md border border-[#E8DCCF]"
          >
            Load Mayur Vihar Lab (Delhi 110091)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Location Nickname in Shiprocket
            </label>
            <input
              type="text"
              value={shippingConfig.shiprocketPickupLocation || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketPickupLocation: e.target.value,
                })
              }
              placeholder="work"
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
            <p className="text-[10px] text-stone-400 mt-1">Must match registered nickname (e.g. &apos;work&apos;)</p>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-stone-700 font-semibold mb-1">
              Street Address / Lab Unit
            </label>
            <input
              type="text"
              value={shippingConfig.shiprocketPickupAddress || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketPickupAddress: e.target.value,
                })
              }
              placeholder="Pocket 1, Mayur Vihar Phase 1"
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Postal PIN Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={shippingConfig.shiprocketPickupPincode || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketPickupPincode: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="110091"
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs font-mono text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              City
            </label>
            <input
              type="text"
              value={shippingConfig.shiprocketPickupCity || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketPickupCity: e.target.value,
                })
              }
              placeholder="New Delhi"
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              State
            </label>
            <input
              type="text"
              value={shippingConfig.shiprocketPickupState || ""}
              onChange={(e) =>
                setShippingConfig({
                  ...shippingConfig,
                  shiprocketPickupState: e.target.value,
                })
              }
              placeholder="Delhi"
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            />
          </div>
        </div>
      </div>

      {/* 3. Optical Lab Dispatch Policy Gate Card */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0A251C]">
              Fulfillment Gate &amp; AWB Dispatch Workflow
            </h2>
            <p className="text-xs text-stone-500">
              Control when Shiprocket AWBs and courier collections are triggered
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "manual_1click",
              title: "Manual 1-Click Dispatch",
              badge: "Recommended",
              desc: "Master optician inspects lenses, reviews package dimensions, and 1-click books courier & prints label in Order Details.",
            },
            {
              id: "hybrid",
              title: "Hybrid Fulfillment",
              badge: "Intelligent",
              desc: "Auto-books sunglasses & accessories upon payment; prescription opticals wait for optical lab quality inspection.",
            },
            {
              id: "auto_dispatch",
              title: "Instant Auto-Booking",
              badge: "Fastest",
              desc: "Instantly creates Shiprocket consignment and assigns AWB upon payment confirmation.",
            },
          ].map((mode) => (
            <div
              key={mode.id}
              onClick={() =>
                setShippingConfig({
                  ...shippingConfig,
                  fulfillmentMode: mode.id,
                })
              }
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                shippingConfig.fulfillmentMode === mode.id
                  ? "border-[#C5A059] bg-[#FAF3EB] ring-1 ring-[#C5A059]"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0A251C]">{mode.title}</span>
                <span className="text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-semibold uppercase">
                  {mode.badge}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">{mode.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Shiprocket Webhook Receiver Card */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
            <Webhook className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0A251C]">Shiprocket Webhook Receiver</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Active Ingestion
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Shiprocket pushes real-time tracking events (In-Transit, Out for Delivery, Delivered) to this URL
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          In your Shiprocket Dashboard, navigate to <strong>Settings &gt; API &gt; Webhooks &gt; Add Webhook</strong> and configure these exact parameters:
        </p>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-stone-600 uppercase">
            Webhook URL (Keyword-Compliant)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 bg-[#FAF7F2] border border-[#E8DCCF] px-3 py-2 rounded-lg font-mono text-xs text-stone-800"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyWebhook}
              className="text-xs h-9 bg-white border-[#E8DCCF] text-[#0A251C] cursor-pointer"
            >
              {copiedWebhook ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copy URL</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-lg">
            <strong>Shiprocket Rule:</strong> Shiprocket strictly rejects webhook URLs containing words like <code>shiprocket</code>, <code>kartrocket</code>, <code>sr</code>, or <code>kr</code>. This <code>/api/webhooks/delivery</code> endpoint is fully compliant.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
              Auth Token Type in Shiprocket
            </label>
            <input
              type="text"
              readOnly
              value="x-api-key"
              className="w-full bg-[#FAF7F2] border border-[#E8DCCF] px-3 py-1.5 rounded-lg font-mono text-xs text-stone-700"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 uppercase block mb-1">
              Token / Secret Value
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shippingConfig.shiprocketWebhookSecret || "shivam_shiprocket_sec_2026"}
                className="flex-1 bg-[#FAF7F2] border border-[#E8DCCF] px-3 py-1.5 rounded-lg font-mono text-xs text-stone-700"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopySecret}
                className="text-xs h-8 bg-white border-[#E8DCCF] text-[#0A251C] cursor-pointer"
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
