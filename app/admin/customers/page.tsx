"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Eye,
  Mail,
  Phone,
  FileText,
  Loader2,
  IndianRupee,
  ShoppingBag,
  X,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { EmptyState } from "@/components/admin/common/EmptyState";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCustomers: 0, cumulativeLtv: 0, avgOrderValue: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [staffNote, setStaffNote] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/customers?search=${encodeURIComponent(search)}`
        : "/api/admin/customers";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Clientele &amp; Patron Profiles
          </h1>
          <p className="text-xs text-stone-500">
            Shivam Optics luxury patrons, lifetime value, and prescription archives
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Total Unique Patrons</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            {stats.totalCustomers || customers.length}
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Cumulative Patron LTV</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            {formatCurrency(Number(stats.cumulativeLtv || 0))}
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Average Patron Spend</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            {formatCurrency(Number(stats.avgOrderValue || 0))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-3 shadow-2xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patrons by name, email, phone number, or city..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin mb-2" />
          <span className="text-xs text-stone-500 font-medium">Loading patron directory...</span>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Patrons Found"
          description="No customer records match your query."
        />
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patron Name</th>
                  <th className="py-3 px-3">Contact Information</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Orders</th>
                  <th className="py-3 px-3">Lifetime Value</th>
                  <th className="py-3 px-3">Prescription Rx</th>
                  <th className="py-3 px-4 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0A251C]">{c.full_name}</div>
                      <div className="text-[10px] text-stone-400">Verified Client</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-stone-800 font-medium">
                        {c.city || "Delhi"}
                      </div>
                      <div className="text-[10px] text-stone-400">{c.state || "Delhi"}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full">
                        {c.total_orders}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-[#0A251C]">
                      {formatCurrency(Number(c.total_spent ?? c.total_spend ?? 0))}
                    </td>

                    <td className="py-3 px-3">
                      {c.has_prescription_on_file ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Rx on File</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Plano / Demo</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-[#C5A059] px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8DCCF] hover:border-stone-400 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Patron Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#FAF7F2] border-l border-[#E8DCCF] h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E8DCCF] bg-[#FAF3EB] sticky top-0 z-10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-[#0A251C] font-serif">
                    {selectedCustomer.full_name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {Number(selectedCustomer.total_spent ?? selectedCustomer.total_spend ?? 0) >= 100000
                      ? "VIP Platinum"
                      : Number(selectedCustomer.total_spent ?? selectedCustomer.total_spend ?? 0) >= 50000
                      ? "Gold Patron"
                      : "Verified Patron"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    {selectedCustomer.email}
                  </span>
                  {selectedCustomer.phone && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {selectedCustomer.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close drawer"
                className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Financial & Order Highlights Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#E8DCCF] shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                    Lifetime Spend
                  </div>
                  <div className="text-sm font-bold text-[#0A251C]">
                    {formatCurrency(Number(selectedCustomer.total_spent ?? selectedCustomer.total_spend ?? 0))}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E8DCCF] shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                    Total Orders
                  </div>
                  <div className="text-sm font-bold text-[#0A251C]">
                    {selectedCustomer.total_orders}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E8DCCF] shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                    Avg. Order Value
                  </div>
                  <div className="text-sm font-bold text-[#0A251C]">
                    {selectedCustomer.total_orders > 0
                      ? formatCurrency(
                          Math.round(
                            Number(selectedCustomer.total_spent ?? selectedCustomer.total_spend ?? 0) / selectedCustomer.total_orders
                          )
                        )
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Delivery Address & Region */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DCCF] shadow-2xs space-y-2">
                <div className="text-xs font-bold text-[#0A251C] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Primary Atelier Delivery Address</span>
                </div>
                <div className="text-xs text-stone-600 leading-relaxed pl-5">
                  {selectedCustomer.city ? (
                    <>
                      <div>{selectedCustomer.city}, {selectedCustomer.state || "India"}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Pan-India Insured Express Logistics
                      </div>
                    </>
                  ) : (
                    <div className="text-stone-400">No postal address recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Optical Eye Power (Rx) on File */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DCCF] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#0A251C] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Clinical Eye Power (Rx) on File</span>
                  </div>
                  {selectedCustomer.latest_rx?.pd && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      PD: {selectedCustomer.latest_rx.pd} mm
                    </span>
                  )}
                </div>

                {selectedCustomer.latest_rx ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 text-[11px] block mb-1">
                        Right Eye (OD)
                      </span>
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                        <div>
                          <span className="text-stone-400 block text-[9px]">SPH</span>
                          {selectedCustomer.latest_rx.rightEye?.sph || "0.00"}
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">CYL</span>
                          {selectedCustomer.latest_rx.rightEye?.cyl || "0.00"}
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">AXIS</span>
                          {selectedCustomer.latest_rx.rightEye?.axis || "0"}°
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">ADD</span>
                          {selectedCustomer.latest_rx.rightEye?.add || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 text-[11px] block mb-1">
                        Left Eye (OS)
                      </span>
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                        <div>
                          <span className="text-stone-400 block text-[9px]">SPH</span>
                          {selectedCustomer.latest_rx.leftEye?.sph || "0.00"}
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">CYL</span>
                          {selectedCustomer.latest_rx.leftEye?.cyl || "0.00"}
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">AXIS</span>
                          {selectedCustomer.latest_rx.leftEye?.axis || "0"}°
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[9px]">ADD</span>
                          {selectedCustomer.latest_rx.leftEye?.add || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-stone-400 bg-[#FAF7F2] rounded-lg border border-stone-200">
                    No active optical prescription recorded (Plano or demo frame orders).
                  </div>
                )}
              </div>

              {/* Purchase History Ledger */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DCCF] shadow-2xs space-y-3">
                <div className="text-xs font-bold text-[#0A251C] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Purchase History &amp; Order Ledger</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-normal">
                    {(selectedCustomer.orders_list || selectedCustomer.recent_orders || []).length} Records
                  </span>
                </div>

                <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto text-xs">
                  {(selectedCustomer.orders_list || selectedCustomer.recent_orders || []).length > 0 ? (
                    (selectedCustomer.orders_list || selectedCustomer.recent_orders || []).map((ord: any) => (
                      <div key={ord.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                        <div>
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="font-bold text-[#0A251C] hover:text-[#C5A059] font-mono text-xs hover:underline flex items-center gap-1"
                          >
                            <span>{ord.order_number}</span>
                            <ExternalLink className="w-3 h-3 text-stone-400" />
                          </Link>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            {new Date(ord.created_at).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <div className="font-bold text-stone-900">
                              {formatCurrency(Number(ord.total_amount))}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              {ord.payment_status && <StatusBadge status={ord.payment_status} size="sm" />}
                              <StatusBadge status={ord.status} size="sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-stone-400">
                      No order records available.
                    </div>
                  )}
                </div>
              </div>

              {/* Concierge & Optician Notes */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DCCF] shadow-2xs space-y-2">
                <label className="text-xs font-bold text-[#0A251C] block">
                  Optician &amp; Concierge Staff Notes
                </label>
                <textarea
                  rows={3}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="e.g., Client prefers Japanese titanium ultra-lightweight frames, requires high bridge adjustment..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Concierge note saved for patron");
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#0A251C] hover:bg-[#143e30] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Save Concierge Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
