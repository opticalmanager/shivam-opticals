"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  IndianRupee,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/admin/common/EmptyState";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCustomers: 0, cumulativeLtv: 0, avgOrderValue: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
            Clientele & Patron Profiles
          </h1>
          <p className="text-xs text-stone-500">
            Shivam Optics luxury patrons, lifetime spending, and order history
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
            ₹{(stats.cumulativeLtv || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Average Patron Spend</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            ₹{(stats.avgOrderValue || 0).toLocaleString("en-IN")}
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
                  <th className="py-3 px-4 text-right">Status</th>
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
                      <div className="font-medium text-stone-800">{c.email}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{c.phone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-stone-700">{c.city}</div>
                      <div className="text-[10px] text-stone-400">{c.state}</div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#0A251C]">
                      {c.total_orders} order(s)
                    </td>

                    <td className="py-3 px-3 font-bold text-sm text-[#0A251C]">
                      ₹{Number(c.total_spent).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Active Patron
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
