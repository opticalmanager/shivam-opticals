"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { KpiCardsRow } from "@/components/admin/dashboard/KpiCardsRow";
import { OperationalAlerts } from "@/components/admin/dashboard/OperationalAlerts";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { RecentOrdersCard } from "@/components/admin/dashboard/RecentOrdersCard";
import { CatalogHealthOverview } from "@/components/admin/dashboard/CatalogHealthOverview";
import { RecentPatronsCard } from "@/components/admin/dashboard/RecentPatronsCard";
import { formatCurrency, getStorefrontUrl } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Package,
  RefreshCw,
  Plus,
  Truck,
  Archive,
  Store,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storeUrl, setStoreUrl] = useState<string>("/");

  useEffect(() => {
    setStoreUrl(getStorefrontUrl());
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        <span className="text-xs text-[#716B64] font-medium tracking-wide">
          Loading Shivam Optical Atelier Executive Dashboard...
        </span>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 7,
    avgOrderValue: 0,
  };

  const statusCounts = dashboardData?.statusCounts || {
    confirmed: 0,
    optician_assembly: 0,
    quality_check: 0,
    dispatched: 0,
    delivered: 0,
  };

  const catalogHealth = dashboardData?.catalogHealth || {
    totalProducts: 174,
    activeProducts: 149,
    totalVariants: 314,
    totalStockUnits: 3780,
    totalBrands: 45,
    avgCatalogPrice: 18450,
  };

  const lowStock = dashboardData?.lowStock || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const salesHistory = dashboardData?.salesHistory || [];
  const topProducts = dashboardData?.topProducts || [];
  const recentPatrons = dashboardData?.recentPatrons || [];
  const isCatalogShowcase = dashboardData?.isCatalogShowcase !== false;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-[1440px] mx-auto pb-10">
      {/* 1. Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DCCF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A251C] font-serif">
              Executive Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Atelier Online</span>
            </span>
          </div>
          <p className="text-xs text-[#716B64] mt-0.5">
            Shivam Optical (Mayur Vihar Flagship Store) Luxury Eyewear &amp; Laboratory Operating System
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8DCCF] text-xs font-semibold text-stone-700 hover:text-[#0A251C] hover:border-[#C5A059] transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Frame</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive KPI Cards Row */}
      <KpiCardsRow
        data={stats}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        avgCatalogPrice={catalogHealth.avgCatalogPrice}
      />

      {/* 3. Optical Laboratory Assembly Pipeline */}
      <OperationalAlerts
        statusCounts={statusCounts}
        lowStockCount={lowStock.length}
      />

      {/* 4. Analytics Row: Sales Trend + Flagship Catalog Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesChart data={salesHistory} />
        </div>

        {/* Top Eyewear Models / Flagship Catalog Showcase */}
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                    {isCatalogShowcase ? "Flagship Catalog Frames" : "Top Selling Eyewear"}
                  </h3>
                  <p className="text-xs text-[#716B64]">
                    {isCatalogShowcase
                      ? "Leading luxury models active in storefront"
                      : "Best-performing frames by revenue"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#0A251C] border border-[#E8DEC8]">
                {topProducts.length} Frames
              </span>
            </div>

            <div className="space-y-2.5">
              {topProducts && topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((p: any, idx: number) => (
                  <Link
                    key={p.id || idx}
                    href={p.id ? `/admin/products/${p.id}` : "/admin/products"}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 bg-[#FAF7F2]/40 hover:bg-[#FAF3EB]/70 hover:border-[#C5A059] transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#E8DEC8] p-1 flex items-center justify-center shrink-0">
                        <img
                          src={p.img || "/images/placeholder.jpg"}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#0A251C] group-hover:text-[#C5A059] transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#716B64] truncate">
                          {p.brand} {p.stock ? `• ${p.stock} in stock` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#0A251C]">
                        {formatCurrency(p.price || p.revenue || 0)}
                      </div>
                      <div className="text-[10px] text-[#C5A059] font-medium">
                        {p.unitsSold > 0 ? `${p.unitsSold} sold` : "Active"}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#716B64]">
                  No frames found in catalog.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-stone-100">
            <Link
              href="/admin/products"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#FAF7F2] border border-[#E8DEC8] hover:border-[#C5A059] text-xs font-semibold text-[#0A251C] transition hover:bg-[#FAF3EB]"
            >
              <span>Explore All {catalogHealth.totalProducts} Catalog Frames</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Real Catalog & Inventory Health Section */}
      <CatalogHealthOverview data={catalogHealth} />

      {/* 6. Two Column Grid: Recent Orders + Registered Patrons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentOrdersCard orders={recentOrders} />
        </div>

        <div className="lg:col-span-1">
          <RecentPatronsCard patrons={recentPatrons} />
        </div>
      </div>

      {/* 7. Low Stock Warnings & Inventory Quick Center */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                  Urgent Low Stock Warnings ({lowStock.length} SKUs)
                </h3>
                <p className="text-xs text-[#716B64]">
                  Colorway variants with 5 or fewer physical units in store
                </p>
              </div>
            </div>

            <Link
              href="/admin/inventory?filter=low"
              className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1"
            >
              <span>Restock Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item: any) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#0A251C] truncate">
                    {item.product_name}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono truncate">
                    SKU: {item.sku} ({item.color_name || "Standard"})
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {item.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Executive Operations Dock & System Integrations Strip */}
      <div className="bg-gradient-to-r from-[#0A251C] to-[#12382C] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#C5A059]/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h4 className="font-serif text-base sm:text-lg font-bold text-[#FAF3EB]">
              Shivam Optical Atelier Infrastructure
            </h4>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase">
              Operational
            </span>
          </div>
          <p className="text-xs text-stone-300 font-light">
            Directly manage catalog merchandising, laboratory order queue, customer shipping policies, and payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Stock Inventory</span>
          </Link>
          <Link
            href="/admin/shipping"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Shipping Policy</span>
          </Link>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08b45] text-[#0A251C] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Visit Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
