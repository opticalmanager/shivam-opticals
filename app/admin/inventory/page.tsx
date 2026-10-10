"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Minus,
  Archive,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { EmptyState } from "@/components/admin/common/EmptyState";
import { toast } from "sonner";
import { StoredVariant } from "@/lib/adminDb";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<StoredVariant[]>([]);
  const [stats, setStats] = useState<any>({
    totalSkus: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInventory(data.inventory || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockDelta = async (variantId: string, delta: number) => {
    setUpdatingId(variantId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, delta }),
      });
      const data = await res.json();
      if (data.success) {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === variantId
              ? { ...item, stock_quantity: data.variant.stock_quantity }
              : item
          )
        );
        toast.success("Stock updated", {
          description: `New stock level: ${data.variant.stock_quantity} units.`,
        });
      }
    } catch (err: any) {
      toast.error("Stock update failed", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Stock & Inventory Controller
          </h1>
          <p className="text-xs text-stone-500">
            Real-time SKU variant stock levels and atelier warehouse allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            disabled={loading}
            className="text-xs border-[#E8DCCF] hover:bg-[#FAF7F2] text-[#0A251C]"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Total Active SKUs</span>
          </div>
          <div className="text-xl font-bold text-[#0A251C]">{stats.totalSkus}</div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Units in Stock</span>
          </div>
          <div className="text-xl font-bold text-[#0A251C]">{stats.totalUnits}</div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            <span>Low Stock (&le; 5 units)</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{stats.lowStockCount}</div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            <span>Out of Stock SKUs</span>
          </div>
          <div className="text-xl font-bold text-rose-700">{stats.outOfStockCount || 0}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, frame model, or category..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-1 text-xs overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: `All SKUs (${stats.totalSkus})` },
            { id: "low", label: `Low Stock (${stats.lowStockCount})` },
            { id: "out", label: `Out of Stock (${stats.outOfStockCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs shrink-0 ${
                filter === tab.id
                  ? "bg-[#0A251C] text-[#FAF7F2] font-semibold"
                  : "bg-stone-100 text-stone-600 hover:text-stone-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin mb-2" />
          <span className="text-xs text-stone-500 font-medium">Checking atelier warehouse stock...</span>
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          title="No Inventory Records"
          description="No SKUs match your filter criteria."
        />
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-3">Frame Model</th>
                  <th className="py-3 px-3">Colorway</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Available Units</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Stepper</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventory.map((item) => {
                  const stock = Number(item.stock_quantity);
                  let status = "in_stock";
                  if (stock === 0) status = "out_of_stock";
                  else if (stock <= 5) status = "low_stock";

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-stone-800">
                        {item.sku}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#0A251C]">{item.product_name}</div>
                        <div className="text-[10px] text-stone-400">
                          ID: {item.product_id} &bull; ₹{item.price.toLocaleString("en-IN")}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                            style={{ backgroundColor: item.color_hex || "#C5A059" }}
                          />
                          <span className="text-stone-700">{item.color_name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-stone-800">{item.category}</div>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-sm text-[#0A251C]">
                        {stock.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3">
                        <StatusBadge status={status} size="sm" />
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 border border-stone-200 rounded-md p-0.5 bg-stone-50">
                          <button
                            type="button"
                            onClick={() => handleStockDelta(item.id, -1)}
                            disabled={stock <= 0 || updatingId === item.id}
                            className="p-1 rounded hover:bg-white text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-semibold text-xs min-w-[28px] text-center">
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockDelta(item.id, 1)}
                            disabled={updatingId === item.id}
                            className="p-1 rounded hover:bg-white text-stone-600 hover:text-stone-900 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
