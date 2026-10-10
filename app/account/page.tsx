"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  FileText,
  MapPin,
  Sparkles,
  Calendar,
  LogOut,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Truck,
  Glasses,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Plus,
  Loader2,
  Printer,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { StoredOrder } from "@/lib/adminDb";

type AccountTab = "orders" | "prescriptions" | "consultations" | "addresses" | "loyalty";

function AccountDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, login, logout, openAppointmentModal } = useAuth();

  const tabParam = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(tabParam);

  useEffect(() => {
    const t = searchParams.get("tab") as AccountTab;
    if (t && ["orders", "prescriptions", "consultations", "addresses", "loyalty"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Sign-in gate state
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Orders state
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Saved addresses
  const [savedAddress, setSavedAddress] = useState({
    fullName: user?.name || "Patron",
    phone: user?.phone || "097799 90207",
    streetAddress: "Kanishka Complex, Samachar Market",
    city: "Mayur Vihar Ph 1",
    state: "Delhi",
    pincode: "110091",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Saved Prescriptions
  const [prescription, setPrescription] = useState({
    rightEye: { sph: "-1.25", cyl: "-0.50", axis: "90" },
    leftEye: { sph: "-1.50", cyl: "-0.50", axis: "85" },
    pd: "63.5",
    doctor: "Dr. K. Sharma (Shivam Optical Atelier)",
    date: "14 Sept 2026",
  });
  const [isEditingRx, setIsEditingRx] = useState(false);

  // Fetch orders from persistent store
  useEffect(() => {
    if (isLoggedIn) {
      setLoadingOrders(true);
      fetch("/api/admin/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) {
            setOrders(data.orders);
          }
        })
        .catch((err) => console.warn("Failed to fetch orders:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [isLoggedIn]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) {
      toast.error("Please provide your phone number");
      return;
    }
    login(phoneInput, nameInput || "Patron");
    toast.success("Welcome back to Shivam Optical Atelier!");
  };

  // If user is not logged in, render luxury phone verification gate
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#E8DEC8] p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
              PATRON ATELIER PRIVILEGE
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
              Access Your Account
            </h1>
            <p className="text-xs text-stone-500">
              Sign in with your phone number to track your optical lab assembly, inspect prescriptions, and manage Mayur Vihar appointments.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>CONTINUE TO DASHBOARD</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#E8DEC8]/60 text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Encrypted patron authentication under clinical privacy standards.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Atelier Patron Header Banner */}
      <section className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold">
              <Link href="/" className="hover:text-[#0A251C] transition">Home</Link>
              <span>/</span>
              <span className="text-[#C5A059] font-bold">Patron Atelier Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
              Welcome, {user?.name || "Distinguished Patron"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                {user?.phone}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0A251C] text-[#C5A059]">
                <Sparkles className="w-3 h-3" />
                Shivam Atelier Gold Patron
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
              onClick={logout}
              className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Account Dashboard Grid */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Rails */}
          <div className="lg:col-span-3 space-y-2 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-3 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders & Lab Stepper</span>
                </div>
                <span className="text-[11px] font-mono">{orders.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("prescriptions")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "prescriptions"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Glasses className="w-4 h-4" />
                  <span>Optical Prescriptions</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("consultations")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "consultations"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Atelier Consultations</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "addresses"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Addresses</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("loyalty")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "loyalty"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Privilege & Rewards</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Order History & Lab Assembly
                    </h2>
                    <p className="text-xs text-stone-500">
                      Live tracking through the 5-stage Mayur Vihar optical lab queue
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
                    Retrieving orders from atelier ledger...
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
                      Discover certified luxury frames, polarized lenses, and Zeiss clinical packages in our collection.
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex py-2.5 px-6 rounded-xl bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider"
                    >
                      Explore Frames
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
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
                              Placed on {new Date(ord.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF3EB] text-[#0A251C] border border-[#E8DEC8]">
                              <Clock className="w-3 h-3 mr-1 text-[#C5A059]" />
                              <span className="capitalize">{ord.status.replace("_", " ")}</span>
                            </span>
                            <span className="font-mono font-bold text-sm text-[#0A251C]">
                              {formatCurrency(ord.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="space-y-2">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                                <span className="font-medium text-[#0A251C]">{it.product_name}</span>
                                <span className="text-stone-400">• {it.color}</span>
                                {it.lens_package && (
                                  <span className="text-stone-500 italic">({it.lens_package})</span>
                                )}
                              </div>
                              <span className="font-mono text-stone-600">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Shipping & Stepper Preview */}
                        <div className="pt-2 border-t border-[#E8DEC8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#C5A059]" />
                            <span>Courier: <strong>{ord.courier_partner || "BlueDart Express"}</strong></span>
                            {ord.tracking_number && (
                              <span className="font-mono text-stone-500">({ord.tracking_number})</span>
                            )}
                          </div>
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="text-[11px] font-bold text-[#0A251C] hover:text-[#C5A059] uppercase tracking-wider flex items-center gap-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print GST Invoice</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === "prescriptions" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Clinical Eye Prescriptions
                    </h2>
                    <p className="text-xs text-stone-500">
                      Certified ophthalmic records for precision lens calibration
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingRx(!isEditingRx)}
                    className="py-2 px-3.5 rounded-xl border border-[#0A251C] text-[#0A251C] hover:bg-[#0A251C] hover:text-white text-xs font-bold uppercase tracking-wider transition"
                  >
                    {isEditingRx ? "Cancel" : "Update Rx"}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E8DEC8]/60 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                        ACTIVE OPHTHALMIC RECORD
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#0A251C]">
                        Single-Vision & Blue-Cut Profile
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {prescription.doctor} • Verified on {prescription.date}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      Verified Rx
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
                          <th className="py-2.5 px-4 font-bold">Pupil Distance (PD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DEC8]">
                        <tr>
                          <td className="py-3 px-4 text-left font-bold text-[#0A251C]">Right Eye (OD)</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.rightEye.sph}</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.rightEye.cyl}</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.rightEye.axis}°</td>
                          <td className="py-3 px-4 font-mono font-medium" rowSpan={2}>
                            {prescription.pd} mm
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-left font-bold text-[#0A251C]">Left Eye (OS)</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.leftEye.sph}</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.leftEye.cyl}</td>
                          <td className="py-3 px-4 font-mono font-medium">{prescription.leftEye.axis}°</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-[#FAF3EB] rounded-xl border border-[#E8DEC8] flex items-center gap-3 text-xs text-stone-600">
                    <ShieldCheck className="w-5 h-5 text-[#C5A059] shrink-0" />
                    <span>
                      Prescriptions are calibrated at our Mayur Vihar computerized laboratory with ±0.05 D tolerance.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Consultations Tab */}
            {activeTab === "consultations" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Mayur Vihar Consultations
                    </h2>
                    <p className="text-xs text-stone-500">
                      Reserved eye examination appointments and styling sessions
                    </p>
                  </div>
                  <button
                    onClick={openAppointmentModal}
                    className="py-2 px-3.5 rounded-xl bg-[#0A251C] text-[#C5A059] hover:bg-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between border-b border-[#E8DEC8]/60 pb-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                        UPCOMING ATELIER SESSION
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#0A251C]">
                        Comprehensive Computerized Eye Test
                      </h3>
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                        Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Ph 1 Ext
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      Confirmed Slot
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                      <span className="text-stone-400 block text-[10px] uppercase">Slot Timing</span>
                      <span className="font-bold text-[#0A251C]">Daily Window: 11:00 AM – 01:00 PM</span>
                    </div>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                      <span className="text-stone-400 block text-[10px] uppercase">Service Specialist</span>
                      <span className="font-bold text-[#0A251C]">Senior Optometrist In-Charge</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-stone-500">
                      Default addresses for insured courier dispatch
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="py-2 px-3.5 rounded-xl border border-[#0A251C] text-[#0A251C] hover:bg-[#0A251C] hover:text-white text-xs font-bold uppercase tracking-wider transition"
                  >
                    {isEditingAddress ? "Cancel" : "Edit Address"}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                      DEFAULT RESIDENCE ADDRESS
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF3EB] text-[#0A251C] text-[10px] font-bold uppercase">
                      Default
                    </span>
                  </div>

                  {isEditingAddress ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setIsEditingAddress(false);
                        toast.success("Delivery address updated successfully");
                      }}
                      className="space-y-3 pt-2"
                    >
                      <input
                        type="text"
                        value={savedAddress.fullName}
                        onChange={(e) => setSavedAddress({ ...savedAddress, fullName: e.target.value })}
                        placeholder="Recipient Name"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                      <input
                        type="text"
                        value={savedAddress.streetAddress}
                        onChange={(e) => setSavedAddress({ ...savedAddress, streetAddress: e.target.value })}
                        placeholder="Street Address"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={savedAddress.city}
                          onChange={(e) => setSavedAddress({ ...savedAddress, city: e.target.value })}
                          placeholder="City"
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs"
                        />
                        <input
                          type="text"
                          value={savedAddress.state}
                          onChange={(e) => setSavedAddress({ ...savedAddress, state: e.target.value })}
                          placeholder="State"
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs"
                        />
                        <input
                          type="text"
                          value={savedAddress.pincode}
                          onChange={(e) => setSavedAddress({ ...savedAddress, pincode: e.target.value })}
                          placeholder="Pincode"
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="py-2.5 px-5 bg-[#0A251C] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl"
                      >
                        Save Changes
                      </button>
                    </form>
                  ) : (
                    <div className="text-xs text-stone-700 space-y-1">
                      <p className="font-bold text-[#0A251C] text-sm">{savedAddress.fullName}</p>
                      <p>{savedAddress.streetAddress}</p>
                      <p>{savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</p>
                      <p className="text-stone-400">Phone: {savedAddress.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === "loyalty" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-3">
                  <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                    Privilege Club & Rewards
                  </h2>
                  <p className="text-xs text-stone-500">
                    Exclusive tier benefits, concierge access, and loyalty credit
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#0A251C] to-[#16382C] rounded-2xl p-6 sm:p-8 text-white space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
                        PRIVILEGE STATUS
                      </span>
                      <h3 className="text-2xl font-serif font-bold text-white mt-1">
                        Gold Atelier Member
                      </h3>
                    </div>
                    <Sparkles className="w-8 h-8 text-[#C5A059]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-stone-300 block text-[10px] uppercase">Available Rewards Credit</span>
                      <span className="text-2xl font-mono font-bold text-[#C5A059]">₹1,250</span>
                    </div>
                    <div>
                      <span className="text-stone-300 block text-[10px] uppercase">Lifetime Orders</span>
                      <span className="text-2xl font-mono font-bold text-white">{orders.length || 2}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-stone-200 pt-2 border-t border-white/10">
                    <p className="font-semibold text-[#C5A059] uppercase tracking-wider text-[11px]">
                      Your Active Privileges:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li>Complimentary Ultrasonic Cleaning and frame tune-ups forever at Mayur Vihar.</li>
                      <li>Free Priority Express Dispatch on all online orders.</li>
                      <li>Annual Complimentary Computerized Vision Analysis.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
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
              Loading Atelier Account...
            </p>
          </div>
        </div>
      }
    >
      <AccountDashboard />
    </Suspense>
  );
}
