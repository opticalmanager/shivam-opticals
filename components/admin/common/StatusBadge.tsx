import React from "react";
import { cn } from "@/lib/utils";

export type AdminStatus =
  | "published"
  | "draft"
  | "inactive"
  | "out_of_stock"
  | "low_stock"
  | "in_stock"
  | "confirmed"
  | "optician_assembly"
  | "quality_check"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "pending"
  | "refunded"
  | "failed"
  | "active"
  | "scheduled"
  | "expired";

interface StatusBadgeProps {
  status: AdminStatus | string;
  size?: "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "sm",
  className,
  showDot = true,
}) => {
  const normStatus = (status || "").toLowerCase().replace(/\s+/g, "_");

  let bg = "bg-stone-100 text-stone-700 border-stone-200";
  let dot = "bg-stone-400";
  let label = status;

  switch (normStatus) {
    case "published":
    case "active":
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dot = "bg-emerald-500";
      label = "Published";
      break;
    case "draft":
      bg = "bg-stone-100 text-stone-700 border-stone-200";
      dot = "bg-stone-400";
      label = "Draft";
      break;
    case "inactive":
      bg = "bg-rose-50 text-rose-700 border-rose-200";
      dot = "bg-rose-500";
      label = "Inactive";
      break;
    case "out_of_stock":
    case "out_stock":
      bg = "bg-amber-50 text-amber-800 border-amber-200";
      dot = "bg-amber-500";
      label = "Out of Stock";
      break;
    case "low_stock":
      bg = "bg-orange-50 text-orange-800 border-orange-200";
      dot = "bg-orange-500";
      label = "Low Stock";
      break;
    case "in_stock":
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dot = "bg-emerald-500";
      label = "In Stock";
      break;
    case "confirmed":
      bg = "bg-blue-50 text-blue-700 border-blue-200";
      dot = "bg-blue-500";
      label = "Order Confirmed";
      break;
    case "optician_assembly":
      bg = "bg-purple-50 text-purple-700 border-purple-200";
      dot = "bg-purple-500";
      label = "In Lab Assembly";
      break;
    case "quality_check":
      bg = "bg-amber-50 text-amber-800 border-amber-200";
      dot = "bg-amber-500";
      label = "Quality Check";
      break;
    case "dispatched":
      bg = "bg-indigo-50 text-indigo-700 border-indigo-200";
      dot = "bg-indigo-500";
      label = "Dispatched";
      break;
    case "delivered":
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dot = "bg-emerald-500";
      label = "Delivered";
      break;
    case "cancelled":
      bg = "bg-rose-50 text-rose-700 border-rose-200";
      dot = "bg-rose-500";
      label = "Cancelled";
      break;
    case "paid":
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dot = "bg-emerald-500";
      label = "Paid";
      break;
    case "pending":
    case "unpaid":
      bg = "bg-amber-50 text-amber-800 border-amber-200";
      dot = "bg-amber-500";
      label = "Pending / COD";
      break;
    case "refunded":
      bg = "bg-purple-50 text-purple-700 border-purple-200";
      dot = "bg-purple-500";
      label = "Refunded";
      break;
    default:
      label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        bg,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />}
      <span>{label}</span>
    </span>
  );
};
