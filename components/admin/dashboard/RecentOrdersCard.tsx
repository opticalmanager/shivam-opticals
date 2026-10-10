import React from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";

interface RecentOrder {
  id: string;
  order_number: string;
  guest_email: string;
  guest_phone: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  shipping_address?: {
    fullName?: string;
    city?: string;
  };
  created_at: string;
  items?: any[];
}

interface RecentOrdersCardProps {
  orders: RecentOrder[];
}

export const RecentOrdersCard: React.FC<RecentOrdersCardProps> = ({ orders }) => {
  return (
    <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#0A251C] font-serif">Recent Optical Orders</h3>
          <p className="text-xs text-stone-500">Live order queue requiring assembly and dispatch</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-[#C5A059] hover:text-[#b59049] flex items-center gap-1 transition-colors"
        >
          <span>View All Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-100 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              <th className="pb-2.5">Order</th>
              <th className="pb-2.5">Customer</th>
              <th className="pb-2.5">Total</th>
              <th className="pb-2.5">Payment</th>
              <th className="pb-2.5">Lab Status</th>
              <th className="pb-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders && orders.length > 0 ? (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors group">
                  <td className="py-3 font-semibold text-[#0A251C]">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.order_number}
                    </Link>
                    <div className="text-[10px] text-stone-400 font-normal">
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="font-medium text-stone-800 truncate max-w-[150px]">
                      {o.shipping_address?.fullName || "Valued Patron"}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate max-w-[150px]">
                      {o.guest_email}
                    </div>
                  </td>
                  <td className="py-3 font-semibold text-[#0A251C]">
                    ₹{(o.total_amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={o.payment_status} size="sm" />
                  </td>
                  <td className="py-3">
                    <StatusBadge status={o.status} size="sm" />
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-[#C5A059] p-1 rounded hover:bg-stone-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-stone-400">
                  No recent orders available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
