"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { EmptyState } from "@/components/admin/common/EmptyState";
import { StoredOrder } from "@/lib/adminDb";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.warn("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExportOrders = () => {
    const rows = orders.map((o) => ({
      OrderNumber: o.order_number,
      Customer: o.shipping_address?.fullName || o.guest_email,
      Email: o.guest_email,
      Phone: o.guest_phone,
      Date: o.created_at,
      Total: o.total_amount,
      PaymentStatus: o.payment_status,
      OrderStatus: o.status,
      Tracking: o.tracking_number,
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["OrderNumber,Customer,Email,Phone,Date,Total,PaymentStatus,OrderStatus,Tracking"]
        .concat(
          rows.map(
            (r) =>
              `"${r.OrderNumber}","${r.Customer}","${r.Email}","${r.Phone}","${r.Date}","${r.Total}","${r.PaymentStatus}","${r.OrderStatus}","${r.Tracking}"`
          )
        )
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `shivam_optics_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Order Fulfillment & Lab Workflow
          </h1>
          <p className="text-xs text-stone-500">
            Monitor optical surfacing, axis calibration, quality check, and courier dispatch
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportOrders}
          className="text-xs h-8 bg-white border-[#E8DCCF] text-stone-700"
        >
          <Download className="w-3.5 h-3.5 mr-1 text-stone-500" />
          <span>Export Orders</span>
        </Button>
      </div>

      {/* Optical Lab Workflow Status Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-xs select-none">
        {[
          { id: "all", label: "All Orders", count: counts.all },
          { id: "confirmed", label: "Confirmed", count: counts.confirmed },
          { id: "optician_assembly", label: "Lens Fitting & Assembly", count: counts.optician_assembly },
          { id: "quality_check", label: "Quality Inspection", count: counts.quality_check },
          { id: "dispatched", label: "Ready for Dispatch", count: counts.dispatched },
          { id: "delivered", label: "Delivered", count: counts.delivered },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatus(tab.id);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              status === tab.id
                ? "border-[#C5A059] text-[#0A251C] font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  status === tab.id
                    ? "bg-[#C5A059] text-white font-bold"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E8DCCF] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search by order #, patron name, email, or tracking ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059]"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-hidden focus:border-[#C5A059] cursor-pointer"
          >
            <option value="all">All Payment States</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending / COD</option>
          </select>
        </div>

        {(search || status !== "all" || paymentStatus !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPaymentStatus("all");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin mb-2" />
          <span className="text-xs text-stone-500 font-medium">Loading orders queue...</span>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="There are currently no orders matching your selected filters."
          actionLabel="View All Orders"
          onAction={() => {
            setSearch("");
            setStatus("all");
            setPaymentStatus("all");
          }}
        />
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order & Date</th>
                  <th className="py-3 px-3">Patron Customer</th>
                  <th className="py-3 px-3">Ordered Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Lab / Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F2]/80 transition-colors group">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-bold text-[#0A251C] hover:text-[#C5A059] hover:underline block font-mono"
                      >
                        {o.order_number}
                      </Link>
                      <div className="text-[10px] text-stone-400">
                        {new Date(o.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-800 truncate max-w-[170px]">
                        {o.shipping_address?.fullName || o.guest_name || "Valued Patron"}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate max-w-[170px]">
                        {o.guest_email}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {o.shipping_address?.city || o.guest_phone}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-xs font-medium text-stone-800">
                        {o.items && o.items.length > 0 ? (
                          o.items[0].product_name || "Eyewear Frame"
                        ) : (
                          "1 Item"
                        )}
                      </div>
                      {o.items && o.items.length > 1 && (
                        <div className="text-[10px] text-stone-500">
                          +{o.items.length - 1} more item(s)
                        </div>
                      )}
                      {o.items?.[0]?.lens_package && (
                        <div className="text-[10px] text-purple-700 font-medium">
                          {o.items[0].lens_package}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0A251C]">
                        ₹{Number(o.total_amount).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase">
                        {o.payment_method}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={o.payment_status} size="sm" />
                      {o.payment_id && (
                        <div
                          className="font-mono text-[9px] text-stone-500 mt-1 truncate max-w-[100px]"
                          title={`Gateway Txn ID: ${o.payment_id}`}
                        >
                          {o.payment_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={o.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-[#C5A059] px-2 py-1 rounded bg-[#FAF7F2] border border-[#E8DCCF] hover:border-stone-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-stone-500 p-3 border-t border-stone-200">
            <div>
              Showing {Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)} to{" "}
              {Math.min(pagination.total, pagination.page * pagination.limit)} of {pagination.total} orders
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="text-xs h-7 px-2.5 bg-white border-stone-300"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-stone-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="text-xs h-7 px-2.5 bg-white border-stone-300"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
