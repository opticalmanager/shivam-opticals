"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
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
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminShippingApiSettingsPage() {
  const [shippingConfig, setShippingConfig] = useState<any>({
    shiprocketEmail: "service.viralnest@gmail.com",
    shiprocketPassword: "ou6wb4ob*JiuAl6zW5^KM7DWX*Ln#wpx",
    shiprocketPickupLocation: "work",
    shiprocketPickupAddress: "Shivam Optics Atelier, Main Market",
    shiprocketPickupCity: "Delhi",
    shiprocketPickupState: "Delhi",
    shiprocketPickupPincode: "110001",
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
    ? `${window.location.origin}/api/webhooks/shiprocket`
    : "https://shivamoptics.in/api/webhooks/shiprocket";

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
      .catch((e) => console.warn("Failed to load shipping settings:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/admin/shipping/shiprocket");
      const data = await res.json();
      setConnectionStatus({
        tested: true,
        connected: Boolean(data.connected),
        message: data.message,
      });

      if (data.connected) {
        toast.success("Shiprocket API Connected", {
          description: "Authenticated successfully with active JWT session.",
        });
      } else {
        toast.error("Shiprocket Connection Failed", {
          description: data.message || "Could not verify credentials.",
        });
      }
    } catch (e: any) {
      setConnectionStatus({
        tested: true,
        connected: false,
        message: e.message || "Network error",
      });
      toast.error("Connection Check Error", { description: e.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "shipping",
          value: shippingConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Shipping API Settings Saved", {
          description: "Shiprocket credentials and warehouse parameters updated.",
        });
      } else {
        toast.error("Failed to save settings", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Save Error", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: "webhook" | "secret") => {
    navigator.clipboard.writeText(text);
    if (type === "webhook") {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
      toast.info("Webhook URL Copied", { description: "Paste into Shiprocket Settings > Webhooks." });
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast.info("Secret Key Copied", { description: "Paste as the Secret Token in Shiprocket." });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        <span className="text-xs text-stone-500 font-medium">Loading logistics API parameters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DEC8]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shipping"
            className="p-1.5 rounded-md hover:bg-black/5 text-stone-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0A251C] font-serif">
                Shiprocket Logistics & Webhook API
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#16803E]/10 text-[#16803E] border border-[#16803E]/20">
                LIVE PRODUCTION
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Automated courier serviceability, white-glove dispatch, and real-time order tracking webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="text-xs border-[#E8DEC8] bg-white hover:bg-stone-50"
          >
            {testingConnection ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5 mr-1.5 text-[#C5A059]" />
            )}
            <span>Test API Connection</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveSettings}
            disabled={saving}
            className="text-xs bg-[#0A251C] hover:bg-[#C5A059] text-white hover:text-[#0A251C] shadow-xs"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {connectionStatus.tested && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            connectionStatus.connected
              ? "bg-[#FAF7F2] border-[#16803E]/40 text-[#0A251C]"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-4 h-4 text-[#16803E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{connectionStatus.message}</span>
          </div>
        </div>
      )}

      {/* Grid: Credentials & Webhook Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Shiprocket Credentials & Pickup Hub */}
        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <KeyRound className="w-4 h-4 text-[#C5A059]" />
            <h2 className="text-sm font-bold text-[#0A251C] uppercase tracking-wider font-serif">
              API Credentials & Pickup Warehouse
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Shiprocket Registered Email
              </label>
              <input
                type="email"
                value={shippingConfig.shiprocketEmail || ""}
                onChange={(e) =>
                  setShippingConfig({ ...shippingConfig, shiprocketEmail: e.target.value })
                }
                className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Shiprocket Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={shippingConfig.shiprocketPassword || ""}
                  onChange={(e) =>
                    setShippingConfig({ ...shippingConfig, shiprocketPassword: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 pr-9 text-stone-900 focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Pickup Hub Nickname
                </label>
                <input
                  type="text"
                  value={shippingConfig.shiprocketPickupLocation || "work"}
                  onChange={(e) =>
                    setShippingConfig({ ...shippingConfig, shiprocketPickupLocation: e.target.value })
                  }
                  placeholder="e.g. work"
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Pickup Postal PIN
                </label>
                <input
                  type="text"
                  value={shippingConfig.shiprocketPickupPincode || "110001"}
                  onChange={(e) =>
                    setShippingConfig({ ...shippingConfig, shiprocketPickupPincode: e.target.value })
                  }
                  maxLength={6}
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Atelier Pickup Street Address
              </label>
              <input
                type="text"
                value={shippingConfig.shiprocketPickupAddress || ""}
                onChange={(e) =>
                  setShippingConfig({ ...shippingConfig, shiprocketPickupAddress: e.target.value })
                }
                className="w-full bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Dedicated Shivam Webhook Configuration */}
        <div className="bg-white border border-[#E8DEC8] rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Webhook className="w-4 h-4 text-[#C5A059]" />
            <h2 className="text-sm font-bold text-[#0A251C] uppercase tracking-wider font-serif">
              Shivam Optics Unique Webhook URL
            </h2>
          </div>

          <p className="text-xs text-stone-500">
            Configure this endpoint in your Shiprocket Dashboard under <strong>Settings &gt; Webhooks</strong> to enable real-time tracking milestone synchronization into customer accounts and admin lab assembly.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Production Webhook URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-mono text-[11px] text-stone-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, "webhook")}
                  className="px-3 py-2 rounded-lg border border-[#E8DEC8] hover:bg-[#FAF7F2] text-stone-700 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Webhook Secret Key (Header: x-shiprocket-secret)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shippingConfig.shiprocketWebhookSecret || "shivam_shiprocket_sec_2026"}
                  onChange={(e) =>
                    setShippingConfig({ ...shippingConfig, shiprocketWebhookSecret: e.target.value })
                  }
                  className="flex-1 bg-[#FAF7F2] border border-[#E8DEC8] rounded-lg px-3 py-2 font-mono text-[11px] text-stone-900 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(shippingConfig.shiprocketWebhookSecret || "shivam_shiprocket_sec_2026", "secret")}
                  className="px-3 py-2 rounded-lg border border-[#E8DEC8] hover:bg-[#FAF7F2] text-stone-700 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Subscribed Logistics Events
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {["Order Picked Up", "In Transit", "Out for Delivery", "Delivered"].map((ev) => (
                  <div key={ev} className="flex items-center gap-1.5 p-2 rounded-lg bg-stone-50 border border-stone-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16803E]" />
                    <span className="font-medium text-stone-800">{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
