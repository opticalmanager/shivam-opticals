"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Truck,
  PackageCheck,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

interface StatusCounts {
  confirmed: number;
  optician_assembly: number;
  quality_check: number;
  dispatched: number;
  delivered: number;
}

interface OperationalAlertsProps {
  statusCounts: StatusCounts;
  lowStockCount?: number;
}

export const OperationalAlerts: React.FC<OperationalAlertsProps> = ({ statusCounts }) => {
  const stages = [
    {
      id: "confirmed",
      label: "1. Confirmed",
      count: statusCounts.confirmed || 0,
      desc: "Ready for Assembly",
      icon: ShieldAlert,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      activeBg: "hover:bg-blue-50/50 hover:border-blue-300",
      href: "/admin/orders?status=confirmed",
    },
    {
      id: "optician_assembly",
      label: "2. Lab Assembly",
      count: statusCounts.optician_assembly || 0,
      desc: "Lens Edging & Mounting",
      icon: Wrench,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      activeBg: "hover:bg-purple-50/50 hover:border-purple-300",
      href: "/admin/orders?status=optician_assembly",
    },
    {
      id: "quality_check",
      label: "3. Quality Check",
      count: statusCounts.quality_check || 0,
      desc: "Rx & Axis Verification",
      icon: CheckCircle2,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      activeBg: "hover:bg-amber-50/50 hover:border-amber-300",
      href: "/admin/orders?status=quality_check",
    },
    {
      id: "dispatched",
      label: "4. Dispatched",
      count: statusCounts.dispatched || 0,
      desc: "Courier In Transit",
      icon: Truck,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      activeBg: "hover:bg-indigo-50/50 hover:border-indigo-300",
      href: "/admin/orders?status=dispatched",
    },
    {
      id: "delivered",
      label: "5. Delivered",
      count: statusCounts.delivered || 0,
      desc: "Completed & Verified",
      icon: PackageCheck,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeBg: "hover:bg-emerald-50/50 hover:border-emerald-300",
      href: "/admin/orders?status=delivered",
    },
  ];

  const totalInQueue =
    (statusCounts.confirmed || 0) +
    (statusCounts.optician_assembly || 0) +
    (statusCounts.quality_check || 0);

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-2xl p-4 sm:p-5 shadow-2xs">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A251C] font-serif">
              Optical Laboratory Assembly Pipeline
            </h3>
            <p className="text-xs text-[#716B64]">
              Real-time 5-stage prescription lens fitting and fulfillment flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#716B64]">
            Active Lab Load:{" "}
            <strong className="text-[#0A251C] font-mono">{totalInQueue}</strong> orders
          </span>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[#C5A059] hover:underline"
          >
            Manage Queue →
          </Link>
        </div>
      </div>

      {/* 5-Stage Interactive Steps Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <Link
              key={stage.id}
              href={stage.href}
              className={`p-3 rounded-xl border border-[#E8DCCF] bg-[#FCFAF7] transition-all group flex flex-col justify-between ${stage.activeBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}>
                  {stage.count} {stage.count === 1 ? "Job" : "Jobs"}
                </span>
                <Icon className="w-4 h-4 text-stone-400 group-hover:text-[#C5A059] transition-colors" />
              </div>

              <div>
                <div className="text-xs font-bold text-[#0A251C] group-hover:text-[#C5A059] transition-colors leading-snug">
                  {stage.label}
                </div>
                <div className="text-[10px] text-[#716B64] truncate mt-0.5">{stage.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
