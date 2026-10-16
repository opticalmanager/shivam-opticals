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
  User,
  MapPin,
  CreditCard,
  Glasses,
  Copy,
  Check,
  PackageCheck,
  Package,
  AlertCircle,
  FileDown,
  Edit3,
  Building2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);

  // Editable fields
  const [newStatus, setNewStatus] = useState("");
  const [courierPartner, setCourierPartner] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Shiprocket states
  const [courierOptions, setCourierOptions] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | undefined>(undefined);
  const [bookingShiprocket, setBookingShiprocket] = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);

  // Product-Level Packaging Dimensions
  const [packageDimensions, setPackageDimensions] = useState<{
    length: number | string;
    breadth: number | string;
    height: number | string;
    weight: number | string;
  }>({
    length: "",
    breadth: "",
    height: "",
    weight: "",
  });
  const [dimensionsAutofetched, setDimensionsAutofetched] = useState(false);
  const [productNameForDims, setProductNameForDims] = useState<string>("");

  // Consignment Origin / Pickup Point details
  const [pickupDetails, setPickupDetails] = useState({
    location: "work",
    address: "Pocket 1, Mayur Vihar Phase 1",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110091",
  });
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [editLocationName, setEditLocationName] = useState("work");
  const [editAddress, setEditAddress] = useState("Pocket 1, Mayur Vihar Phase 1");
  const [editCity, setEditCity] = useState("New Delhi");
  const [editState, setEditState] = useState("Delhi");
  const [editPincode, setEditPincode] = useState("110091");
  const [saveAsDefaultPickup, setSaveAsDefaultPickup] = useState(false);

  const fetchCourierRates = async (deliveryPincode: string, customPickupPin?: string, customWeight?: number) => {
    if (!deliveryPincode || deliveryPincode.length !== 6) return;
    setLoadingCouriers(true);
    try {
      const pin = customPickupPin || pickupDetails.pincode || "110091";
      const res = await fetch("/api/admin/shipping/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calculate_rates",
          deliveryPincode,
          pickupPincode: pin,
          weight: customWeight,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.couriers) && data.couriers.length > 0) {
          setCourierOptions(data.couriers);
          const rec = data.couriers.find((c: any) => c.isRecommended) || data.couriers[0];
          setSelectedCourierId(rec.courierId);
        }
        if (data.pickupLocation) {
          const loaded = {
            location: data.pickupLocation,
            address: data.pickupAddress || "GF-45D, Spectrum metro mall, Phase-1, Sector 75",
            city: data.pickupCity || "Noida",
            state: data.pickupState || "Uttar Pradesh",
            pincode: data.pickupPincode || "201316",
          };
          setPickupDetails(loaded);
          setEditLocationName(loaded.location);
          setEditAddress(loaded.address);
          setEditCity(loaded.city);
          setEditState(loaded.state);
          setEditPincode(loaded.pincode);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch Shiprocket rates:", e);
    } finally {
      setLoadingCouriers(false);
    }
  };

  const handleUpdatePickupPoint = async () => {
    const updated = {
      location: editLocationName.trim() || "work",
      address: editAddress.trim(),
      city: editCity.trim() || "Noida",
      state: editState.trim() || "Uttar Pradesh",
      pincode: editPincode.trim() || "201316",
    };
    setPickupDetails(updated);
    setIsEditingPickup(false);

    if (saveAsDefaultPickup) {
      try {
        await fetch("/api/admin/shipping/shiprocket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_pickup_location",
            pickupLocation: updated.location,
            pickupAddress: updated.address,
            pickupCity: updated.city,
            pickupState: updated.state,
            pickupPincode: updated.pincode,
          }),
        });
        toast.success("Primary pickup location saved to settings");
      } catch (err) {
        console.warn("Failed to persist default pickup location:", err);
      }
    }

    if (order?.shipping_address?.pincode) {
      fetchCourierRates(order.shipping_address.pincode, updated.pincode);
    }
  };

  const handleBookShiprocket = async () => {
    if (
      !packageDimensions.weight ||
      !packageDimensions.length ||
      !packageDimensions.breadth ||
      !packageDimensions.height
    ) {
      toast.error("Packaging Dimensions Required", {
        description:
          "Please enter Dead Weight, Length, Breadth, and Height in the Packaging Specification box before booking courier.",
      });
      return;
    }

    setBookingShiprocket(true);
    const selectedCourier =
      courierOptions.find((c) => c.courierId === selectedCourierId) || courierOptions[0];

    try {
      const res = await fetch("/api/admin/shipping/shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book_shipment",
          orderId: id,
          courierId: selectedCourierId,
          pickupLocation: pickupDetails.location,
          deliveryCost: selectedCourier?.rate,
          dimensions: {
            length: Number(packageDimensions.length),
            breadth: Number(packageDimensions.breadth),
            height: Number(packageDimensions.height),
          },
          weight: Number(packageDimensions.weight),
        }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        toast.success("Shipment Booked Successfully", {
          description: `${data.booking.courierName} • AWB: ${data.booking.awbCode}`,
        });
        setTrackingNumber(data.booking.awbCode);
        setCourierPartner(data.booking.courierName);
        setNewStatus("dispatched");
        fetchOrderDetail();
      } else {
        toast.error("Failed to book shipment", { description: data.message });
      }
    } catch (err: any) {
      toast.error("Booking error", { description: err.message });
    } finally {
      setBookingShiprocket(false);
    }
  };

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

        // Autofetch packaging dimensions from order items
        let detectedDims: { length?: number; breadth?: number; height?: number; weight?: number } | null = null;
        let sourceProdName = "";

        const itemsList = Array.isArray(data.order.items) ? data.order.items : [];
        for (const item of itemsList) {
          const snap = item.product_snapshot || {};
          const pDims = snap.packageDimensions || snap.package_dimensions || snap.specs?.packageDimensions;
          const pWeight = snap.packageDimensions?.weightKg || snap.package_dimensions?.weightKg || snap.specs?.weight;

          let parsedWeight: number | undefined = undefined;
          if (typeof pWeight === "number") {
            parsedWeight = pWeight;
          } else if (typeof pWeight === "string") {
            const m = pWeight.match(/([\d.]+)/);
            if (m) {
              parsedWeight = pWeight.includes("g") && !pWeight.includes("kg") ? Number(m[1]) / 1000 : Number(m[1]);
            }
          }

          if (pDims && (pDims.lengthCm || pDims.length)) {
            detectedDims = {
              length: Number(pDims.lengthCm || pDims.length),
              breadth: Number(pDims.breadthCm || pDims.breadth),
              height: Number(pDims.heightCm || pDims.height),
              weight: parsedWeight || (pDims.weightKg ? Number(pDims.weightKg) : 0.25),
            };
            sourceProdName = snap.name || item.name || "Eyewear";
            break;
          }
        }

        if (detectedDims) {
          setPackageDimensions({
            length: detectedDims.length ?? "",
            breadth: detectedDims.breadth ?? "",
            height: detectedDims.height ?? "",
            weight: detectedDims.weight ?? "",
          });
          setDimensionsAutofetched(true);
          setProductNameForDims(sourceProdName);
          if (data.order.shipping_address?.pincode) {
            fetchCourierRates(data.order.shipping_address.pincode, undefined, detectedDims.weight);
          }
        } else {
          setPackageDimensions({
            length: "",
            breadth: "",
            height: "",
            weight: "",
          });
          setDimensionsAutofetched(false);
          setProductNameForDims("");
          if (data.order.shipping_address?.pincode) {
            fetchCourierRates(data.order.shipping_address.pincode);
          }
        }
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
          description: `Order is now in ${newStatus.replace(/_/g, " ")}.`,
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

  const shipping = typeof order.shipping_address === "string" 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const selectedCourier =
    courierOptions.find((c) => c.courierId === selectedCourierId) || courierOptions[0];

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
                <span className="font-mono text-stone-700">{order.tracking_number || "Awaiting dispatch"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs bg-white border-[#E8DCCF] text-[#0A251C] hover:bg-[#FAF7F2] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-[#C5A059]" />
              <span>Print Tax Invoice</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleUpdateOrder}
              disabled={updating}
              className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs cursor-pointer"
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

        {/* Main Grid: Left Items + Rx, Right Customer & Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column (2 Cols): Ordered Items & Optical Prescriptions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Ordered Products */}
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#0A251C] flex items-center gap-2">
                <Glasses className="w-4 h-4 text-[#C5A059]" />
                <span>Eyewear & Lens Specifications</span>
              </h3>

              <div className="divide-y divide-stone-100">
                {items.map((it: any, idx: number) => {
                  const snap = it.product_snapshot || {};
                  const rx = snap.prescription;

                  return (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-sm text-[#0A251C]">
                            {snap.name || it.product_name || "Shivam Opticals Designer Frame"}
                          </div>
                          <div className="text-xs text-stone-500">
                            Finish: <span className="font-medium text-stone-800">{snap.color || it.color || "Standard"}</span> • Lens Option:{" "}
                            <span className="font-medium text-stone-800">
                              {snap.lensPackage || snap.lensType || it.lens_package || "Demo Plastic"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-[#0A251C]">
                            {formatCurrency(Number(it.total_price))}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            Qty: {it.quantity} • Frame: {formatCurrency(Number(it.unit_price))} + Lens:{" "}
                            {formatCurrency(Number(it.lens_price || 0))}
                          </div>
                        </div>
                      </div>

                      {/* Prescription Table if available */}
                      {rx && (
                        <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg p-3 text-xs">
                          <div className="font-bold text-[#0A251C] mb-2 flex items-center justify-between">
                            <span className="uppercase tracking-wider text-[10px] text-stone-600">
                              Verified Clinical Eye Power (Rx)
                            </span>
                            <span className="text-[11px] font-mono text-[#C5A059]">
                              PD: {rx.pd} mm
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2.5 rounded border border-stone-200">
                              <span className="font-bold text-stone-700 block mb-1 text-[11px]">
                                Right Eye (OD)
                              </span>
                              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center">
                                <div>
                                  <span className="text-[9px] text-stone-400 block">SPH</span>
                                  {rx.rightEye?.sph || "0.00"}
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">CYL</span>
                                  {rx.rightEye?.cyl || "0.00"}
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">AXIS</span>
                                  {rx.rightEye?.axis || "0"}°
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">ADD</span>
                                  {rx.rightEye?.add || "—"}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white p-2.5 rounded border border-stone-200">
                              <span className="font-bold text-stone-700 block mb-1 text-[11px]">
                                Left Eye (OS)
                              </span>
                              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center">
                                <div>
                                  <span className="text-[9px] text-stone-400 block">SPH</span>
                                  {rx.leftEye?.sph || "0.00"}
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">CYL</span>
                                  {rx.leftEye?.cyl || "0.00"}
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">AXIS</span>
                                  {rx.leftEye?.axis || "0"}°
                                </div>
                                <div>
                                  <span className="text-[9px] text-stone-400 block">ADD</span>
                                  {rx.leftEye?.add || "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shiprocket Logistics & Courier Allocation Center */}
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#0A251C] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <span>Shiprocket Logistics Command</span>
                </h3>
                {order.status === "dispatched" || order.status === "delivered" ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>AWB Assigned ({order.tracking_number || "Dispatched"})</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Ready for AWB Booking
                  </span>
                )}
              </div>

              {/* 1. Eyewear Packaging Specification (Product-Specific Autofetch) */}
              <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-stone-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      Eyewear Packaging Specification (For Courier Volumetric Weight)
                    </span>
                  </div>
                  {dimensionsAutofetched ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Autofetched from Product: {productNameForDims}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Dimensions Missing on Product — Please enter below</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Dead Weight (kg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 0.35"
                      value={packageDimensions.weight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageDimensions((prev) => ({ ...prev, weight: val }));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-[#0A251C] font-mono ${
                        !packageDimensions.weight ? "border-amber-300 bg-amber-50/60" : "border-[#E8DCCF] bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Length (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 18"
                      value={packageDimensions.length}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageDimensions((prev) => ({ ...prev, length: val }));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-[#0A251C] font-mono ${
                        !packageDimensions.length ? "border-amber-300 bg-amber-50/60" : "border-[#E8DCCF] bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Breadth (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12"
                      value={packageDimensions.breadth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageDimensions((prev) => ({ ...prev, breadth: val }));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-[#0A251C] font-mono ${
                        !packageDimensions.breadth ? "border-amber-300 bg-amber-50/60" : "border-[#E8DCCF] bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Height (cm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8"
                      value={packageDimensions.height}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageDimensions((prev) => ({ ...prev, height: val }));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md border text-xs text-[#0A251C] font-mono ${
                        !packageDimensions.height ? "border-amber-300 bg-amber-50/60" : "border-[#E8DCCF] bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 text-[11px] text-stone-500">
                  <span>
                    Volumetric Weight: <strong>{packageDimensions.length && packageDimensions.breadth && packageDimensions.height ? ((Number(packageDimensions.length) * Number(packageDimensions.breadth) * Number(packageDimensions.height)) / 5000).toFixed(2) : "0.00"} kg</strong> (Air Divisor: 5000)
                  </span>
                  {shipping?.pincode && (
                    <button
                      type="button"
                      onClick={() => {
                        if (packageDimensions.weight) {
                          fetchCourierRates(shipping.pincode, pickupDetails.pincode, Number(packageDimensions.weight));
                          toast.success("Recalculated courier freight with updated package weight");
                        }
                      }}
                      className="text-[#C5A059] font-semibold hover:underline cursor-pointer"
                    >
                      Recalculate courier freight for this weight
                    </button>
                  )}
                </div>
              </div>

              {/* Consignment Origin & Delivery Cost Confirmation Section */}
              <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Consignment Origin &amp; Freight Breakdown
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPickup(!isEditingPickup)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A059] hover:text-[#0A251C] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingPickup ? "Close Editor" : "Edit / Change Pickup Point"}</span>
                  </button>
                </div>

                {/* Inline Pickup Location Editor */}
                {isEditingPickup && (
                  <div className="bg-white border border-[#E8DCCF] rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A251C] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#C5A059]" />
                        <span>Edit Dispatch Pickup Point</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditLocationName("work");
                          setEditAddress("Pocket 1, Mayur Vihar Phase 1");
                          setEditCity("New Delhi");
                          setEditState("Delhi");
                          setEditPincode("110091");
                        }}
                        className="text-[10px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Reset to Mayur Vihar Lab Primary
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">
                          Location Nickname (Shiprocket ID)
                        </label>
                        <input
                          type="text"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          placeholder="work"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-stone-600 font-semibold mb-1">
                          Street Address / Lab Unit
                        </label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Pocket 1, Mayur Vihar Phase 1"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="New Delhi"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          placeholder="Delhi"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">
                          Postal PIN Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ""))}
                          placeholder="110091"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs font-mono text-[#0A251C]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAsDefaultPickup}
                          onChange={(e) => setSaveAsDefaultPickup(e.target.checked)}
                          className="rounded text-[#C5A059] w-4 h-4 cursor-pointer accent-[#C5A059]"
                        />
                        <span>Save as default primary atelier in store settings</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingPickup(false)}
                          className="text-xs h-7.5 bg-white border-stone-300 cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUpdatePickupPoint}
                          className="text-xs h-7.5 bg-[#C5A059] hover:bg-[#b59049] text-white cursor-pointer"
                        >
                          Apply &amp; Recalculate Rates
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Origin vs Delivery Cost Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Pickup Origin Point */}
                  <div className="bg-white p-3 rounded-lg border border-[#E8DCCF] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Dispatch Pickup Point</span>
                      </span>
                      <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-bold">
                        PIN: {pickupDetails.pincode}
                      </span>
                    </div>
                    <div className="font-bold text-[#0A251C] text-xs">
                      {pickupDetails.location}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {pickupDetails.address}, {pickupDetails.city}, {pickupDetails.state}
                    </p>
                  </div>

                  {/* Delivery Cost & Courier Choice */}
                  <div className="bg-white p-3 rounded-lg border border-[#E8DCCF] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Owner Delivery Freight</span>
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ₹{selectedCourier?.rate ?? 95}
                      </span>
                    </div>
                    <div className="font-bold text-[#0A251C] text-xs flex items-center justify-between">
                      <span>{selectedCourier?.courierName || "Delhivery Air / BlueDart"}</span>
                      <span className="text-[11px] text-stone-500 font-normal">
                        ETA: {selectedCourier?.estimatedDays || 2} days
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Direct freight billed to Shiprocket balance upon AWB booking
                    </p>
                  </div>
                </div>
              </div>

              {/* Courier Comparison Cards */}
              {courierOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                    <span>Available Air Couriers to {shipping.pincode || "Destination"}:</span>
                    <span className="text-stone-400 font-normal">Live rates via Shiprocket</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {courierOptions.map((opt) => (
                      <div
                        key={opt.courierId}
                        onClick={() => setSelectedCourierId(opt.courierId)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedCourierId === opt.courierId
                            ? "border-[#C5A059] bg-[#FAF3EB] ring-1 ring-[#C5A059]"
                            : "border-stone-200 bg-[#FAF7F2] hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0A251C] truncate">{opt.courierName}</span>
                          {opt.isRecommended && (
                            <span className="text-[9px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                              Fastest
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-200/60">
                          <span>Owner Cost: <strong className="text-[#0A251C]">₹{opt.rate}</strong></span>
                          <span className="text-emerald-700 font-medium">{opt.estimatedDays} {opt.estimatedDays === 1 ? "day" : "days"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-Click Dispatch Action Bar with Pre-Booking Confirmation */}
              <div className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-[#0A251C] flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Clinical Lab Dispatch Confirmation</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Ready to dispatch from <strong className="text-stone-800">{pickupDetails.location} ({pickupDetails.pincode})</strong> &rarr; <strong className="text-stone-800">{shipping.city} ({shipping.pincode})</strong> via <strong className="text-stone-800">{selectedCourier?.courierName || "Delhivery Air"}</strong> for <strong className="text-emerald-700 font-mono">₹{selectedCourier?.rate ?? 95}</strong> freight.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {order.payment_details?.shiprocket?.labelUrl ? (
                    <a
                      href={order.payment_details.shiprocket.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DCCF] hover:bg-stone-50 text-[#0A251C] rounded-md text-xs font-semibold shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Print Label PDF</span>
                    </a>
                  ) : null}

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleBookShiprocket}
                    disabled={bookingShiprocket}
                    className="text-xs bg-[#0A251C] hover:bg-[#C5A059] text-white shadow-xs cursor-pointer"
                  >
                    {bookingShiprocket ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5 text-white" />
                    )}
                    <span>{order.tracking_number ? "Re-book Courier" : "Confirm Booking & Generate AWB"}</span>
                  </Button>
                </div>
              </div>

              {/* Manual Edit Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    Active Courier Partner
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
                    Airway Bill (AWB) Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs font-mono text-[#0A251C]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Financial Summary */}
          <div className="space-y-4">
            {/* Customer Profile Card */}
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#0A251C] flex items-center gap-2">
                <User className="w-4 h-4 text-[#C5A059]" />
                <span>Patron Information</span>
              </h3>

              <div className="text-xs space-y-1.5">
                <div className="font-bold text-[#0A251C]">
                  {shipping.fullName || "Valued Patron"}
                </div>
                <div className="text-stone-600">{order.guest_email}</div>
                <div className="text-stone-600 font-mono">{order.guest_phone}</div>
              </div>

              <div className="pt-2 border-t border-stone-100 text-xs space-y-1">
                <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>Shipping Address</span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed pl-5">
                  {shipping.streetAddress}, {shipping.city}, {shipping.state} - {shipping.pincode},{" "}
                  {shipping.country || "India"}
                </p>
              </div>
            </div>

            {/* Payment & Financial Ledger */}
            <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-[#0A251C] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A059]" />
                <span>Financial Ledger</span>
              </h3>

              <div className="space-y-2 text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#0A251C]">
                    {formatCurrency(Number(order.subtotal))}
                  </span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({order.coupon_code || "Special Offer"})</span>
                    <span>-{formatCurrency(Number(order.discount_amount))}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Insured Express Shipping</span>
                  <span className="text-emerald-700 font-medium">Free</span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-[#0A251C]">
                  <span>Total Amount Paid</span>
                  <span>{formatCurrency(Number(order.total_amount))}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Method</span>
                  <span className="font-semibold text-stone-800 uppercase">
                    {order.payment_method === "upi" || (typeof order.payment_method === "string" && order.payment_method.toLowerCase().includes("upi"))
                      ? "Razorpay UPI"
                      : order.payment_method === "card" || (typeof order.payment_method === "string" && order.payment_method.toLowerCase().includes("card"))
                      ? "Razorpay Cards"
                      : order.payment_method === "netbanking"
                      ? "Razorpay NetBanking"
                      : "Cash on Delivery"}
                  </span>
                </div>

                {order.payment_id && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-stone-500">Gateway Txn ID</span>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-[#0A251C]">
                      <span className="font-bold">{order.payment_id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(order.payment_id);
                          setCopiedTxId(true);
                          toast.success("Transaction ID copied");
                          setTimeout(() => setCopiedTxId(false), 2000);
                        }}
                        className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer"
                        title="Copy transaction ID"
                      >
                        {copiedTxId ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {order.payment_details?.razorpay_order_id && (
                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                    <span>Gateway Order</span>
                    <span className="font-mono">{order.payment_details.razorpay_order_id}</span>
                  </div>
                )}

                {order.payment_id && order.payment_status === "paid" && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>HMAC-SHA256 Cryptographically Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Luxury Optical Tax Invoice & Lab Dispatch Slip */}
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
        {/* Atelier Letterhead */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase font-serif">
              Shivam Opticals
            </h1>
            <p className="text-xs tracking-widest uppercase font-semibold text-stone-700">
              Luxury Eyewear Atelier &amp; Clinical Optometry • Estd. 1995
            </p>
            <p className="text-[11px] text-stone-600 mt-1 max-w-md">
              Regd. Office: Pocket 1, Mayur Vihar Phase 1, New Delhi - 110091
              <br />
              GSTIN: 07AAACS1234F1Z9 | CIN: U33201DL1995PTC091240 | concierge@shivamoptical.in
            </p>
          </div>
          <div className="text-right">
            <div className="text-base font-bold uppercase tracking-wider">
              Tax Invoice
            </div>
            <div className="text-xs font-mono font-semibold mt-0.5">
              INV-{order.order_number}
            </div>
            <div className="text-[11px] text-stone-600">
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
              Billed &amp; Shipped To:
            </div>
            <div className="font-bold text-sm text-black">
              {shipping.fullName || "Valued Patron"}
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
              Dispatch &amp; Logistics:
            </div>
            <div>
              <span className="font-semibold">Courier Partner:</span> {order.courier_partner || courierPartner || "Delhivery Air"}
            </div>
            <div>
              <span className="font-semibold">Airway Bill / AWB:</span>{" "}
              <span className="font-mono">{order.tracking_number || trackingNumber || "Pending Dispatch"}</span>
            </div>
            <div>
              <span className="font-semibold">Payment Mode:</span> {order.payment_method?.toUpperCase()}
            </div>
            <div>
              <span className="font-semibold">Payment Status:</span> {order.payment_status?.toUpperCase()}
            </div>
            {order.payment_id && (
              <div>
                <span className="font-semibold">Gateway Txn Ref:</span>{" "}
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
                <th className="p-2 border-r border-black">Item Description &amp; Finish</th>
                <th className="p-2 border-r border-black">HSN Code</th>
                <th className="p-2 border-r border-black text-center">Qty</th>
                <th className="p-2 border-r border-black text-right">Unit Rate (₹)</th>
                <th className="p-2 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, idx: number) => {
                const snap = it.product_snapshot || {};
                return (
                  <tr key={idx} className="border-b border-stone-300">
                    <td className="p-2 border-r border-stone-300 font-mono text-center">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-stone-300">
                      <div className="font-bold">{snap.name || it.product_name || "Luxury Frame"}</div>
                      <div className="text-[10px] text-stone-600">
                        Finish: {snap.color || it.color || "Standard"} | Lens: {snap.lensPackage || snap.lensType || it.lens_package || "Plano Demonstration"}
                      </div>
                    </td>
                    <td className="p-2 border-r border-stone-300 font-mono text-[10px]">
                      90031100
                    </td>
                    <td className="p-2 border-r border-stone-300 text-center font-mono">
                      {it.quantity}
                    </td>
                    <td className="p-2 border-r border-stone-300 text-right font-mono">
                      {formatCurrency(Number(it.unit_price) + Number(it.lens_price || 0))}
                    </td>
                    <td className="p-2 text-right font-bold font-mono">
                      {formatCurrency(Number(it.total_price))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Clinical Eye Power Rx Summary on Invoice */}
        {items.some((it: any) => it.product_snapshot?.prescription) && (
          <div className="border border-stone-400 p-3 mb-6 bg-stone-50 text-xs">
            <div className="font-bold uppercase tracking-wider text-[10px] mb-2 text-stone-700">
              Verified Optical Prescription Specifications (Rx)
            </div>
            {items
              .filter((it: any) => it.product_snapshot?.prescription)
              .map((it: any, idx: number) => {
                const rx = it.product_snapshot.prescription;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="text-[11px] font-semibold text-stone-800">
                      Frame: {it.product_snapshot.name} (PD: {rx.pd} mm)
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                      <div>
                        Right Eye (OD): SPH {rx.rightEye?.sph || "0.00"} | CYL {rx.rightEye?.cyl || "0.00"} | AXIS {rx.rightEye?.axis || "0"}° | ADD {rx.rightEye?.add || "—"}
                      </div>
                      <div>
                        Left Eye (OS): SPH {rx.leftEye?.sph || "0.00"} | CYL {rx.leftEye?.cyl || "0.00"} | AXIS {rx.leftEye?.axis || "0"}° | ADD {rx.leftEye?.add || "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Financial Summary & Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 text-xs space-y-1.5 border-t border-b border-black py-3">
            <div className="flex justify-between">
              <span className="text-stone-600">Taxable Value:</span>
              <span className="font-mono">
                {formatCurrency(Math.round(Number(order.total_amount) / 1.18))}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">CGST (9.0%):</span>
              <span className="font-mono">
                {formatCurrency(Math.round((Number(order.total_amount) / 1.18) * 0.09))}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">SGST (9.0%):</span>
              <span className="font-mono">
                {formatCurrency(Math.round((Number(order.total_amount) / 1.18) * 0.09))}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-600">Insured Shipping:</span>
              <span className="font-mono text-emerald-700 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1.5">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">{formatCurrency(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-stone-200">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Terms &amp; Conditions:
            </div>
            <p className="text-[9px] text-stone-500 leading-normal mt-0.5">
              1. Custom Rx Zeiss progressive lenses are surfaced specifically for the patron&apos;s optometric measurements.
              <br />
              2. Titanium frames carry a 24-month comprehensive manufacturing warranty.
              <br />
              3. This is a computer-generated luxury atelier tax invoice.
            </p>
          </div>
          <div className="text-right flex flex-col items-end justify-end">
            <div className="w-36 border-b border-black mb-1"></div>
            <div className="font-bold text-xs uppercase">For Shivam Opticals</div>
            <div className="text-[10px] text-stone-500">Authorized Optician &amp; Signatory</div>
          </div>
        </div>
      </div>
    </>
  );
}
