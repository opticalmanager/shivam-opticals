"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  Activity,
  Sparkles,
} from "lucide-react";

interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  growth?: {
    revenue?: string | null;
    orders?: string | null;
    customers?: string | null;
    aov?: string | null;
  };
}

interface KpiCardsRowProps {
  data: KpiData;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  avgCatalogPrice?: number;
}

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  avgCatalogPrice = 18450,
}) => {
  const revGrowth = data.growth?.revenue;
  const ordGrowth = data.growth?.orders;
  const aovGrowth = data.growth?.aov;
  const custGrowth = data.growth?.customers;

  const cards = [
    {
      id: "revenue",
      title: "GROSS REVENUE",
      value: `₹${(data.totalRevenue || 0).toLocaleString("en-IN")}`,
      growth: revGrowth,
      isPositive: revGrowth ? !revGrowth.startsWith("-") : true,
      contextFallback: data.totalRevenue > 0 ? "Verified checkout orders" : "Pre-Launch Ready",
      icon: IndianRupee,
    },
    {
      id: "orders",
      title: "TOTAL ORDERS",
      value: (data.totalOrders || 0).toLocaleString(),
      growth: ordGrowth,
      isPositive: ordGrowth ? !ordGrowth.startsWith("-") : true,
      contextFallback: data.totalOrders > 0 ? "Completed & in assembly" : "Gateway Active",
      icon: ShoppingBag,
    },
    {
      id: "aov",
      title: "AVG. ORDER VALUE",
      value:
        data.avgOrderValue > 0
          ? `₹${data.avgOrderValue.toLocaleString("en-IN")}`
          : `₹${avgCatalogPrice.toLocaleString("en-IN")}`,
      subtitle: data.avgOrderValue > 0 ? "Order Basket Median" : "Catalog Portfolio MRP",
      growth: aovGrowth,
      isPositive: aovGrowth ? !aovGrowth.startsWith("-") : true,
      contextFallback: data.avgOrderValue > 0 ? "Per completed ticket" : "Median Frame Price",
      icon: Package,
    },
    {
      id: "customers",
      title: "PATRONS",
      value: (data.totalCustomers || 0).toLocaleString(),
      growth: custGrowth,
      isPositive: custGrowth ? !custGrowth.startsWith("-") : true,
      contextFallback: "Verified Patron Accounts",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Time Range Selector Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#0A251C] font-serif">
            Operations &amp; Store Command
          </h2>
          <p className="text-xs text-[#716B64]">
            Real-time optical retail performance and laboratory assembly metrics
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#FAF3EB] p-1 rounded-lg border border-[#E8DCCF] text-xs overflow-x-auto scrollbar-none snap-x snap-mandatory">
          {[
            { id: "all", label: "All time" },
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 days" },
            { id: "30d", label: "Last 30 days" },
            { id: "this_month", label: "This month" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTimeRangeChange(t.id)}
              className={`shrink-0 snap-start whitespace-nowrap px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                timeRange === t.id
                  ? "bg-white text-[#0A251C] shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-[#0A251C]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white border border-[#E8DCCF] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#C5A059] transition-all group"
            >
              <div className="flex items-center justify-between text-stone-400 mb-2.5">
                <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{card.title}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" title="Live Synced" />
              </div>

              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C] tracking-tight mb-2">
                {card.value}
              </div>

              {card.growth ? (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px] ${
                      card.isPositive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                        : "text-rose-700 bg-rose-50 border border-rose-200"
                    }`}
                  >
                    {card.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {card.growth}
                  </span>
                  <span className="text-[11px] text-[#716B64]">vs prior period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#716B64]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  <span className="text-[11px] font-medium">{card.contextFallback}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
