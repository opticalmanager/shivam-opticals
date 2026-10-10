"use client";

import React, { useState, useEffect } from "react";
import { Plus, Percent, Trash2, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";
import { StoredCoupon } from "@/lib/adminDb";

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<StoredCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(12);
  const [minOrderValue, setMinOrderValue] = useState(1000);
  const [maxDiscount, setMaxDiscount] = useState<number | "">(1500);
  const [usageLimit, setUsageLimit] = useState(500);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.warn("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_order_value: Number(minOrderValue),
          max_discount: maxDiscount ? Number(maxDiscount) : null,
          usage_limit: Number(usageLimit),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon created successfully");
        setIsModalOpen(false);
        setCode("");
        fetchCoupons();
      } else {
        toast.error("Error creating coupon", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentStatus ? "Coupon disabled" : "Coupon activated");
        fetchCoupons();
      }
    } catch (e: any) {
      toast.error("Status update error", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon removed");
        fetchCoupons();
      }
    } catch (e: any) {
      toast.error("Delete error", { description: e.message });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Promotions & Privilege Codes
          </h1>
          <p className="text-xs text-stone-500">
            Configure boutique checkout coupons, minimum thresholds, and customer savings
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Promo Code</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Discount Type & Value</th>
                <th className="py-3 px-3">Min Order / Cap</th>
                <th className="py-3 px-3">Usage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sm text-[#0A251C]">
                    {c.code}
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-800">
                    {c.discount_type === "percentage"
                      ? `${c.discount_value}% Off`
                      : `₹${c.discount_value} Flat Off`}
                  </td>
                  <td className="py-3 px-3 text-stone-600">
                    Min ₹{c.min_order_value.toLocaleString("en-IN")}
                    {c.max_discount && ` (Max ₹${c.max_discount})`}
                  </td>
                  <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                    {c.times_used} / {c.usage_limit} used
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.is_active)}
                      className="cursor-pointer"
                    >
                      <StatusBadge
                        status={c.is_active ? "active" : "inactive"}
                        size="sm"
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <h3 className="font-bold text-[#0A251C] font-serif text-base">Create Privilege Coupon</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MAYUR15"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs font-mono font-bold text-[#0A251C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Optional cap"
                    className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-stone-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {saving ? "Saving..." : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
