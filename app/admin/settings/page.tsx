"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
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
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  X,
  UserCheck,
  Smartphone,
  Eye,
  EyeOff,
  MessageSquare,
  RotateCcw,
  RefreshCw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StaffRole {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "general";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // General store settings state
  const [generalConfig, setGeneralConfig] = useState({
    storeName: "Shivam Opticals",
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

  // WhatsApp & Fast2SMS Auth State
  const [whatsappAuthConfig, setWhatsappAuthConfig] = useState({
    wacrmApiUrl: "https://broadcast.opticalmanager.in",
    wacrmApiKey: "",
    templateName: "wa_otp",
    templateLanguage: "en_US",
    whatsappEnabled: true,
    smsFallbackEnabled: true,
    fast2smsApiKey: "6bnxOW40vwCaHNIXuR2KdlSYq8pk1MJto5LeBDrPZ7GQ3cFyhz3i4WMem0lqVKJdvGp7YyaCb2ro8wzh",
    fast2smsRoute: "otp" as "otp" | "dlt",
    fast2smsSenderId: "",
    fast2smsTemplateId: "",
  });
  const [showWacrmKey, setShowWacrmKey] = useState(false);
  const [showFast2SmsKey, setShowFast2SmsKey] = useState(false);
  const [fast2smsWallet, setFast2smsWallet] = useState<{ wallet: number; smsCount: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [testMobile, setTestMobile] = useState("");
  const [testSending, setTestSending] = useState(false);

  const fetchFast2SmsWallet = async (keyOverride?: string) => {
    setWalletLoading(true);
    try {
      const q = keyOverride ? `?key=${encodeURIComponent(keyOverride)}` : "";
      const res = await fetch(`/api/admin/fast2sms/wallet${q}`);
      const data = await res.json();
      if (data.success) {
        setFast2smsWallet({ wallet: data.wallet, smsCount: data.smsCount });
      } else {
        setFast2smsWallet(null);
      }
    } catch {
      setFast2smsWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSendTestOtp = async () => {
    const cleanPhone = testMobile.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Invalid phone", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, channel: "sms" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Test OTP Dispatched!", {
          description: `SMS successfully sent via Fast2SMS to +91 ${cleanPhone.slice(-10)}`,
        });
        fetchFast2SmsWallet();
      } else {
        toast.error("Dispatch Failed", { description: data.error || "Unable to send SMS." });
      }
    } catch (e: any) {
      toast.error("Network Error", { description: e?.message || "Failed to reach server." });
    } finally {
      setTestSending(false);
    }
  };

  // Roles state
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<StaffRole>({
    name: "",
    email: "",
    role: "Optical Lab Technician",
    status: "Active",
  });

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load all settings from DB on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/settings?key=general").then((r) => r.json()),
      fetch("/api/admin/settings?key=store").then((r) => r.json()),
      fetch("/api/admin/settings?key=notifications").then((r) => r.json()),
      fetch("/api/admin/settings?key=roles").then((r) => r.json()),
      fetch("/api/admin/settings?key=whatsapp_auth").then((r) => r.json()),
    ])
      .then(([genData, storeData, notifData, rolesData, waData]) => {
        if (genData.success && genData.value) {
          setGeneralConfig((prev) => ({ ...prev, ...genData.value }));
        }
        if (storeData.success && storeData.value) {
          setStorePolicies((prev) => ({ ...prev, ...storeData.value }));
        }
        if (notifData.success && notifData.value) {
          setNotificationsConfig((prev) => ({ ...prev, ...notifData.value }));
        }
        if (waData.success && waData.value) {
          setWhatsappAuthConfig((prev) => ({ ...prev, ...waData.value }));
          fetchFast2SmsWallet(waData.value.fast2smsApiKey);
        } else {
          fetchFast2SmsWallet();
        }
        if (rolesData.success && Array.isArray(rolesData.value) && rolesData.value.length > 0) {
          setRoles(rolesData.value);
        } else {
          // Default initial roles if none stored yet
          setRoles([
            {
              id: "role-01",
              name: "Principal Executive",
              email: "executive@shivamoptics.in",
              role: "Super Admin",
              status: "Active",
            },
            {
              id: "role-02",
              name: "Master Optician & Lab Lead",
              email: "optometry@shivamoptics.in",
              role: "Master Optician & Lab Lead",
              status: "Active",
            },
            {
              id: "role-03",
              name: "Catalog Manager",
              email: "catalog@shivamoptics.in",
              role: "Catalog Manager",
              status: "Active",
            },
            {
              id: "role-04",
              name: "Order Fulfillment Manager",
              email: "fulfillment@shivamoptics.in",
              role: "Order Fulfillment Manager",
              status: "Active",
            },
          ]);
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

  const handleSaveGeneral = () => {
    saveSetting("general", generalConfig, "General boutique profile saved");
  };

  const handleSaveStorePolicies = () => {
    saveSetting("store", storePolicies, "Store & atelier policies saved");
  };

  const handleSaveNotifications = () => {
    saveSetting("notifications", notificationsConfig, "Notification channel preferences saved");
  };

  const handleSaveWhatsAppAuth = () => {
    saveSetting(
      "whatsapp_auth",
      whatsappAuthConfig,
      "WhatsApp OTP & SMS Fallback configuration saved"
    );
  };

  const handleSaveRoles = (updatedRoles: StaffRole[]) => {
    setRoles(updatedRoles);
    saveSetting("roles", updatedRoles, "Staff directory updated successfully");
  };

  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;

    const member: StaffRole = {
      ...newStaff,
      id: `role-${Date.now()}`,
    };
    const updated = [...roles, member];
    handleSaveRoles(updated);
    setIsAddStaffOpen(false);
    setNewStaff({
      name: "",
      email: "",
      role: "Optical Lab Technician",
      status: "Active",
    });
  };

  const handleDeleteStaffMember = (idx: number) => {
    const updated = roles.filter((_, i) => i !== idx);
    handleSaveRoles(updated);
  };

  const navItems = [
    { id: "general", label: "General Settings", icon: Sliders },
    { id: "whatsapp_auth", label: "WhatsApp & Auth OTP", icon: Smartphone },
    { id: "store", label: "Store & Atelier Policy", icon: Store },
    { id: "payments", label: "Payment Methods", icon: CreditCard, externalHref: "/admin/payments" },
    { id: "shipping", label: "Shipping & Transit", icon: Truck, externalHref: "/admin/shipping" },
    { id: "notifications", label: "Notification Channels", icon: Bell },
    { id: "roles", label: "Admin Users & Roles", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-3 border-b border-[#E8DCCF]">
        <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
          Administration Settings
        </h1>
        <p className="text-xs text-stone-500">
          Global boutique configuration, legal operating identities, and staff permissions
        </p>
      </div>

      {/* Two-Level Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Subnav */}
        <div className="md:col-span-1 space-y-1">
          <div className="bg-white border border-[#E8DCCF] rounded-xl p-2 shadow-2xs space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (item.externalHref) {
                return (
                  <Link
                    key={item.id}
                    href={item.externalHref}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-[#0A251C] hover:bg-stone-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-stone-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-[#FAF3EB] text-[#0A251C] font-bold border border-[#E8DCCF]"
                      : "text-stone-600 hover:text-[#0A251C] hover:bg-stone-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#C5A059]" : "text-stone-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Focused Content Area */}
        <div className="md:col-span-3">
          {activeTab === "general" && (
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-[#0A251C] font-serif">General Boutique Profile</h2>
                  <p className="text-xs text-stone-500">
                    Primary commercial identity printed on customer invoices and laboratory slips
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveGeneral}
                  disabled={savingKey === "general"}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {savingKey === "general" ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>Save</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Store / Atelier Legal Name
                  </label>
                  <input
                    type="text"
                    value={generalConfig.storeName}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, storeName: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Concierge Support Email
                  </label>
                  <input
                    type="email"
                    value={generalConfig.email}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, email: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Direct VIP Telephone
                  </label>
                  <input
                    type="text"
                    value={generalConfig.phone}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, phone: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={generalConfig.operatingHours}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, operatingHours: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">
                    Tagline & Atelier Mission
                  </label>
                  <input
                    type="text"
                    value={generalConfig.tagline}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, tagline: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">
                    Flagship Atelier Physical Address
                  </label>
                  <input
                    type="text"
                    value={generalConfig.address}
                    onChange={(e) =>
                      setGeneralConfig({ ...generalConfig, address: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "whatsapp_auth" && (
            <div className="space-y-6">
              {/* Card 1: WhatsApp Primary Channel via WACRM */}
              <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                        WhatsApp Authentication (WACRM Companion)
                      </h2>
                      <p className="text-xs text-stone-500">
                        Primary passwordless OTP channel powered by Meta WhatsApp Cloud API via WACRM
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveWhatsAppAuth}
                    disabled={savingKey === "whatsapp_auth"}
                    className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                  >
                    {savingKey === "whatsapp_auth" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>Save Config</span>
                  </Button>
                </div>

                {/* WhatsApp Channel Enable Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF]">
                  <div>
                    <label className="text-xs font-bold text-[#0A251C] block">
                      Enable WhatsApp OTP Channel
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Dispatches 6-digit verification codes using Meta pre-approved authentication templates
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappAuthConfig.whatsappEnabled}
                    onChange={(e) =>
                      setWhatsappAuthConfig({
                        ...whatsappAuthConfig,
                        whatsappEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#007AFF] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      WACRM API Base URL *
                    </label>
                    <input
                      type="url"
                      value={whatsappAuthConfig.wacrmApiUrl}
                      onChange={(e) =>
                        setWhatsappAuthConfig({
                          ...whatsappAuthConfig,
                          wacrmApiUrl: e.target.value,
                        })
                      }
                      placeholder="https://broadcast.opticalmanager.in"
                      className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Calls <code className="text-stone-600">/api/v1/messages</code> server-to-server. Never exposed to browser.
                    </p>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      WACRM API Secret Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showWacrmKey ? "text" : "password"}
                        value={whatsappAuthConfig.wacrmApiKey}
                        onChange={(e) =>
                          setWhatsappAuthConfig({
                            ...whatsappAuthConfig,
                            wacrmApiKey: e.target.value,
                          })
                        }
                        placeholder="wacrm_live_..."
                        className="w-full pl-3 pr-9 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWacrmKey(!showWacrmKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title={showWacrmKey ? "Mask key" : "Reveal key"}
                      >
                        {showWacrmKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Bearer token with <code className="text-stone-600">messages:send</code> scope. Stored securely in database.
                    </p>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Approved Meta Template Name
                    </label>
                    <input
                      type="text"
                      value={whatsappAuthConfig.templateName}
                      onChange={(e) =>
                        setWhatsappAuthConfig({
                          ...whatsappAuthConfig,
                          templateName: e.target.value,
                        })
                      }
                      placeholder="wa_otp"
                      className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Authentication template registered in Meta Business Manager with one-tap copy button.
                    </p>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Template Language Code
                    </label>
                    <input
                      type="text"
                      value={whatsappAuthConfig.templateLanguage}
                      onChange={(e) =>
                        setWhatsappAuthConfig({
                          ...whatsappAuthConfig,
                          templateLanguage: e.target.value,
                        })
                      }
                      placeholder="en_US"
                      className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Must match the approved language in WACRM (e.g. en_US).
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Fast2SMS Gateway (Bulk V2) */}
              <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C5A059]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                        SMS Gateway (Fast2SMS Bulk V2)
                      </h2>
                      <p className="text-xs text-stone-500">
                        High-throughput transactional SMS gateway for mobile OTPs &amp; instant failover
                      </p>
                    </div>
                  </div>

                  {/* Live Fast2SMS Wallet Balance Pill */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DCCF] text-[11px] font-mono flex items-center gap-1.5 text-stone-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {walletLoading ? (
                        <span className="flex items-center gap-1 text-stone-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Querying Fast2SMS...
                        </span>
                      ) : fast2smsWallet ? (
                        <span>
                          <strong className="text-stone-900 font-bold">₹{fast2smsWallet.wallet.toFixed(2)}</strong> balance
                          {" "}&bull;{" "}
                          <strong className="text-[#C5A059] font-bold">{fast2smsWallet.smsCount}</strong> credits
                        </span>
                      ) : (
                        <span className="text-stone-400">Balance unverified</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchFast2SmsWallet(whatsappAuthConfig.fast2smsApiKey)}
                      disabled={walletLoading}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      title="Refresh Fast2SMS Balance"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${walletLoading ? "animate-spin text-[#C5A059]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* SMS Channel Enable Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF]">
                  <div>
                    <label className="text-xs font-bold text-[#0A251C] block">
                      Enable SMS OTP Delivery
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Permits automatic failover when WhatsApp is unavailable and on-demand customer SMS dispatch
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappAuthConfig.smsFallbackEnabled}
                    onChange={(e) =>
                      setWhatsappAuthConfig({
                        ...whatsappAuthConfig,
                        smsFallbackEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#C5A059] cursor-pointer"
                  />
                </div>

                {/* Fast2SMS API Key Input */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-stone-700 font-semibold">
                      Fast2SMS API Secret Key *
                    </label>
                    <button
                      type="button"
                      onClick={() => fetchFast2SmsWallet(whatsappAuthConfig.fast2smsApiKey)}
                      className="text-[10px] text-[#C5A059] hover:underline font-medium cursor-pointer"
                    >
                      Test Key &amp; Refresh Credits
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFast2SmsKey ? "text" : "password"}
                      value={whatsappAuthConfig.fast2smsApiKey}
                      onChange={(e) =>
                        setWhatsappAuthConfig({
                          ...whatsappAuthConfig,
                          fast2smsApiKey: e.target.value,
                        })
                      }
                      placeholder="Enter 6bnx... API key"
                      className="w-full pl-3 pr-9 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFast2SmsKey(!showFast2SmsKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title={showFast2SmsKey ? "Mask key" : "Reveal key"}
                    >
                      {showFast2SmsKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Stored securely in database with fallback to <code className="text-stone-600 font-mono">FAST2SMS_API_KEY</code> in <code className="text-stone-600">.env.local</code>.
                  </p>
                </div>

                {/* Route Selection: Quick OTP vs. DLT Route */}
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <label className="block text-xs font-bold text-[#0A251C]">
                    SMS Routing Architecture
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Quick OTP Route Option */}
                    <div
                      onClick={() => setWhatsappAuthConfig({ ...whatsappAuthConfig, fast2smsRoute: "otp" })}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        whatsappAuthConfig.fast2smsRoute === "otp"
                          ? "border-[#C5A059] bg-amber-50/50 ring-1 ring-[#C5A059]"
                          : "border-[#E8DCCF] bg-[#FAF7F2] hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="fast2smsRoute"
                            checked={whatsappAuthConfig.fast2smsRoute === "otp"}
                            onChange={() => setWhatsappAuthConfig({ ...whatsappAuthConfig, fast2smsRoute: "otp" })}
                            className="accent-[#C5A059]"
                          />
                          Quick OTP Route
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                          Zero DLT Required
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Uses Fast2SMS transactional pipes to send 6-digit OTPs immediately with zero regulatory setup.
                      </p>
                    </div>

                    {/* DLT Route Option */}
                    <div
                      onClick={() => setWhatsappAuthConfig({ ...whatsappAuthConfig, fast2smsRoute: "dlt" })}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        whatsappAuthConfig.fast2smsRoute === "dlt"
                          ? "border-[#C5A059] bg-amber-50/50 ring-1 ring-[#C5A059]"
                          : "border-[#E8DCCF] bg-[#FAF7F2] hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="fast2smsRoute"
                            checked={whatsappAuthConfig.fast2smsRoute === "dlt"}
                            onChange={() => setWhatsappAuthConfig({ ...whatsappAuthConfig, fast2smsRoute: "dlt" })}
                            className="accent-[#C5A059]"
                          />
                          Enterprise DLT Route
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
                          TRAI Approved
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Sends branded SMS with your approved 6-character DLT Header and TRAI Content Template ID.
                      </p>
                    </div>
                  </div>

                  {/* DLT specific fields (conditionally enabled/visible) */}
                  {whatsappAuthConfig.fast2smsRoute === "dlt" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 p-3 bg-blue-50/40 rounded-lg border border-blue-200/60 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          DLT Approved Sender ID (Header) *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={whatsappAuthConfig.fast2smsSenderId}
                          onChange={(e) =>
                            setWhatsappAuthConfig({
                              ...whatsappAuthConfig,
                              fast2smsSenderId: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g. SHVOPT"
                          className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono uppercase"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          6-character alphabet header approved on your DLT portal (e.g. Jio/Vodafone/Airtel).
                        </p>
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          Fast2SMS Template / Message ID *
                        </label>
                        <input
                          type="text"
                          value={whatsappAuthConfig.fast2smsTemplateId}
                          onChange={(e) =>
                            setWhatsappAuthConfig({
                              ...whatsappAuthConfig,
                              fast2smsTemplateId: e.target.value,
                            })
                          }
                          placeholder="e.g. 129482"
                          className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] font-mono"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          Template ID registered in Fast2SMS mapped to your DLT Content Template.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Test OTP Dispatcher */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DCCF]">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#0A251C]">Test Live SMS Dispatch</h4>
                    <p className="text-[11px] text-stone-500">
                      Send an authentic verification test message to verify delivery
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      maxLength={10}
                      value={testMobile}
                      onChange={(e) => setTestMobile(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="10-digit mobile number"
                      className="w-36 px-2.5 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSendTestOtp}
                      disabled={testSending || testMobile.length < 10}
                      className="bg-[#0A251C] hover:bg-black text-white text-xs shrink-0 cursor-pointer"
                    >
                      {testSending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3 mr-1" />
                      )}
                      <span>Dispatch OTP</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card 3: Security & Rate Limiting Specifications */}
              <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl p-4 text-xs space-y-2 text-stone-600">
                <div className="flex items-center gap-2 font-bold text-[#0A251C]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enforced Security & Compliance Guardrails</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] list-disc list-inside text-stone-600 pt-1">
                  <li>6-digit cryptographically generated OTP (100,000 - 999,999)</li>
                  <li>Salted SHA-256 storage (zero plaintext OTP in database)</li>
                  <li>60-second cooldown per telephone number</li>
                  <li>Hourly limit: Maximum 6 verification attempts per mobile</li>
                  <li>5-minute expiration with 5 maximum failure attempts</li>
                  <li>Timing-safe equality comparisons against brute-force attacks</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-[#0A251C] font-serif">Store & Optical Policies</h2>
                  <p className="text-xs text-stone-500">
                    Prescription verification regulations and clinical warranty terms
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStorePolicies}
                  disabled={savingKey === "store"}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {savingKey === "store" ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>Save Policies</span>
                </Button>
              </div>

              <div className="space-y-3 text-xs pt-1">
                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <div className="font-bold text-[#0A251C]">
                      Mandatory Optician Verification for Rx &ge; 4.00 D
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Requires tele-optometry confirmation with patient before lab edging.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={storePolicies.mandatoryVerification}
                    onChange={(e) =>
                      setStorePolicies({ ...storePolicies, mandatoryVerification: e.target.checked })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <div className="font-bold text-[#0A251C]">
                      2-Year Titanium Frame Craftsmanship Warranty
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Complimentary screw tightening, ultrasonic bath, and nose pad replacements.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={storePolicies.titaniumWarranty}
                    onChange={(e) =>
                      setStorePolicies({ ...storePolicies, titaniumWarranty: e.target.checked })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <div className="font-bold text-[#0A251C]">
                      White-Glove Home Trial Program
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Allows VIP clients to sample up to 3 frames with refundable deposit.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={storePolicies.whiteGloveTrial}
                    onChange={(e) =>
                      setStorePolicies({ ...storePolicies, whiteGloveTrial: e.target.checked })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <div className="font-bold text-[#0A251C]">
                      Complimentary Bespoke Case & Microfiber Cleaning Cloth
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      Shipped standard with every verified optical and sunglass checkout.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={storePolicies.complimentaryCaseAndCloth}
                    onChange={(e) =>
                      setStorePolicies({
                        ...storePolicies,
                        complimentaryCaseAndCloth: e.target.checked,
                      })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-[#0A251C] font-serif">Automated Notification Channels</h2>
                  <p className="text-xs text-stone-500">
                    Patron updates dispatched during laboratory edging and courier transit
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveNotifications}
                  disabled={savingKey === "notifications"}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {savingKey === "notifications" ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>Save Notifications</span>
                </Button>
              </div>

              <div className="space-y-2.5 text-xs pt-1">
                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0A251C] block">
                      Order Placement Email with High-Res Receipt
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Dispatched instantly to guest/member email upon transaction confirmation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.orderEmail}
                    onChange={(e) =>
                      setNotificationsConfig({ ...notificationsConfig, orderEmail: e.target.checked })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0A251C] block">
                      WhatsApp Lab Milestone Notification
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Sends video/photo verification when frame passes optician lens edging & QC
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.labAssemblyWhatsApp}
                    onChange={(e) =>
                      setNotificationsConfig({
                        ...notificationsConfig,
                        labAssemblyWhatsApp: e.target.checked,
                      })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0A251C] block">
                      Courier Dispatch & Out-for-Delivery SMS
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Sends real-time BlueDart/Delhivery tracking link directly to patron mobile
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.dispatchSms}
                    onChange={(e) =>
                      setNotificationsConfig({
                        ...notificationsConfig,
                        dispatchSms: e.target.checked,
                      })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0A251C] block">
                      Internal Low-Stock Staff Alerts
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Alerts master optician when luxury frames hit 5 or fewer units in inventory
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.lowStockStaffAlert}
                    onChange={(e) =>
                      setNotificationsConfig({
                        ...notificationsConfig,
                        lowStockStaffAlert: e.target.checked,
                      })
                    }
                    className="rounded text-[#C5A059]"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                    Administrative Staff & Security Roles
                  </h2>
                  <p className="text-xs text-stone-500">
                    Manage personnel access, laboratory opticians, and catalog privileges
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddStaffOpen(true)}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Team Member</span>
                </Button>
              </div>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      <th className="pb-2.5">Staff Member</th>
                      <th className="pb-2.5">Email</th>
                      <th className="pb-2.5">Role</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {roles.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-2.5 font-bold text-[#0A251C]">{r.name}</td>
                        <td className="py-2.5 text-stone-600 font-mono text-[11px]">{r.email}</td>
                        <td className="py-2.5 font-medium text-stone-800">{r.role}</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {r.status || "Active"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteStaffMember(idx)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Staff Modal */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#C5A059]" />
                        <h3 className="text-sm font-bold text-[#0A251C]">Add Staff Member</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddStaffOpen(false)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleAddStaffMember} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                          placeholder="e.g. Vikramaditya Rathore"
                          className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          Atelier Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          placeholder="e.g. v.rathore@shivamoptics.in"
                          className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          Assigned Role & Department
                        </label>
                        <select
                          value={newStaff.role}
                          onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Master Optician & Lab Lead">Master Optician & Lab Lead</option>
                          <option value="Optical Lab Technician">Optical Lab Technician</option>
                          <option value="Catalog Manager">Catalog Manager</option>
                          <option value="Order Fulfillment Manager">Order Fulfillment Manager</option>
                          <option value="Boutique Concierge">Boutique Concierge</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddStaffOpen(false)}
                          className="text-xs bg-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                        >
                          Add & Save Role
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
