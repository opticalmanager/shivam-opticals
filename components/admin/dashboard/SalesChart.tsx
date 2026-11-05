"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ShieldCheck, ArrowRight, CreditCard, Activity } from "lucide-react";

interface SalesPoint {
  date?: string;
  label: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesPoint[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const points = data || [];
  const totalPeriodRevenue = points.reduce((acc, p) => acc + Number(p.revenue || 0), 0);
  const totalPeriodOrders = points.reduce((acc, p) => acc + Number(p.orders || 0), 0);
  const maxRevenue = Math.max(...points.map((p) => Number(p.revenue || 0)), 1000);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hasSales = totalPeriodRevenue > 0;

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0A251C] font-serif">
              Revenue &amp; Orders Trend
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF3EB] text-[#C5A059] border border-[#E8DEC8] uppercase tracking-wider">
              {hasSales ? "Live Turnover" : "Atelier Gateway Ready"}
            </span>
          </div>
          <p className="text-xs text-[#716B64] mt-0.5">
            Daily gross turnover across verified checkout orders
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
            <span className="text-stone-600 font-medium">Daily Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A251C]" />
            <span className="text-stone-600 font-medium">Orders Count</span>
          </div>
        </div>
      </div>

      {/* Main Visual Workspace */}
      {!hasSales ? (
        /* ELEGANT PRE-LAUNCH / ZERO TRANSACTIONS VIEW: Clean, no ugly broken teeth */
        <div className="relative py-8 px-4 rounded-xl bg-gradient-to-b from-[#FAF7F2] to-white border border-dashed border-[#E8DEC8] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] mb-3 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-sm font-bold text-[#0A251C] mb-1">
            Awaiting Customer Checkout Transactions
          </h4>
          <p className="text-xs text-[#716B64] max-w-md mb-4 leading-relaxed">
            The storefront catalog and Razorpay payment checkout are fully operational. As soon as
            patrons complete purchases, revenue trends will plot here in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-xs font-semibold text-[#0A251C] transition cursor-pointer shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Gateway Settings</span>
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
            >
              <span>View Orders Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Subtle timeline track indicators */}
          <div className="w-full mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-400 font-medium overflow-x-auto">
            {points.slice(-7).map((pt, idx) => (
              <span key={idx} className="shrink-0">
                {pt.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* LIVE REVENUE CHART: Sleek interactive bars with luxury gold highlights */
        <div className="space-y-3">
          <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-stone-100">
            {points.map((pt, idx) => {
              const rev = Number(pt.revenue || 0);
              const heightPercent = maxRevenue > 0 ? Math.max(8, Math.round((rev / maxRevenue) * 100)) : 8;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-[#0A251C] text-white text-[11px] px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-[#C5A059]/30">
                      <div className="font-bold text-[#C5A059]">{formatCurrency(rev)}</div>
                      <div className="text-[9px] text-stone-300">
                        {pt.orders} {pt.orders === 1 ? "Order" : "Orders"} · {pt.label}
                      </div>
                    </div>
                  )}

                  {/* Bar Element */}
                  <div className="w-full max-w-[32px] bg-[#FAF3EB] rounded-t-md relative flex flex-col justify-end overflow-hidden h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        rev > 0
                          ? "bg-gradient-to-t from-[#C5A059] to-[#d6b777] group-hover:from-[#b59049] group-hover:to-[#C5A059]"
                          : "bg-stone-200/70"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium mt-2 truncate max-w-[36px]">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Period Summary Footer */}
          <div className="flex items-center justify-between text-xs pt-2 text-[#716B64]">
            <span>
              Total Period Revenue:{" "}
              <strong className="text-[#0A251C] font-mono">{formatCurrency(totalPeriodRevenue)}</strong>
            </span>
            <span>
              Total Orders: <strong className="text-[#0A251C]">{totalPeriodOrders}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
