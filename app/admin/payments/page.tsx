"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "gateways">("transactions");

  // Gateway configurations state
  const [paymentsConfig, setPaymentsConfig] = useState<any>({
    razorpay: {
      enabled: true,
      mode: "test",
      keyId: "rzp_test_TfX2gVZqD6Ern5",
      keySecretMasked: "9lrO••••••••••••••••Bk2a",
      acceptedMethods: ["UPI", "GPay", "PhonePe", "Paytm", "NetBanking", "RuPay", "Cards"],
    },
    cod: {
      enabled: true,
      minOrderValue: 500,
      maxOrderValue: 25000,
      requiresPhoneVerification: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live transaction ledger state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/settings?key=payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          setPaymentsConfig(data.value);
        }
      })
      .catch((e) => console.warn("Failed to fetch payments settings:", e))
      .finally(() => setLoading(false));
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setMetrics(data.metrics || null);
      }
    } catch (e) {
      console.warn("Failed to fetch transactions:", e);
    } finally {
      setTxLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payments", value: paymentsConfig }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment gateway configurations updated successfully");
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
            Financial & Payment Settlements
          </h1>
          <p className="text-xs text-stone-500">
            Monitor real-time Razorpay settlements, cash-on-delivery reconciliations, and gateway configurations
          </p>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === "transactions"
                ? "bg-white text-[#0A251C] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Transactions Ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gateways")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === "gateways"
                ? "bg-white text-[#0A251C] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Gateway Configuration
          </button>
        </div>
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Total Settled Volume</span>
              </div>
              <div className="text-xl font-bold text-[#0A251C]">
                ₹{(metrics?.totalSettledVolume || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid Transactions</span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {metrics?.paidTransactions || 0}
              </div>
            </div>

            <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending / COD</span>
              </div>
              <div className="text-xl font-bold text-amber-700">
                {metrics?.pendingTransactions || 0}
              </div>
            </div>

            <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Settlement Success Rate</span>
              </div>
              <div className="text-xl font-bold text-[#0A251C]">
                {metrics?.successRate || 100}%
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-[#E8DCCF] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction ID, order #, or patron..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          {txLoading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
              <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction ID / Order</th>
                    <th className="py-3 px-3">Patron</th>
                    <th className="py-3 px-3">Gateway Method</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#0A251C]">{tx.payment_id}</div>
                        <div className="text-[10px] text-stone-400">Order #{tx.order_number}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-800">{tx.shipping_address?.fullName || "Patron"}</div>
                        <div className="text-[10px] text-stone-400">{tx.guest_email}</div>
                      </td>

                      <td className="py-3 px-3 uppercase font-medium text-stone-700">
                        {tx.payment_method}
                      </td>

                      <td className="py-3 px-3 font-bold text-sm text-[#0A251C]">
                        ₹{Number(tx.total_amount).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={tx.payment_status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right text-stone-500 text-[10px]">
                        {new Date(tx.created_at).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "gateways" && (
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0A251C] font-serif">Razorpay & Checkout Configuration</h3>
              <p className="text-xs text-stone-500">Configure credentials for Razorpay Payments and Cash on Delivery</p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save Credentials</span>
            </Button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0A251C]">Razorpay Payments</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={paymentsConfig.razorpay?.keyId || ""}
                    onChange={(e) =>
                      setPaymentsConfig({
                        ...paymentsConfig,
                        razorpay: { ...paymentsConfig.razorpay, keyId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs font-mono text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mode</label>
                  <select
                    value={paymentsConfig.razorpay?.mode || "test"}
                    onChange={(e) =>
                      setPaymentsConfig({
                        ...paymentsConfig,
                        razorpay: { ...paymentsConfig.razorpay, mode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  >
                    <option value="test">Test Mode (Sandbox)</option>
                    <option value="live">Live Production</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0A251C]">Cash on Delivery / In-Store Atelier Pickup</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Order for COD (₹)</label>
                  <input
                    type="number"
                    value={paymentsConfig.cod?.minOrderValue || 500}
                    onChange={(e) =>
                      setPaymentsConfig({
                        ...paymentsConfig,
                        cod: { ...paymentsConfig.cod, minOrderValue: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Order for COD (₹)</label>
                  <input
                    type="number"
                    value={paymentsConfig.cod?.maxOrderValue || 25000}
                    onChange={(e) =>
                      setPaymentsConfig({
                        ...paymentsConfig,
                        cod: { ...paymentsConfig.cod, maxOrderValue: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
