"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  Calendar,
  LogOut,
  Phone,
  Mail,
  Clock,
  Truck,
  Glasses,
  ChevronRight,
  ShieldCheck,
  Plus,
  Loader2,
  Printer,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/AuthForm";
import { ShippingAddress, PrescriptionData } from "@/types";

type AccountTab = "orders" | "prescriptions" | "consultations" | "addresses" | "loyalty";

interface UserOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_id?: string;
  payment_details?: any;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  total_amount: number;
  subtotal?: number;
  shipping_fee?: number;
  discount_amount?: number;
  coupon_code?: string;
  tracking_number?: string;
  courier_partner?: string;
  estimated_delivery?: string;
  shipping_address?: any;
  items?: Array<{
    id?: string;
    product_name?: string;
    brand?: string;
    color?: string;
    lens_package?: string;
    quantity?: number;
    unit_price?: number;
    lens_price?: number;
    total_price?: number;
    prescription?: any;
    images?: string[];
  }>;
}

interface UserAppointment {
  id: string;
  booking_reference: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  store_location: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface UserPrescription {
  id: string;
  title: string;
  doctor?: string;
  date?: string;
  rightEye: { sph: string; cyl: string; axis: string; add?: string | null };
  leftEye: { sph: string; cyl: string; axis: string; add?: string | null };
  pd: string;
  orderNumber?: string;
}

function AccountDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isLoggedIn,
    logout,
    openAppointmentModal,
    saveShippingAddress,
    deleteSavedAddress,
    savePrescription: authSavePrescription,
    removePrescription: authRemovePrescription,
    updateUserProfile,
    openTrackingModal,
  } = useAuth();

  const tabParam = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(tabParam);

  useEffect(() => {
    const t = searchParams.get("tab") as AccountTab;
    if (t && ["orders", "prescriptions", "consultations", "addresses", "loyalty"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // -------------------------------------------------------------
  // Profile Edit Modal State
  // -------------------------------------------------------------
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user?.name, user?.email]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    updateUserProfile({ name: profileForm.name.trim(), email: profileForm.email.trim() });
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: user?.phone,
        }),
      });
      toast.success("Profile details updated successfully");
      setIsEditingProfile(false);
    } catch {
      toast.success("Profile saved locally");
      setIsEditingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // 1. Orders & Tracking State (Real user data only)
  // -------------------------------------------------------------
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<UserOrder | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    setLoadingOrders(true);
    const params = new URLSearchParams();
    if (user?.phone) params.set("phone", user.phone);
    if (user?.email) params.set("email", user.email);
    if (user?.id && user.id.length >= 20) params.set("customerId", user.id);

    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch user orders:", err);
        setOrders([]);
      })
      .finally(() => setLoadingOrders(false));
  }, [isLoggedIn, user?.phone, user?.email, user?.id]);

  // -------------------------------------------------------------
  // 2. Saved Delivery Addresses State (Strictly user-entered, NO owner address)
  // -------------------------------------------------------------
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);

  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    streetAddress: "",
    city: "New Delhi",
    state: "Delhi",
    pincode: "",
    country: "India",
  });

  const fetchAddresses = () => {
    if (!isLoggedIn) return;
    setLoadingAddresses(true);

    const params = new URLSearchParams();
    if (user?.id && user.id.length >= 20) params.set("userId", user.id);
    if (user?.phone) params.set("phone", user.phone);
    if (user?.email) params.set("email", user.email);

    fetch(`/api/user/addresses?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.addresses)) {
          // Sanitize out any legacy store address remnants
          const clean = data.addresses.filter(
            (a: any) =>
              !a.streetAddress?.toLowerCase().includes("kanishka") &&
              !a.phone?.includes("097799 90207")
          );
          setAddresses(clean);
        } else if (user?.savedAddresses && user.savedAddresses.length > 0) {
          const cleanLocal = user.savedAddresses.filter(
            (a) =>
              !a.streetAddress?.toLowerCase().includes("kanishka") &&
              !a.phone?.includes("097799 90207")
          );
          setAddresses(cleanLocal);
        } else {
          setAddresses([]);
        }
      })
      .catch(() => {
        const cleanLocal = (user?.savedAddresses || []).filter(
          (a) =>
            !a.streetAddress?.toLowerCase().includes("kanishka") &&
            !a.phone?.includes("097799 90207")
        );
        setAddresses(cleanLocal);
      })
      .finally(() => setLoadingAddresses(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, [isLoggedIn, user?.phone, user?.email, user?.id]);

  const handleOpenAddAddress = () => {
    setAddressForm({
      fullName: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      streetAddress: "",
      city: "New Delhi",
      state: "Delhi",
      pincode: "",
      country: "India",
    });
    setEditingAddressIdx(null);
    setIsAddingAddress(true);
  };

  const handleOpenEditAddress = (addr: ShippingAddress, idx: number) => {
    setAddressForm({ ...addr });
    setEditingAddressIdx(idx);
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName?.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (!addressForm.phone?.trim()) {
      toast.error("Please enter contact phone number");
      return;
    }
    if (!addressForm.streetAddress?.trim()) {
      toast.error("Please enter street address");
      return;
    }
    if (!addressForm.pincode?.trim() || addressForm.pincode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit postal pincode");
      return;
    }

    // Save in AuthContext
    saveShippingAddress(addressForm);

    // Save via API
    try {
      await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          phone: user?.phone,
          email: user?.email,
          address: addressForm,
        }),
      });
    } catch {}

    toast.success(editingAddressIdx !== null ? "Address updated" : "Delivery address added");
    setIsAddingAddress(false);
    setEditingAddressIdx(null);
    fetchAddresses();
  };

  const handleDeleteAddress = async (idx: number, addr: ShippingAddress) => {
    deleteSavedAddress(idx);
    if (addr.id) {
      try {
        await fetch(`/api/user/addresses?id=${addr.id}&userId=${user?.id || ""}`, {
          method: "DELETE",
        });
      } catch {}
    }
    setAddresses((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Address removed");
  };

  // -------------------------------------------------------------
  // 3. Clinical Prescriptions State (Strictly user-entered, NO fake Rx)
  // -------------------------------------------------------------
  const [prescriptions, setPrescriptions] = useState<UserPrescription[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [isAddingRx, setIsAddingRx] = useState(false);
  const [rxForm, setRxForm] = useState({
    title: "Distance & Daily Vision",
    doctor: "",
    pd: "63.0",
    rightEye: { sph: "0.00", cyl: "0.00", axis: "0", add: "" },
    leftEye: { sph: "0.00", cyl: "0.00", axis: "0", add: "" },
  });

  const fetchPrescriptions = () => {
    if (!isLoggedIn) return;
    setLoadingRx(true);

    const params = new URLSearchParams();
    if (user?.id && user.id.length >= 20) params.set("userId", user.id);
    if (user?.phone) params.set("phone", user.phone);
    if (user?.email) params.set("email", user.email);

    fetch(`/api/user/prescriptions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.prescriptions)) {
          setPrescriptions(data.prescriptions);
        } else if (user?.savedPrescriptions && user.savedPrescriptions.length > 0) {
          setPrescriptions(
            user.savedPrescriptions.map((sp) => ({
              id: sp.id,
              title: sp.title,
              doctor: sp.doctorName,
              date: sp.date,
              rightEye: {
                sph: sp.data.rightEye.sph || "0.00",
                cyl: sp.data.rightEye.cyl || "0.00",
                axis: sp.data.rightEye.axis || "0",
                add: sp.data.rightEye.add || null,
              },
              leftEye: {
                sph: sp.data.leftEye.sph || "0.00",
                cyl: sp.data.leftEye.cyl || "0.00",
                axis: sp.data.leftEye.axis || "0",
                add: sp.data.leftEye.add || null,
              },
              pd: sp.data.pd || "63.0",
            }))
          );
        } else {
          setPrescriptions([]);
        }
      })
      .catch(() => {
        setPrescriptions([]);
      })
      .finally(() => setLoadingRx(false));
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [isLoggedIn, user?.phone, user?.email, user?.id]);

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxForm.title.trim()) {
      toast.error("Please enter a label for this prescription (e.g. Daily Glasses)");
      return;
    }

    const newPrescriptionData: PrescriptionData = {
      rightEye: rxForm.rightEye,
      leftEye: rxForm.leftEye,
      pd: rxForm.pd,
      doctor: rxForm.doctor.trim() || undefined,
      date: new Date().toISOString().split("T")[0],
    };

    authSavePrescription(rxForm.title.trim(), newPrescriptionData, rxForm.doctor.trim());
    toast.success("Prescription record saved successfully");
    setIsAddingRx(false);
    fetchPrescriptions();
  };

  const handleDeletePrescription = (id: string) => {
    authRemovePrescription(id);
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prescription removed");
  };

  // -------------------------------------------------------------
  // 4. Consultations / Eye Test Appointments State
  // -------------------------------------------------------------
  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    setLoadingAppointments(true);
    const params = new URLSearchParams();
    if (user?.phone) params.set("phone", user.phone);
    if (user?.email) params.set("email", user.email);

    fetch(`/api/user/appointments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        } else {
          setAppointments([]);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch appointments:", err);
        setAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  }, [isLoggedIn, user?.phone, user?.email]);

  const handleCancelAppointment = async (aptId: string) => {
    try {
      const res = await fetch("/api/user/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: aptId, status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Appointment consultation cancelled");
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: "cancelled" } : a))
        );
      } else {
        toast.error(data.error || "Failed to cancel appointment");
      }
    } catch {
      toast.error("Unable to update appointment status");
    }
  };

  // -------------------------------------------------------------
  // 5. Dynamic Privilege / Loyalty Calculation (Strictly Admin-Configured, Zero Fake Data)
  // -------------------------------------------------------------
  const [adminLoyaltyConfig, setAdminLoyaltyConfig] = useState<{
    enabled: boolean;
    enablePointsEarning?: boolean;
    earnRatePercent: number;
    minOrderAmountToEarn: number;
    pointsToRupeeRatio: number;
    allowRedemption: boolean;
    tiers: Array<{ name: string; minSpend: number }>;
    privileges: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => {
        if (data?.loyalty) {
          setAdminLoyaltyConfig(data.loyalty);
        }
      })
      .catch(() => {});
  }, []);

  const loyaltyMetrics = useMemo(() => {
    const totalSpend = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalOrdersCount = orders.length;

    const earnRate = adminLoyaltyConfig?.earnRatePercent ?? 1;
    const ratio = adminLoyaltyConfig?.pointsToRupeeRatio ?? 1;
    const isProgramActive = adminLoyaltyConfig?.enabled !== false;
    const isEarningActive =
      isProgramActive &&
      adminLoyaltyConfig?.enablePointsEarning !== false &&
      earnRate > 0;

    const points = isEarningActive
      ? (user?.gemPoints !== undefined ? user.gemPoints : Math.round((totalSpend * earnRate) / 100))
      : (user?.gemPoints || 0);
    const creditValue = points * ratio;

    const tiers = adminLoyaltyConfig?.tiers || [
      { name: "Privilege Member", minSpend: 0 },
      { name: "Gold Member", minSpend: 5000 },
      { name: "Platinum Member", minSpend: 15000 },
    ];

    const sortedTiers = [...tiers].sort((a, b) => a.minSpend - b.minSpend);

    let activeTier = sortedTiers[0]?.name || "Privilege Member";
    let nextTier = sortedTiers[1] || null;
    let nextMilestone = "Place your first order to unlock higher member tiers.";
    let progressPct = 0;

    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalSpend >= sortedTiers[i].minSpend) {
        activeTier = sortedTiers[i].name;
        nextTier = sortedTiers[i + 1] || null;
        break;
      }
    }

    if (nextTier) {
      const remaining = Math.max(0, nextTier.minSpend - totalSpend);
      nextMilestone = `Spend ${formatCurrency(remaining)} more to achieve ${nextTier.name}.`;
      progressPct = Math.min(100, Math.round((totalSpend / nextTier.minSpend) * 100));
    } else {
      nextMilestone = "Highest VIP member status unlocked.";
      progressPct = 100;
    }

    return {
      totalSpend,
      totalOrdersCount,
      points,
      creditValue,
      tierTitle: activeTier,
      nextMilestone,
      progressPct,
      isProgramActive,
      privileges: adminLoyaltyConfig?.privileges || [],
    };
  }, [orders, user?.gemPoints, adminLoyaltyConfig]);

  // If user is not logged in, render authentication gate
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-[#FCFAF7] rounded-3xl border border-[#E8DEC8] p-6 sm:p-8 shadow-sm">
          <AuthForm mode="page" returnUrl="/account" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Patron Header Banner */}
      <section className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold">
              <Link href="/" className="hover:text-[#0A251C] transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#C5A059] font-bold">My Account</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
                Welcome, {user?.name || "Valued Patron"}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E8DEC8] bg-white text-stone-700 hover:text-[#0A251C] hover:border-[#C5A059] transition cursor-pointer"
                title="Edit Profile"
              >
                <Edit2 className="w-3 h-3 text-[#C5A059]" />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
              {user?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{user.phone}</span>
                </span>
              )}
              {user?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{user.email}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0A251C] text-[#C5A059]">
                <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{loyaltyMetrics.tierTitle}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAppointmentModal}
              className="py-2.5 px-4 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Eye Test</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* Profile Edit Modal Dialog */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E8DEC8] max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
              <h3 className="font-serif font-bold text-lg text-[#0A251C]">Edit Profile Information</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your Full Name"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Phone Number (Verified)
                </label>
                <input
                  type="text"
                  value={user?.phone || ""}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-xs cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DEC8]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Main Account Dashboard Grid */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Rails: Horizontal snap rail on mobile, sticky sidebar on lg+ */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 w-full">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-2 sm:p-3 shadow-xs flex flex-row overflow-x-auto lg:flex-col gap-1.5 lg:space-y-1 scrollbar-none snap-x snap-mandatory">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`shrink-0 snap-start px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "orders"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders &amp; Tracking</span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("prescriptions")}
                className={`shrink-0 snap-start px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "prescriptions"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Glasses className="w-4 h-4" />
                  <span>Prescriptions</span>
                </div>
                {prescriptions.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                    {prescriptions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("consultations")}
                className={`shrink-0 snap-start px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "consultations"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Consultations</span>
                </div>
                {appointments.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                    {appointments.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className={`shrink-0 snap-start px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "addresses"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Addresses</span>
                </div>
                {addresses.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                    {addresses.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("loyalty")}
                className={`shrink-0 snap-start px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "loyalty"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Privilege &amp; Rewards</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* ============================================================== */}
            {/* 1. ORDERS & TRACKING TAB (Real User Data Only) */}
            {/* ============================================================== */}
            {activeTab === "orders" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Order History &amp; Tracking
                    </h2>
                    <p className="text-xs text-stone-500">
                      Live status of your certified eyewear orders, clinical lens assembly, and insured courier delivery
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs font-bold text-[#0A251C] hover:text-[#C5A059] uppercase tracking-wider flex items-center gap-1 transition"
                  >
                    <span>Browse Catalog</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center text-xs text-stone-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5A059]" />
                    <span>Loading your orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#0A251C]">
                      No Optical Orders Recorded Yet
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      When you purchase frames or prescription eyewear at Shivam Optical, your order lifecycle and tracking will appear right here.
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex py-2.5 px-6 rounded-xl bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition"
                    >
                      Explore Frames
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id || ord.order_number}
                        className="bg-white rounded-2xl border border-[#E8DEC8] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#C5A059]/40 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DEC8]/60 pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                              ORDER REFERENCE
                            </span>
                            <h3 className="font-mono font-bold text-sm text-[#0A251C]">
                              {ord.order_number}
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              Placed on{" "}
                              {new Date(ord.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF3EB] text-[#0A251C] border border-[#E8DEC8]">
                              <Clock className="w-3 h-3 mr-1 text-[#C5A059]" />
                              <span className="capitalize">{ord.status?.replace("_", " ")}</span>
                            </span>
                            <span className="font-mono font-bold text-sm text-[#0A251C]">
                              {formatCurrency(ord.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="space-y-2">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                                  <span className="font-medium text-[#0A251C]">
                                    {it.product_name || "Optical Frame"}
                                  </span>
                                  {it.color && <span className="text-stone-400">• {it.color}</span>}
                                  {it.lens_package && (
                                    <span className="text-stone-500 italic">({it.lens_package})</span>
                                  )}
                                </div>
                                <span className="font-mono text-stone-600">Qty: {it.quantity || 1}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-stone-500">Eyewear Frame &amp; Precision Lenses</p>
                          )}
                        </div>

                        {/* Shipping & Stepper Preview */}
                        <div className="pt-2 border-t border-[#E8DEC8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#C5A059]" />
                            <span>
                              Courier: <strong>{ord.courier_partner || "BlueDart Express"}</strong>
                            </span>
                            {ord.tracking_number && (
                              <span className="font-mono text-stone-500">({ord.tracking_number})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceOrder(ord)}
                              className="text-[11px] font-bold text-[#0A251C] hover:text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer px-3 py-1.5 rounded-lg border border-[#E8DEC8] hover:border-[#C5A059] bg-[#FAF7F2] shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>View Tax Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 2. PRESCRIPTIONS TAB (Real User Data Only) */}
            {/* ============================================================== */}
            {activeTab === "prescriptions" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Clinical Eye Prescriptions
                    </h2>
                    <p className="text-xs text-stone-500">
                      Certified ophthalmic records for precision digital lens surfacing
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingRx(!isAddingRx)}
                    className="py-2 px-3.5 rounded-xl bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingRx ? "Cancel" : "Add Prescription"}</span>
                  </button>
                </div>

                {/* Add Prescription Form */}
                {isAddingRx && (
                  <form
                    onSubmit={handleSavePrescription}
                    className="bg-white rounded-2xl border border-[#C5A059] p-5 sm:p-6 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
                      <h4 className="font-serif font-bold text-sm text-[#0A251C]">
                        Enter New Eye Prescription
                      </h4>
                      <span className="text-[10px] text-stone-400">OD = Right Eye, OS = Left Eye</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Prescription Label *
                        </label>
                        <input
                          type="text"
                          value={rxForm.title}
                          onChange={(e) => setRxForm({ ...rxForm, title: e.target.value })}
                          placeholder="e.g. Distance / Computer Glasses"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Doctor / Optometrist Name
                        </label>
                        <input
                          type="text"
                          value={rxForm.doctor}
                          onChange={(e) => setRxForm({ ...rxForm, doctor: e.target.value })}
                          placeholder="e.g. Dr. K. Sharma / Shivam Clinic"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                        />
                      </div>
                    </div>

                    {/* OD / OS diopter table inputs */}
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-xs text-center border-collapse">
                        <thead>
                          <tr className="bg-[#FAF7F2] text-stone-600 uppercase text-[10px] font-bold">
                            <th className="py-2 px-2 text-left">Eye</th>
                            <th className="py-2 px-2">Sphere (SPH)</th>
                            <th className="py-2 px-2">Cylinder (CYL)</th>
                            <th className="py-2 px-2">Axis (°)</th>
                            <th className="py-2 px-2">Add (Near)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          <tr>
                            <td className="py-2 px-2 text-left font-bold text-[#0A251C]">Right Eye (OD)</td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.rightEye.sph}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    rightEye: { ...rxForm.rightEye, sph: e.target.value },
                                  })
                                }
                                placeholder="-1.25"
                                className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.rightEye.cyl}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    rightEye: { ...rxForm.rightEye, cyl: e.target.value },
                                  })
                                }
                                placeholder="-0.50"
                                className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.rightEye.axis}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    rightEye: { ...rxForm.rightEye, axis: e.target.value },
                                  })
                                }
                                placeholder="90"
                                className="w-16 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.rightEye.add || ""}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    rightEye: { ...rxForm.rightEye, add: e.target.value },
                                  })
                                }
                                placeholder="+1.50"
                                className="w-16 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 text-left font-bold text-[#0A251C]">Left Eye (OS)</td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.leftEye.sph}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    leftEye: { ...rxForm.leftEye, sph: e.target.value },
                                  })
                                }
                                placeholder="-1.50"
                                className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.leftEye.cyl}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    leftEye: { ...rxForm.leftEye, cyl: e.target.value },
                                  })
                                }
                                placeholder="-0.50"
                                className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.leftEye.axis}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    leftEye: { ...rxForm.leftEye, axis: e.target.value },
                                  })
                                }
                                placeholder="85"
                                className="w-16 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={rxForm.leftEye.add || ""}
                                onChange={(e) =>
                                  setRxForm({
                                    ...rxForm,
                                    leftEye: { ...rxForm.leftEye, add: e.target.value },
                                  })
                                }
                                placeholder="+1.50"
                                className="w-16 px-2 py-1 rounded-lg border border-stone-300 text-center font-mono text-xs"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Pupillary Distance (PD mm)
                        </label>
                        <input
                          type="text"
                          value={rxForm.pd}
                          onChange={(e) => setRxForm({ ...rxForm, pd: e.target.value })}
                          placeholder="63.0"
                          className="w-24 px-3 py-1.5 rounded-xl border border-stone-300 text-center font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DEC8]">
                      <button
                        type="button"
                        onClick={() => setIsAddingRx(false)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition cursor-pointer"
                      >
                        Save Prescription
                      </button>
                    </div>
                  </form>
                )}

                {loadingRx ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center text-xs text-stone-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5A059]" />
                    <span>Loading prescriptions...</span>
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
                      <Glasses className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#0A251C]">
                      No Optical Prescriptions on Record
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      You haven&apos;t added any optical prescriptions yet. Add your doctor&apos;s prescription values or customize lenses when ordering any frame to store them here.
                    </p>
                    <button
                      onClick={() => setIsAddingRx(true)}
                      className="inline-flex py-2.5 px-6 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition cursor-pointer"
                    >
                      + Add Prescription
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4 hover:border-[#C5A059]/40 transition"
                      >
                        <div className="flex items-center justify-between border-b border-[#E8DEC8]/60 pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                              ACTIVE OPHTHALMIC RECORD
                            </span>
                            <h3 className="font-serif font-bold text-base text-[#0A251C]">
                              {rx.title}
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              {rx.doctor || "Certified Optometrist"} {rx.date ? `• Recorded on ${rx.date}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                              Verified Rx
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePrescription(rx.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 transition cursor-pointer"
                              title="Delete Prescription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Prescription Matrix Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-center text-xs">
                            <thead className="bg-[#FAF7F2] text-stone-600 uppercase tracking-wider">
                              <tr>
                                <th className="py-2.5 px-4 text-left font-bold">Eye</th>
                                <th className="py-2.5 px-4 font-bold">Sphere (SPH)</th>
                                <th className="py-2.5 px-4 font-bold">Cylinder (CYL)</th>
                                <th className="py-2.5 px-4 font-bold">Axis</th>
                                {rx.rightEye?.add && <th className="py-2.5 px-4 font-bold">Add</th>}
                                <th className="py-2.5 px-4 font-bold">Pupil Distance (PD)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8DEC8]">
                              <tr>
                                <td className="py-3 px-4 text-left font-bold text-[#0A251C]">Right Eye (OD)</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.rightEye?.sph || "0.00"}</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.rightEye?.cyl || "0.00"}</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.rightEye?.axis || "0"}°</td>
                                {rx.rightEye?.add && (
                                  <td className="py-3 px-4 font-mono font-medium">{rx.rightEye.add}</td>
                                )}
                                <td className="py-3 px-4 font-mono font-medium" rowSpan={2}>
                                  {rx.pd || "63.0"} mm
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 text-left font-bold text-[#0A251C]">Left Eye (OS)</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.leftEye?.sph || "0.00"}</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.leftEye?.cyl || "0.00"}</td>
                                <td className="py-3 px-4 font-mono font-medium">{rx.leftEye?.axis || "0"}°</td>
                                {rx.leftEye?.add && (
                                  <td className="py-3 px-4 font-mono font-medium">{rx.leftEye.add}</td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="p-4 bg-[#FAF3EB] rounded-xl border border-[#E8DEC8] flex items-center gap-3 text-xs text-stone-600">
                          <ShieldCheck className="w-5 h-5 text-[#C5A059] shrink-0" />
                          <span>
                            Prescriptions are calibrated at our Mayur Vihar computerized optical laboratory with ±0.05 D tolerance.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 3. CONSULTATIONS TAB (Real User Bookings Only) */}
            {/* ============================================================== */}
            {activeTab === "consultations" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Mayur Vihar Eye Test Consultations
                    </h2>
                    <p className="text-xs text-stone-500">
                      Reserved eye examination appointments and clinical eyewear styling sessions
                    </p>
                  </div>
                  <button
                    onClick={openAppointmentModal}
                    className="py-2 px-3.5 rounded-xl bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                </div>

                {loadingAppointments ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center text-xs text-stone-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5A059]" />
                    <span>Loading consultations...</span>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#0A251C]">
                      No Consultations Scheduled
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      You don&apos;t have any upcoming eye test consultations or styling appointments at our Mayur Vihar store.
                    </p>
                    <button
                      onClick={openAppointmentModal}
                      className="inline-flex py-2.5 px-6 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition cursor-pointer"
                    >
                      Book Free Eye Test
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id || apt.booking_reference}
                        className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4 hover:border-[#C5A059]/40 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E8DEC8]/60 pb-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                              REF: {apt.booking_reference}
                            </span>
                            <h3 className="font-serif font-bold text-base text-[#0A251C]">
                              {apt.service || "Comprehensive Eye Test & Lens Fitting"}
                            </h3>
                            <p className="text-xs text-stone-600 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>{apt.store_location || "Mayur Vihar Phase 1 Store"}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                apt.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : apt.status === "completed"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : apt.status === "cancelled"
                                  ? "bg-stone-100 text-stone-500 border border-stone-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {apt.status}
                            </span>
                            {apt.status !== "cancelled" && apt.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="text-[11px] font-semibold text-stone-400 hover:text-red-600 transition cursor-pointer px-2 py-1"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                            <span className="text-stone-400 block text-[10px] uppercase">Appointment Date &amp; Slot</span>
                            <span className="font-bold text-[#0A251C]">
                              {new Date(apt.date).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              • {apt.time}
                            </span>
                          </div>
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                            <span className="text-stone-400 block text-[10px] uppercase">Service Specialist</span>
                            <span className="font-bold text-[#0A251C]">Senior Optometrist In-Charge</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 4. SAVED DELIVERY ADDRESSES TAB (User Data Only, NO Owner Address) */}
            {/* ============================================================== */}
            {activeTab === "addresses" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-stone-500">
                      Your saved shipping destinations for insured courier delivery
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddAddress}
                    className="py-2 px-3.5 rounded-xl bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Add / Edit Address Form */}
                {isAddingAddress && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="bg-white rounded-2xl border border-[#C5A059] p-5 sm:p-6 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
                      <h4 className="font-serif font-bold text-sm text-[#0A251C]">
                        {editingAddressIdx !== null ? "Edit Delivery Address" : "Add New Delivery Address"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Recipient Full Name *
                        </label>
                        <input
                          type="text"
                          value={addressForm.fullName || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          placeholder="e.g. Gaurav Sharma"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Contact Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={addressForm.phone || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          placeholder="e.g. 9810012345"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                        Street Address / Flat / Building / Landmark *
                      </label>
                      <input
                        type="text"
                        value={addressForm.streetAddress || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                        placeholder="e.g. Flat 302, Green Avenue, Near Samachar Market"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={addressForm.city || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="e.g. New Delhi"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          value={addressForm.state || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          placeholder="e.g. Delhi"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-[#C5A059] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={addressForm.pincode || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          placeholder="6 digits"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:border-[#C5A059] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DEC8]">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {loadingAddresses ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center text-xs text-stone-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5A059]" />
                    <span>Loading saved addresses...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mx-auto">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#0A251C]">
                      No Saved Delivery Addresses
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      You haven&apos;t saved any delivery addresses yet. Addresses you enter at checkout or add here will appear for fast 1-click dispatch.
                    </p>
                    <button
                      onClick={handleOpenAddAddress}
                      className="inline-flex py-2.5 px-6 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider hover:bg-black transition cursor-pointer"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className="bg-white rounded-2xl border border-[#E8DEC8] p-5 shadow-xs space-y-3 relative hover:border-[#C5A059]/60 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            {idx === 0 ? "PRIMARY DELIVERY ADDRESS" : `SAVED ADDRESS ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr, idx)}
                              className="p-1 text-stone-400 hover:text-[#0A251C] transition cursor-pointer"
                              title="Edit Address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(idx, addr)}
                              className="p-1 text-stone-400 hover:text-red-500 transition cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-stone-700 space-y-1">
                          <p className="font-bold text-[#0A251C] text-sm">
                            {addr.fullName || user?.name || "Recipient"}
                          </p>
                          <p className="text-stone-600 leading-relaxed">{addr.streetAddress}</p>
                          <p className="text-stone-600">
                            {addr.city}, {addr.state} - <span className="font-mono font-medium">{addr.pincode}</span>
                          </p>
                          {addr.phone && <p className="text-stone-400">Phone: {addr.phone}</p>}
                        </div>

                        {idx === 0 && (
                          <div className="pt-2 border-t border-[#E8DEC8]/60 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Default Delivery Address</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 5. PRIVILEGE & REWARDS TAB (Strictly Admin-Controlled, Zero AI Logo, Zero Fake Claims) */}
            {/* ============================================================== */}
            {activeTab === "loyalty" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-3">
                  <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                    Privilege Club &amp; Rewards
                  </h2>
                  <p className="text-xs text-stone-500">
                    Real-time patronage tier, rewards credit balance, and verified benefits
                  </p>
                </div>

                {!loyaltyMetrics.isProgramActive ? (
                  <div className="bg-white rounded-2xl border border-[#E8DEC8] p-8 text-center space-y-2">
                    <Award className="w-8 h-8 text-stone-400 mx-auto" />
                    <h3 className="font-serif font-bold text-base text-[#0A251C]">
                      Rewards Program Inactive
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      The rewards and privilege club is currently paused by store administration.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#0A251C] to-[#16382C] rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
                          PRIVILEGE STATUS
                        </span>
                        <h3 className="text-2xl font-serif font-bold text-white mt-1">
                          {loyaltyMetrics.tierTitle}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-[#C5A059]/40">
                        <Award className="w-5 h-5 text-[#C5A059]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-stone-300 block text-[10px] uppercase">Available Rewards Credit</span>
                        <span className="text-2xl font-mono font-bold text-[#C5A059]">
                          {formatCurrency(loyaltyMetrics.creditValue)}
                        </span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">
                          {loyaltyMetrics.creditValue > 0
                            ? `${loyaltyMetrics.points} Points`
                            : adminLoyaltyConfig?.enablePointsEarning !== false
                            ? "Accrues on verified orders"
                            : "Points earning inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-300 block text-[10px] uppercase">Lifetime Orders</span>
                        <span className="text-2xl font-mono font-bold text-white">
                          {loyaltyMetrics.totalOrdersCount}
                        </span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">
                          {loyaltyMetrics.totalOrdersCount === 1 ? "1 order placed" : `${loyaltyMetrics.totalOrdersCount} orders placed`}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-300 block text-[10px] uppercase">Lifetime Verified Spend</span>
                        <span className="text-2xl font-mono font-bold text-white">
                          {formatCurrency(loyaltyMetrics.totalSpend)}
                        </span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">Total purchases</span>
                      </div>
                    </div>

                    {/* Progress Milestone Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px] text-stone-300">
                        <span>{loyaltyMetrics.nextMilestone}</span>
                        <span className="font-mono">{loyaltyMetrics.progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#C5A059] rounded-full transition-all duration-500"
                          style={{ width: `${loyaltyMetrics.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* ONLY display privileges if the admin explicitly configured them in Admin Settings! ZERO dummy claims! */}
                    {loyaltyMetrics.privileges && loyaltyMetrics.privileges.length > 0 && (
                      <div className="space-y-2 text-xs text-stone-200 pt-2 border-t border-white/10">
                        <p className="font-semibold text-[#C5A059] uppercase tracking-wider text-[11px]">
                          Your Active Privileges:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-stone-300">
                          {loyaltyMetrics.privileges.map((priv, idx) => (
                            <li key={idx}>{priv}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Luxury Patron Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl border border-[#E8DEC8] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:border-none print:shadow-none print:max-w-none print:p-0 print:my-0 animate-in zoom-in-95 duration-150">
            {/* Top Toolbar (Hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DEC8] mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-base text-[#0A251C]">
                  Certified Optical Tax Invoice
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 transition cursor-pointer rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="space-y-6 text-[#1A1816]">
              {/* Store & Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-[#0A251C] pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#0A251C] uppercase">
                    Shivam Optical
                  </h2>
                  <p className="text-[11px] font-semibold tracking-wider text-[#C5A059] uppercase">
                    Luxury Eyewear &amp; Clinical Optometry Clinic
                  </p>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Shop No-1, Kanishka Complex, SAMACHAR market,
                    <br />
                    Mayur Vihar Phase I Extension, New Delhi - 110091
                    <br />
                    Ph: +91 98100 12345 • care@shivamoptical.in
                    <br />
                    <span className="font-mono text-[11px] text-stone-700 font-semibold">
                      GSTIN: 07AAACS1234F1Z9
                    </span>
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#0A251C] text-[#C5A059]">
                    TAX INVOICE
                  </span>
                  <div className="font-mono font-bold text-sm text-[#0A251C]">
                    INV-{selectedInvoiceOrder.order_number}
                  </div>
                  <div className="text-xs text-stone-500">
                    Date:{" "}
                    {new Date(selectedInvoiceOrder.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-stone-500">
                    AWB Tracking:{" "}
                    <span className="font-mono font-semibold text-stone-800">
                      {selectedInvoiceOrder.tracking_number || selectedInvoiceOrder.order_number}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patron & Payment Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DEC8]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] block">
                    Billed / Delivered To
                  </span>
                  <div className="font-bold text-sm text-[#0A251C]">
                    {selectedInvoiceOrder.guest_name ||
                      (typeof selectedInvoiceOrder.shipping_address === "object"
                        ? selectedInvoiceOrder.shipping_address?.fullName
                        : "") ||
                      user?.name ||
                      "Valued Patron"}
                  </div>
                  <div className="text-stone-600">
                    Phone:{" "}
                    <span className="font-mono">
                      {selectedInvoiceOrder.guest_phone ||
                        (typeof selectedInvoiceOrder.shipping_address === "object"
                          ? selectedInvoiceOrder.shipping_address?.phone
                          : "") ||
                        user?.phone ||
                        "—"}
                    </span>
                  </div>
                  <p className="text-stone-600 leading-relaxed pt-1">
                    {(() => {
                      const addr =
                        typeof selectedInvoiceOrder.shipping_address === "string"
                          ? (() => {
                              try {
                                return JSON.parse(selectedInvoiceOrder.shipping_address);
                              } catch {
                                return {};
                              }
                            })()
                          : selectedInvoiceOrder.shipping_address || {};
                      return [addr.streetAddress, addr.apartment, addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(", ");
                    })()}
                  </p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] block">
                    Payment &amp; Logistics
                  </span>
                  <div>
                    Payment Method:{" "}
                    <strong className="uppercase">
                      {selectedInvoiceOrder.payment_method || "Razorpay Online"}
                    </strong>
                  </div>
                  <div>
                    Payment Status:{" "}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      PAID
                    </span>
                  </div>
                  {selectedInvoiceOrder.payment_id && (
                    <div className="font-mono text-[11px] text-stone-600">
                      Txn Ref: {selectedInvoiceOrder.payment_id}
                    </div>
                  )}
                  <div className="text-stone-600 pt-1">
                    Carrier Partner:{" "}
                    <strong>{selectedInvoiceOrder.courier_partner || "Blue Dart Air Priority"}</strong>
                  </div>
                </div>
              </div>

              {/* Prescription Detail (if clinical lens ordered) */}
              {(() => {
                const itemWithRx = selectedInvoiceOrder.items?.find(
                  (i) => i.prescription && (i.prescription.rightEye || i.prescription.pd)
                );
                if (!itemWithRx?.prescription) return null;
                const rx = itemWithRx.prescription;
                return (
                  <div className="bg-[#FAF3EB] p-3 rounded-xl border border-[#C5A059]/40 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-[#0A251C] text-[11px] uppercase tracking-wider">
                      <span>Clinical Optical Prescription (OD/OS)</span>
                      <span>PD: {rx.pd || "63"} mm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
                      <div className="bg-white p-2 rounded border border-[#E8DEC8]">
                        <span className="font-bold text-[#0A251C] block text-[10px] uppercase font-sans mb-1">
                          Right Eye (OD)
                        </span>
                        SPH: {rx.rightEye?.sph || "0.00"} | CYL: {rx.rightEye?.cyl || "0.00"} | AXIS: {rx.rightEye?.axis || "0"}°
                      </div>
                      <div className="bg-white p-2 rounded border border-[#E8DEC8]">
                        <span className="font-bold text-[#0A251C] block text-[10px] uppercase font-sans mb-1">
                          Left Eye (OS)
                        </span>
                        SPH: {rx.leftEye?.sph || "0.00"} | CYL: {rx.leftEye?.cyl || "0.00"} | AXIS: {rx.leftEye?.axis || "0"}°
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Itemized Invoice Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-300 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      <th className="py-2 pr-3">Item Description</th>
                      <th className="py-2 px-2 text-center">HSN</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Rate</th>
                      <th className="py-2 pl-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedInvoiceOrder.items && selectedInvoiceOrder.items.length > 0 ? (
                      selectedInvoiceOrder.items.map((it, idx) => (
                        <tr key={idx} className="py-2">
                          <td className="py-2.5 pr-3">
                            <div className="font-bold text-[#0A251C]">
                              {it.product_name || "Optical Frame"}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {it.brand || "Shivam Optical"} {it.color ? `• Color: ${it.color}` : ""}
                            </div>
                            {it.lens_package && it.lens_package !== "Frame Only" && (
                              <div className="text-[11px] text-[#C5A059] font-medium">
                                Lens: {it.lens_package} (HSN 9001 - 12% GST)
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-stone-500">
                            {it.lens_package && it.lens_package !== "Frame Only" ? "9003/9001" : "9003"}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono">{it.quantity || 1}</td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            {formatCurrency(Number(it.unit_price || 0) + Number(it.lens_price || 0))}
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono font-bold text-[#0A251C]">
                            {formatCurrency(
                              Number(it.total_price || (Number(it.unit_price || 0) + Number(it.lens_price || 0)) * (it.quantity || 1))
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-stone-400">
                          Eyewear Frame &amp; Custom Clinical Lenses
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="border-t-2 border-stone-300 pt-3 flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal (Inclusive of GST)</span>
                    <span className="font-mono font-semibold text-[#0A251C]">
                      {formatCurrency(Number(selectedInvoiceOrder.subtotal || selectedInvoiceOrder.total_amount))}
                    </span>
                  </div>
                  {Number(selectedInvoiceOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({selectedInvoiceOrder.coupon_code || "Coupon"})</span>
                      <span className="font-mono">
                        -{formatCurrency(Number(selectedInvoiceOrder.discount_amount))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Insured Shipping Fee</span>
                    <span className="font-mono">
                      {Number(selectedInvoiceOrder.shipping_fee) > 0
                        ? formatCurrency(Number(selectedInvoiceOrder.shipping_fee))
                        : "FREE"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-300 flex justify-between text-sm font-bold text-[#0A251C]">
                    <span>Total Paid</span>
                    <span className="font-mono text-[#0A251C]">
                      {formatCurrency(Number(selectedInvoiceOrder.total_amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax Invoice Legal Footer */}
              <div className="pt-4 border-t border-stone-200 text-[10px] text-stone-500 space-y-1">
                <p>
                  * Spectacle frames classified under HSN Code 9003 (GST @ 12%). Corrective ophthalmic lenses classified under HSN Code 9001 (GST @ 12%). This computer-generated invoice is authenticated under Indian GST Act, 2017.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span>Thank you for choosing Shivam Optical.</span>
                  <span className="font-semibold text-stone-700">Authorised Optical Dispenser</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#C5A059] mx-auto" />
            <p className="text-xs text-stone-500 uppercase tracking-widest">
              Loading Account...
            </p>
          </div>
        </div>
      }
    >
      <AccountDashboard />
    </Suspense>
  );
}
