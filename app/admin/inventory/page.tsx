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
  Trash2,
  Sparkles,
  Layers,
  RefreshCw,
  Eye,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { EmptyState } from "@/components/admin/common/EmptyState";
import { toast } from "sonner";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalSkus: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    demoCount: 0,
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Demo management states
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            item.variant_id === variantId
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

  const handleSeedDemoProducts = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/admin/demo-products", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Demo Specs Loaded", {
          description: `Successfully imported ${data.count || 91} demo eyewear items.`,
        });
        await fetchInventory();
      } else {
        toast.error("Import Failed", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Import error", { description: err.message });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDeleteDemoProducts = async () => {
    setDemoLoading(true);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch("/api/admin/demo-products", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Demo Products Purged", {
          description: `Removed demo items from the database.`,
        });
        if (filter === "demo") setFilter("all");
        await fetchInventory();
      } else {
        toast.error("Purge Failed", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Purge error", { description: err.message });
    } finally {
      setDemoLoading(false);
    }
  };

  const isDemoActive = (stats.demoCount || 0) > 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Stock &amp; Inventory Controller
          </h1>
          <p className="text-xs text-stone-500">
            Real-time SKU stock levels, warehouse allocations, and demo specs management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            disabled={loading}
            className="text-xs border-[#E8DCCF] hover:bg-[#FAF7F2] text-[#0A251C] bg-white cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Demo Optical Specs Management Card */}
      <div className="relative overflow-hidden rounded-xl border border-[#E8DCCF] bg-[#0A251C] text-[#FAF7F2] p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide font-serif text-[#FAF7F2]">
                  Temporary Demo Optical Specs Feed
                </h2>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                    isDemoActive
                      ? "bg-amber-500/10 border-amber-400/30 text-amber-300"
                      : "bg-white/10 border-white/20 text-stone-300"
                  }`}
                >
                  {isDemoActive ? `${stats.demoCount} Demo Items Active` : "Empty / Inactive"}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                {isDemoActive
                  ? `Contains ${stats.demoCount} demo eyewear products populated from specifications feed. Tagged for temporary catalog display.`
                  : "No demo products are currently loaded in the database. You can instantly seed demo eyewear dataset with full specifications."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDemoActive ? (
              <>
                <button
                  type="button"
                  onClick={() => setFilter(filter === "demo" ? "all" : "demo")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filter === "demo"
                      ? "bg-[#C5A059] border-[#C5A059] text-white"
                      : "bg-[#143e30] border-emerald-800 text-[#FAF7F2] hover:bg-[#1a4a3a]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{filter === "demo" ? "Showing Demo Items" : "View Demo Items"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={demoLoading}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {demoLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Purge All Demo Data (1-Click)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSeedDemoProducts}
                disabled={demoLoading}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#C5A059] hover:bg-[#b59049] text-white border border-[#C5A059] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {demoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Seed Demo Specs (Dataset)</span>
              </button>
            )}
          </div>
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
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Demo Catalog SKUs</span>
          </div>
          <div className="text-xl font-bold text-indigo-900">{stats.demoCount || 0}</div>
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
            placeholder="Search by SKU, product name, or brand..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-1 text-xs overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: `All Items (${stats.totalSkus})` },
            { id: "demo", label: `Demo Specs (${stats.demoCount || 0})` },
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
          <span className="text-xs text-stone-500 font-medium">Checking warehouse stock...</span>
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          title={filter === "demo" ? "No Demo Products Found" : "No Inventory Records"}
          description={
            filter === "demo"
              ? "No demo specs items currently in database. Click 'Seed Demo Specs' above to load."
              : "No SKUs match your filter criteria."
          }
        />
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-3">Eyewear Model</th>
                  <th className="py-3 px-3">Finish / Specs</th>
                  <th className="py-3 px-3">Category &amp; Brand</th>
                  <th className="py-3 px-3">Available Stock</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventory.map((item) => {
                  const stock = Number(item.stock_quantity);
                  let status = "in_stock";
                  if (stock === 0) status = "out_of_stock";
                  else if (stock <= 5) status = "low_stock";

                  const isDemoItem = item.specs?.is_demo === true;

                  return (
                    <tr key={item.variant_id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-stone-800">
                        {item.sku}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {item.image_url && (
                            <div className="w-9 h-9 rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0 relative">
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                sizes="36px"
                                className="object-cover"
                                unoptimized={item.image_url.startsWith("http")}
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#0A251C] flex items-center gap-1.5">
                              <span>{item.product_name}</span>
                              {isDemoItem && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-800 rounded">
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Slug: {item.product_slug} &bull; ₹{Number(item.base_price).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                            style={{ backgroundColor: item.color_hex || "#C5A059" }}
                          />
                          <span className="text-stone-700">{item.color_name}</span>
                        </div>
                        {item.specs?.shape && (
                          <div className="text-[10px] text-stone-400 capitalize">
                            {item.specs.shape} &bull; {item.specs.material || "Titanium"}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-stone-800">{item.brand_name || "Shivam"}</div>
                        <div className="text-[10px] text-stone-500 capitalize">{item.category_name}</div>
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
                            onClick={() => handleStockDelta(item.variant_id, -1)}
                            disabled={stock <= 0 || updatingId === item.variant_id}
                            className="p-1 rounded hover:bg-white text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-semibold text-xs min-w-[28px] text-center">
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockDelta(item.variant_id, 1)}
                            disabled={updatingId === item.variant_id}
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

      {/* 1-Click Purge Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8DCCF] space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#0A251C] font-serif">
                Purge All Demo Products?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                This will permanently delete all <strong className="text-stone-800">{stats.demoCount || 0} demo products</strong>, their variant stock records, and associated images from the database.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-left mt-2">
                <strong>Safety Notice:</strong> Core store products and customer orders will remain completely untouched.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={demoLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDemoProducts}
                disabled={demoLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {demoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm 1-Click Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
