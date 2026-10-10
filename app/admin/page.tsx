"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { KpiCardsRow } from "@/components/admin/dashboard/KpiCardsRow";
import { OperationalAlerts } from "@/components/admin/dashboard/OperationalAlerts";
import { SalesChart } from "@/components/admin/dashboard/SalesChart";
import { RecentOrdersCard } from "@/components/admin/dashboard/RecentOrdersCard";
import { AlertTriangle, ArrowRight, Loader2, Package, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [dashboardData, setDashboardData] = useState<any>(null);

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
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        <span className="text-xs text-stone-500 font-medium">
          Loading optical retail operations data...
        </span>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  };

  const statusCounts = dashboardData?.statusCounts || {
    confirmed: 0,
    optician_assembly: 0,
    quality_check: 0,
    dispatched: 0,
    delivered: 0,
  };

  const lowStock = dashboardData?.lowStock || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const salesHistory = dashboardData?.salesHistory || [];
  const topProducts = dashboardData?.topProducts || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Section: Header & Refresh Action */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Executive Command Center
          </h1>
          <p className="text-xs text-stone-500">
            Shivam Optics (Mayur Vihar Atelier) Luxury Eyewear & Laboratory Analytics
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E8DCCF] text-xs font-medium text-stone-600 hover:text-[#0A251C] hover:border-stone-400 transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <KpiCardsRow
        data={stats}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Operational Lab & Stock Alert Strip */}
      <OperationalAlerts
        statusCounts={statusCounts}
        lowStockCount={lowStock.length}
      />

      {/* Two Column Grid: Sales Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesChart data={salesHistory} />
        </div>

        {/* Top Selling Models Card */}
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0A251C] font-serif">Top Eyewear Models</h3>
              <p className="text-xs text-stone-500">Best-performing frames by revenue</p>
            </div>
            <Package className="w-4 h-4 text-[#C5A059]" />
          </div>

          <div className="flex-1 space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F2] border border-stone-100"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-[#0A251C] truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {p.brand} • {p.unitsSold} units sold
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#0A251C]">
                      ₹{(p.revenue || p.price * p.unitsSold).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-stone-400">
                Awaiting more sales data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Orders + Low Stock Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentOrdersCard orders={recentOrders} />
        </div>

        {/* Low Stock Restock Panel */}
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0A251C] font-serif flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Urgent Inventory Alert</span>
              </h3>
              <p className="text-xs text-stone-500">Frames with 5 or fewer units remaining</p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {lowStock && lowStock.length > 0 ? (
              lowStock.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/40"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-[#0A251C] truncate">
                      {item.product_name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      SKU: {item.sku} ({item.color_name})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {item.stock_quantity} left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-stone-500">
                All catalog inventory levels are healthy.
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto border-t border-stone-100">
            <Link
              href="/admin/inventory"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#FAF7F2] border border-[#E8DCCF] hover:border-stone-400 text-xs font-semibold text-[#0A251C] transition-colors"
            >
              <span>Manage All Inventory</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
