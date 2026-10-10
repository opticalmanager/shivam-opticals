"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Eye, Users, Loader2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard?range=all")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((e) => console.warn("Analytics fetch error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    growth: {
      revenue: "0.0%",
      orders: "0.0%",
      customers: "0.0%",
      aov: "0.0%",
    },
  };

  const revGrowth = stats.growth?.revenue ?? "0.0%";
  const ordGrowth = stats.growth?.orders ?? "0.0%";
  const isRevPos = !revGrowth.startsWith("-");
  const isOrdPos = !ordGrowth.startsWith("-");

  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-3 border-b border-[#E8DCCF]">
        <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
          Commercial & Clinical Intelligence
        </h1>
        <p className="text-xs text-stone-500">
          Executive performance metrics, brand turnover, and frame demand analytics
        </p>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Cumulative Gross Turnover</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            ₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}
          </div>
          <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${isRevPos ? "text-emerald-700" : "text-rose-700"}`}>
            {isRevPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{revGrowth} vs prior period</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Total Orders Fulfilled</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">{stats.totalOrders || 0}</div>
          <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${isOrdPos ? "text-emerald-700" : "text-rose-700"}`}>
            {isOrdPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{ordGrowth} vs prior period</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Average Order Value</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">
            ₹{(stats.avgOrderValue || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">High-ticket luxury average</div>
        </div>

        <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Verified Patrons</span>
          </div>
          <div className="text-2xl font-bold text-[#0A251C]">{stats.totalCustomers || 0}</div>
          <div className="text-[11px] text-stone-500 mt-1">Registered clients & accounts</div>
        </div>
      </div>

      {/* Top Models Breakdown */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0A251C] font-serif">
          Top-Selling Eyewear Models by Revenue
        </h3>

        <div className="divide-y divide-stone-100">
          {topProducts.map((p: any, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF] flex items-center justify-center font-bold text-[#0A251C]">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-[#0A251C]">{p.name}</div>
                  <div className="text-stone-500 text-[11px]">{p.brand} &bull; {p.unitsSold} units</div>
                </div>
              </div>
              <div className="font-bold text-sm text-[#0A251C]">
                ₹{(p.revenue || p.price * p.unitsSold).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
