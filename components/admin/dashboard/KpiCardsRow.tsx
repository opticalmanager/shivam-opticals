import React from "react";
import { TrendingUp, TrendingDown, MoreVertical, IndianRupee, ShoppingBag, Users, Package } from "lucide-react";

interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  growth?: {
    revenue?: string;
    orders?: string;
    customers?: string;
    aov?: string;
  };
}

interface KpiCardsRowProps {
  data: KpiData;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
}

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
    const revGrowth = data.growth?.revenue ?? "0.0%";
    const ordGrowth = data.growth?.orders ?? "0.0%";
    const aovGrowth = data.growth?.aov ?? "0.0%";
    const custGrowth = data.growth?.customers ?? "0.0%";

    const cards = [
      {
        id: "revenue",
        title: "TOTAL REVENUE",
        value: `₹${(data.totalRevenue || 0).toLocaleString("en-IN")}`,
        growth: revGrowth,
        isPositive: !revGrowth.startsWith("-"),
        icon: IndianRupee,
      },
      {
        id: "orders",
        title: "TOTAL ORDERS",
        value: (data.totalOrders || 0).toLocaleString(),
        growth: ordGrowth,
        isPositive: !ordGrowth.startsWith("-"),
        icon: ShoppingBag,
      },
      {
        id: "aov",
        title: "AVG. ORDER VALUE",
        value: `₹${(data.avgOrderValue || 0).toLocaleString("en-IN")}`,
        growth: aovGrowth,
        isPositive: !aovGrowth.startsWith("-"),
        icon: Package,
      },
      {
        id: "customers",
        title: "PATRONS",
        value: (data.totalCustomers || 0).toLocaleString(),
        growth: custGrowth,
        isPositive: !custGrowth.startsWith("-"),
        icon: Users,
      },
    ];

  return (
    <div className="space-y-3">
      {/* Time Range Selector Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#0A251C] font-serif">
            Operations & Atelier Command
          </h2>
          <p className="text-xs text-stone-500">
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
              className="bg-white border border-[#E8DCCF] rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#C5A059]" />
                  {card.title}
                </span>
                <button
                  type="button"
                  aria-label="More options"
                  className="text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xl sm:text-2xl font-bold text-[#0A251C] tracking-tight mb-2">
                {card.value}
              </div>

              {card.growth ? (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px] ${
                      card.isPositive
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-rose-700 bg-rose-50"
                    }`}
                  >
                    {card.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {card.growth}
                  </span>
                  <span className="text-[11px] text-stone-400">vs prior period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="text-[11px]">Verified boutique registry</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
