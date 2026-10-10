import React from "react";
import Link from "next/link";
import { Wrench, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

interface StatusCounts {
  confirmed: number;
  optician_assembly: number;
  quality_check: number;
  dispatched: number;
  delivered: number;
}

interface OperationalAlertsProps {
  statusCounts: StatusCounts;
  lowStockCount: number;
}

export const OperationalAlerts: React.FC<OperationalAlertsProps> = ({
  statusCounts,
  lowStockCount,
}) => {
  const alerts = [
    {
      id: "assembly",
      label: "In Lab Assembly",
      count: statusCounts.optician_assembly || 0,
      desc: "Lenses being surfaced & mounted",
      icon: Wrench,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      href: "/admin/orders?status=optician_assembly",
    },
    {
      id: "qc",
      label: "Quality Check Pending",
      count: statusCounts.quality_check || 0,
      desc: "Axis alignment & prescription verification",
      icon: CheckCircle2,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      href: "/admin/orders?status=quality_check",
    },
    {
      id: "low-stock",
      label: "Low Stock Inventory",
      count: lowStockCount || 0,
      desc: "SKUs below 5 units threshold",
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      href: "/admin/inventory?filter=low",
    },
    {
      id: "confirmed",
      label: "New Orders to Review",
      count: statusCounts.confirmed || 0,
      desc: "Pending lab dispatch routing",
      icon: ShieldAlert,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/admin/orders?status=confirmed",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {alerts.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.id}
            href={a.href}
            className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E8DCCF] hover:border-[#C5A059] transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${a.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#0A251C]">{a.label}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700">
                    {a.count}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 truncate">{a.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C5A059] shrink-0 transition-colors ml-2" />
          </Link>
        );
      })}
    </div>
  );
};
