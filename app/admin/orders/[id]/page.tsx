"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Send,
  Loader2,
  Save,
  Glasses,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";
import { StoredOrder } from "@/lib/adminDb";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Editable fields
  const [newStatus, setNewStatus] = useState("");
  const [courierPartner, setCourierPartner] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setNewStatus(data.order.status);
        setCourierPartner(data.order.courier_partner || "Delhivery Air");
        setTrackingNumber(data.order.tracking_number || "");
      }
    } catch (err) {
      console.warn("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const handleUpdateOrder = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courierPartner,
          trackingNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order status updated successfully", {
          description: `Order is now marked as ${newStatus.replace(/_/g, " ")}.`,
        });
        fetchOrderDetail();
      } else {
        toast.error("Failed to update order", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Update error", { description: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const labSteps = [
    { id: "confirmed", label: "Order Confirmed", icon: Clock },
    { id: "optician_assembly", label: "Optician Assembly", icon: Wrench },
    { id: "quality_check", label: "Quality Check", icon: ShieldCheck },
    { id: "dispatched", label: "Dispatched", icon: Send },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentStepIndex = labSteps.findIndex((s) => s.id === order?.status);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        <span className="text-xs text-stone-500 font-medium">Loading optical order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Order not found in database.
      </div>
    );
  }

  const shipping = order.shipping_address || ({} as any);
  const items = order.items || [];

  return (
    <>
      <div className="space-y-5 animate-in fade-in duration-200 print:hidden">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/orders")}
              className="p-1.5 rounded-md hover:bg-black/5 text-stone-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#0A251C] font-serif">
                  Order {order.order_number}
                </h1>
                <StatusBadge status={order.status} size="sm" />
                <StatusBadge status={order.payment_status} size="sm" />
              </div>
              <p className="text-xs text-stone-500">
                Placed on {new Date(order.created_at).toLocaleString("en-IN")} • Tracking:{" "}
                <span className="font-mono text-stone-700">{order.tracking_number}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs bg-white border-stone-300"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print GST Invoice</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleUpdateOrder}
              disabled={updating}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1" />
              )}
              <span>Save Updates</span>
            </Button>
          </div>
        </div>

        {/* Optical Lab Workflow Stepper */}
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-4 flex items-center justify-between">
            <span>Optical Laboratory Workflow Progress</span>
            <span className="text-stone-400 font-normal">
              Stage {Math.max(1, currentStepIndex + 1)} of 5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {labSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.id}
                  onClick={() => setNewStatus(step.id)}
                  className={`flex flex-col items-center text-center p-2 rounded-lg cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-[#FAF3EB] border border-[#C5A059] font-bold text-[#0A251C]"
                      : isCompleted
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                      isCurrent
                        ? "bg-[#C5A059] text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Left Items, Right Customer & Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column (2 Cols): Ordered Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#0A251C] font-serif flex items-center gap-2">
                <Glasses className="w-4 h-4 text-[#C5A059]" />
                <span>Eyewear & Lens Specifications</span>
              </h3>

              <div className="divide-y divide-stone-100">
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-[#0A251C]">
                          {it.product_name}
                        </div>
                        <div className="text-xs text-stone-500">
                          Colorway: <span className="font-medium text-stone-800">{it.color}</span>
                          {it.lens_package && (
                            <span> • Lens: <span className="text-purple-700 font-semibold">{it.lens_package}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-[#0A251C]">
                          ₹{Number(it.total_price).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-stone-400">Qty: {it.quantity}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Cost Breakdown */}
              <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-stone-900">₹{(order.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Privilege Discount ({order.coupon_code || "Special"}):</span>
                    <span>-₹{Number(order.discount_amount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Insured Shipping / Lab Delivery:</span>
                  <span>{order.shipping_fee === 0 ? "Complimentary" : `₹${order.shipping_fee}`}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#0A251C] border-t border-stone-200 pt-2">
                  <span>Total Amount:</span>
                  <span>₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Card */}
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#0A251C] font-serif flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A059]" />
                <span>Logistics & Fulfillment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    Airway Bill / Tracking ID
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Patron & Delivery Information */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                Patron Customer
              </h3>
              <div className="text-xs space-y-1 text-stone-700">
                <div className="font-bold text-stone-900 text-sm">
                  {shipping.fullName || order.guest_name || "Valued Client"}
                </div>
                <div>{order.guest_email}</div>
                <div>{order.guest_phone || shipping.phone}</div>
              </div>

              <div className="border-t border-stone-100 pt-3 text-xs space-y-1 text-stone-700">
                <span className="font-semibold text-stone-900 block mb-1">Delivery Address:</span>
                <div>{shipping.streetAddress}</div>
                {shipping.apartment && <div>{shipping.apartment}</div>}
                <div>
                  {shipping.city}, {shipping.state} - {shipping.pincode}
                </div>
                <div>{shipping.country || "India"}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                Payment Verification
              </h3>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Method:</span>
                  <span className="font-semibold text-stone-900 uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <StatusBadge status={order.payment_status} size="sm" />
                </div>
                {order.payment_id && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Reference:</span>
                    <span className="font-mono text-[10px] text-stone-800">{order.payment_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE GST TAX INVOICE (@media print) */}
      <div className="hidden print:block bg-white text-black p-8 max-w-[800px] mx-auto font-sans text-xs">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider font-serif">
              SHIVAM OPTICS
            </h1>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-stone-700">
              Haute Lunetterie Atelier & Optometry • Mayur Vihar, Delhi
            </p>
            <p className="text-[10px] text-stone-600 mt-1 max-w-md">
              Regd. Atelier: Pocket 1, Mayur Vihar Phase 1, New Delhi - 110091
              <br />
              GSTIN: 07AABCS1234F1Z9 | Phone: 097799 90207 | concierge@shivamoptics.in
            </p>
          </div>
          <div className="text-right">
            <div className="text-base font-bold uppercase tracking-wider">
              Tax Invoice
            </div>
            <div className="text-xs font-mono font-semibold mt-0.5">
              INV-{order.order_number}
            </div>
            <div className="text-[10px] text-stone-600">
              Date: {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs border border-stone-300 p-4 rounded">
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
              Billed & Shipped To:
            </div>
            <div className="font-bold text-sm text-black">
              {shipping.fullName || order.guest_name || "Valued Patron"}
            </div>
            <div className="text-stone-700 mt-0.5">
              {shipping.streetAddress}
              <br />
              {shipping.city}, {shipping.state} - {shipping.pincode}
              <br />
              India
            </div>
            <div className="text-stone-600 font-mono mt-1">
              Phone: {order.guest_phone || shipping.phone}
            </div>
            <div className="text-stone-600">Email: {order.guest_email}</div>
          </div>

          <div className="text-right">
            <div className="font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
              Dispatch & Logistics:
            </div>
            <div>
              <span className="font-semibold">Courier Partner:</span> {order.courier_partner || courierPartner || "Delhivery Air"}
            </div>
            <div>
              <span className="font-semibold">Tracking AWB:</span>{" "}
              <span className="font-mono">{order.tracking_number || trackingNumber || "Pending"}</span>
            </div>
            <div>
              <span className="font-semibold">Payment Mode:</span> {order.payment_method?.toUpperCase()}
            </div>
            <div>
              <span className="font-semibold">Payment Status:</span> {order.payment_status?.toUpperCase()}
            </div>
            {order.payment_id && (
              <div>
                <span className="font-semibold">Txn Reference:</span>{" "}
                <span className="font-mono">{order.payment_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Optical Products Table */}
        <div className="mb-6">
          <table className="w-full text-xs text-left border border-black border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-black text-[10px] uppercase font-bold">
                <th className="p-2 border-r border-black">S.No</th>
                <th className="p-2 border-r border-black">Item Description & Finish</th>
                <th className="p-2 border-r border-black">HSN Code</th>
                <th className="p-2 border-r border-black text-center">Qty</th>
                <th className="p-2 border-r border-black text-right">Unit Rate (₹)</th>
                <th className="p-2 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="border-b border-stone-300">
                  <td className="p-2 border-r border-stone-300 font-mono text-center">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-stone-300">
                    <div className="font-bold">{it.product_name}</div>
                    <div className="text-[10px] text-stone-600">
                      Colorway: {it.color} {it.lens_package ? `| ${it.lens_package}` : ""}
                    </div>
                  </td>
                  <td className="p-2 border-r border-stone-300 font-mono text-[10px]">
                    90031100
                  </td>
                  <td className="p-2 border-r border-stone-300 text-center font-mono">
                    {it.quantity}
                  </td>
                  <td className="p-2 border-r border-stone-300 text-right font-mono">
                    ₹{Number(it.unit_price).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2 text-right font-bold font-mono">
                    ₹{Number(it.total_price).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 text-xs space-y-1.5 border-t border-b border-black py-3">
            <div className="flex justify-between">
              <span className="text-stone-600">Taxable Value:</span>
              <span className="font-mono">
                ₹{Math.round(Number(order.total_amount) / 1.18).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">CGST (9.0%):</span>
              <span className="font-mono">
                ₹{Math.round((Number(order.total_amount) / 1.18) * 0.09).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">SGST (9.0%):</span>
              <span className="font-mono">
                ₹{Math.round((Number(order.total_amount) / 1.18) * 0.09).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">Insured Shipping:</span>
              <span className="font-mono text-emerald-700 font-semibold">
                {order.shipping_fee === 0 ? "FREE" : `₹${order.shipping_fee}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1.5">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-stone-200">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Terms & Conditions:
            </div>
            <p className="text-[9px] text-stone-500 leading-normal mt-0.5">
              1. Optical lenses are surfaced accurately according to verified optometric prescriptions.
              <br />
              2. Handcrafted titanium frames carry a comprehensive manufacturing warranty.
              <br />
              3. Computer-generated tax invoice from Shivam Optics Mayur Vihar atelier.
            </p>
          </div>
          <div className="text-right flex flex-col items-end justify-end">
            <div className="w-36 border-b border-black mb-1"></div>
            <div className="font-bold text-xs uppercase">For Shivam Optics</div>
            <div className="text-[10px] text-stone-500">Authorized Optician & Signatory</div>
          </div>
        </div>
      </div>
    </>
  );
}
