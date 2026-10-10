"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Check,
  AlertCircle,
  Save,
  Loader2,
  RefreshCw,
  Search,
  Copy,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  SlidersHorizontal,
  IndianRupee,
  Layers,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "gateways">("transactions");

  // Gateway configurations state
  const [paymentsConfig, setPaymentsConfig] = useState<any>({
    stripe: {
      enabled: false,
      mode: "test",
      publicKeyMasked: "pk_test_••••••••••••••••8912",
      acceptedMethods: ["Credit Cards", "Apple Pay", "Google Pay"],
    },
    razorpayUpi: {
      enabled: true,
      mode: "test",
      keyId: "rzp_test_TfX2gVZqD6Ern5",
      keyIdMasked: "rzp_test_••••••••••••••••rn5",
      acceptedMethods: ["UPI", "GPay", "PhonePe", "Paytm", "NetBanking", "RuPay", "Cards"],
    },
    cod: {
      enabled: true,
      minOrderValue: 500,
      maxOrderValue: 50000,
      requiresPhoneVerification: true,
    },
    netbanking: {
      enabled: true,
      supportedBanks: [
        "HDFC Bank",
        "ICICI Bank",
        "State Bank of India",
        "Axis Bank",
        "Kotak Mahindra",
      ],
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
  const [methodFilter, setMethodFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch gateway configuration
  useEffect(() => {
    fetch("/api/admin/settings?key=payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.value) {
          // Normalize razorpay vs razorpayUpi key structure
          const val = data.value;
          if (val.razorpay && !val.razorpayUpi) {
            val.razorpayUpi = val.razorpay;
          }
          setPaymentsConfig((prev: any) => ({ ...prev, ...val }));
        }
      })
      .catch((e) => console.warn("Failed to fetch payments settings:", e))
      .finally(() => setLoading(false));
  }, []);

  // Fetch live transaction ledger
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (methodFilter !== "all") params.set("method", methodFilter);

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
  }, [searchQuery, statusFilter, methodFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Keep razorpay and razorpayUpi in sync
      const payload = {
        ...paymentsConfig,
        razorpay: paymentsConfig.razorpayUpi || paymentsConfig.razorpay,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payments", value: payload }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment gateway configurations updated successfully");
      } else {
        toast.error("Failed to update settings", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Save error", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPaymentId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Transaction ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
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
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Payment Gateways & Transaction Ledger
          </h1>
          <p className="text-xs text-stone-500">
            Real-time Razorpay telemetry, settlement verification, and boutique payment gateway rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={txLoading}
            className="text-xs bg-white border-[#E8DCCF] text-stone-700 hover:bg-[#FAF7F2] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${txLoading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Volume */}
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Settled Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#0A251C] font-serif">
            {formatCurrency(metrics?.totalSettledVolume || metrics?.totalVolume || 0)}
          </div>
          <div className="text-[11px] text-stone-500">
            Gross customer receipts across all rails
          </div>
        </div>

        {/* Metric 2: Total Transactions */}
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Transactions
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] flex items-center justify-center text-stone-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#0A251C]">
            {metrics?.totalTransactions || 0}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <span className="text-emerald-700 font-bold">{metrics?.paidTransactions || 0} Paid</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">{metrics?.pendingTransactions || 0} Unpaid</span>
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Settlement Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {metrics?.successRate || 100}%
          </div>
          <div className="text-[11px] text-stone-500">
            HMAC-SHA256 Cryptographic verification
          </div>
        </div>

        {/* Metric 4: Method Split */}
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Online vs COD Ratio
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#0A251C]">
            {metrics?.razorpayCount || 0} : {metrics?.codCount || 0}
          </div>
          <div className="text-[11px] text-stone-500">
            Razorpay instant capture vs Doorstep cash
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DCCF]">
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "transactions"
              ? "border-[#C5A059] text-[#C5A059]"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <span>Live Transaction Ledger</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8DCCF] text-stone-700 font-mono">
            {transactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gateways")}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "gateways"
              ? "border-[#C5A059] text-[#C5A059]"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <span>Gateway Settings & API Keys</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </button>
      </div>

      {/* 4. Tab A: Live Transaction Ledger View */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-[#E8DCCF] rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction ID, order #, or patron..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl font-medium outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid & Settled</option>
                <option value="pending">Pending / COD</option>
                <option value="failed">Failed</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium ml-2">
                <span>Rail:</span>
              </div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl font-medium outline-none cursor-pointer"
              >
                <option value="all">All Rails</option>
                <option value="upi">Razorpay UPI</option>
                <option value="card">Cards</option>
                <option value="netbanking">NetBanking</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white border border-[#E8DCCF] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8DCCF] text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Payment ID / Ref</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patron</th>
                    <th className="py-3 px-4">Gateway Rail</th>
                    <th className="py-3 px-4 text-right">Settled Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        {txLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                            <span>Loading live ledger...</span>
                          </div>
                        ) : (
                          "No transactions recorded for the selected filter."
                        )}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx: any) => {
                      const isPaid = tx.payment_status === "paid";
                      const isFailed = tx.payment_status === "failed";
                      const isCod = tx.payment_method === "cod" || (typeof tx.payment_method === "string" && tx.payment_method.toLowerCase().includes("cash"));
                      const payId = tx.payment_id;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-[#FAF7F2]/60 transition-colors"
                        >
                          {/* Payment ID / Ref */}
                          <td className="py-3 px-4">
                            {payId ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#0A251C]">
                                <span className="font-semibold">{payId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPaymentId(payId)}
                                  className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer"
                                  title="Copy transaction ID"
                                >
                                  {copiedId === payId ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="font-mono text-[11px] text-stone-400">
                                {isCod ? "COD-PENDING" : "NO-PAY-ID"}
                              </span>
                            )}
                          </td>

                          {/* Order Number */}
                          <td className="py-3 px-4 font-mono font-bold text-[#C5A059]">
                            <Link
                              href={`/admin/orders/${tx.id}`}
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{tx.order_number}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </Link>
                          </td>

                          {/* Customer */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0A251C]">
                              {tx.shipping_address?.fullName || "Valued Patron"}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              {tx.guest_phone || tx.guest_email}
                            </div>
                          </td>

                          {/* Payment Rail Badge */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DCCF] text-stone-700 font-bold uppercase text-[10px]">
                              {tx.payment_method === "upi" || (typeof tx.payment_method === "string" && tx.payment_method.toLowerCase().includes("upi")) ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Razorpay UPI
                                </>
                              ) : tx.payment_method === "card" || (typeof tx.payment_method === "string" && tx.payment_method.toLowerCase().includes("card")) ? (
                                <>
                                  <CreditCard className="w-3 h-3 text-stone-600" />
                                  Card Rail
                                </>
                              ) : tx.payment_method === "netbanking" || (typeof tx.payment_method === "string" && tx.payment_method.toLowerCase().includes("net")) ? (
                                <>
                                  <Layers className="w-3 h-3 text-stone-600" />
                                  NetBanking
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Cash on Delivery
                                </>
                              )}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-extrabold text-[#0A251C] font-mono">
                            {formatCurrency(Number(tx.total_amount))}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                <AlertCircle className="w-3 h-3" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                            {new Date(tx.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/admin/orders/${tx.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C5A059] hover:underline"
                            >
                              <span>Inspect</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab B: Gateway Configuration & Settings */}
      {activeTab === "gateways" && (
        <div className="space-y-5">
          {/* Primary Gateway Card: Razorpay UPI & NetBanking */}
          <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Primary Indian Gateway: Razorpay Payments</span>
                </div>
                <h2 className="text-base font-bold text-[#0A251C]">Razorpay UPI, QR & Cards</h2>
                <p className="text-xs text-stone-600 max-w-xl mt-1 leading-relaxed">
                  Powers instant QR scanning (Google Pay, PhonePe, Paytm, BHIM), all major Indian debit/credit cards, and direct netbanking. Payments are verified on server using HMAC-SHA256 cryptographic signatures.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <span className="text-stone-600">Active</span>
                <input
                  type="checkbox"
                  checked={paymentsConfig.razorpayUpi?.enabled}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      razorpayUpi: {
                        ...paymentsConfig.razorpayUpi,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-[#C5A059] w-4 h-4 cursor-pointer accent-[#C5A059]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Razorpay Key ID (Public Client Key)
                </label>
                <input
                  type="text"
                  value={paymentsConfig.razorpayUpi?.keyId || ""}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      razorpayUpi: {
                        ...paymentsConfig.razorpayUpi,
                        keyId: e.target.value,
                      },
                    })
                  }
                  placeholder="rzp_live_... or rzp_test_..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl font-mono text-stone-800 text-xs outline-none focus:border-[#C5A059]"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Public identifier passed to the checkout modal.
                </span>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Operating Environment Mode
                </label>
                <select
                  value={paymentsConfig.razorpayUpi?.mode || "test"}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      razorpayUpi: {
                        ...paymentsConfig.razorpayUpi,
                        mode: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl text-stone-800 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="test">Test Mode / Sandbox (Zero Risk)</option>
                  <option value="live">Live Production (Real Settlements)</option>
                </select>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Switch between Razorpay sandbox credentials and live banking settlement.
                </span>
              </div>
            </div>

            {/* Security Isolation Notice */}
            <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl p-3 flex items-start gap-2.5 text-xs text-stone-600">
              <Lock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Airtight Security Architecture:</strong> Key Secret and Webhook Secret are strictly stored on the server via <code className="bg-stone-200/70 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> (<code className="font-mono text-[11px]">RAZORPAY_KEY_SECRET</code>). They are never exposed to browser bundles or client network requests.
              </div>
            </div>
          </div>

          {/* Global Card Module: Stripe International */}
          <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  International & Ultra-High-Net-Worth Cards
                </div>
                <h2 className="text-base font-bold text-[#0A251C]">Stripe International Gateway</h2>
                <p className="text-xs text-stone-600 max-w-xl mt-1 leading-relaxed">
                  Accept American Express Centurion, Platinum, and foreign currency cards from international patrons and global collectors.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <span className="text-stone-600">Active</span>
                <input
                  type="checkbox"
                  checked={paymentsConfig.stripe?.enabled}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      stripe: { ...paymentsConfig.stripe, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-[#C5A059] w-4 h-4 cursor-pointer accent-[#C5A059]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Publishable Key (Masked)</label>
                <input
                  type="text"
                  readOnly
                  value={paymentsConfig.stripe?.publicKeyMasked}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl font-mono text-stone-600"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Accepted Payment Rails</label>
                <div className="text-stone-600 text-xs py-1.5">
                  {paymentsConfig.stripe?.acceptedMethods?.join(", ") || "Credit Cards, Apple Pay"}
                </div>
              </div>
            </div>
          </div>

          {/* Cash on Delivery (COD) Constraints */}
          <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Concierge Doorstep Payment
                </div>
                <h2 className="text-base font-bold text-[#0A251C]">Cash on Delivery (COD)</h2>
                <p className="text-xs text-stone-600 max-w-xl mt-1 leading-relaxed">
                  Allows patrons to pay cash or UPI upon courier arrival. Requires order value safety thresholds.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <span className="text-stone-600">Active</span>
                <input
                  type="checkbox"
                  checked={paymentsConfig.cod?.enabled}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      cod: { ...paymentsConfig.cod, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-[#C5A059] w-4 h-4 cursor-pointer accent-[#C5A059]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  value={paymentsConfig.cod?.minOrderValue}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      cod: { ...paymentsConfig.cod, minOrderValue: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  Maximum Order Ceiling (₹)
                </label>
                <input
                  type="number"
                  value={paymentsConfig.cod?.maxOrderValue}
                  onChange={(e) =>
                    setPaymentsConfig({
                      ...paymentsConfig,
                      cod: { ...paymentsConfig.cod, maxOrderValue: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl text-xs text-[#0A251C]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
