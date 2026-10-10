"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Building,
  Tag,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency, generateTrackingId, getEstimatedDeliveryDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discountAmount: discount,
    grandTotal: total,
    appliedCoupon: promoCode,
    applyCoupon: applyPromoCode,
    removeCoupon: removePromoCode,
    clearCart,
  } = useCart();

  const deliveryFee = subtotal >= 1999 || subtotal === 0 ? 0 : 150;

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    streetAddress: "",
    apartment: "",
    city: "New Delhi",
    state: "Delhi",
    pincode: "",
  });

  const [deliveryMethod, setDeliveryMethod] = useState<"courier" | "pickup">(
    "courier"
  );
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay"
  );
  const [couponInput, setCouponInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{
    orderId: string;
    trackingId: string;
    deliveryDate: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyPromoCode(couponInput)) {
      toast.success("Promo code FLAT12 applied! 12% discount added.");
      setCouponInput("");
    } else {
      toast.error("Invalid coupon code. Try 'FLAT12'.");
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.streetAddress.trim()) {
      toast.error("Please fill in all mandatory contact & address fields.");
      return;
    }

    setIsSubmitting(true);

    const orderId = `SO-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingId = generateTrackingId();
    const deliveryDate = getEstimatedDeliveryDate(3);

    (async () => {
      try {
        await fetch("/api/admin/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_number: orderId,
            guest_name: formData.fullName,
            guest_email: formData.email || "patron@shivamoptics.in",
            guest_phone: formData.phone,
            status: "confirmed",
            payment_status: paymentMethod === "razorpay" ? "paid" : "pending",
            payment_method: paymentMethod === "razorpay" ? "Razorpay Online" : "Cash on Delivery",
            subtotal,
            discount_amount: discount,
            coupon_code: promoCode || undefined,
            shipping_fee: deliveryFee,
            total_amount: total,
            shipping_address: {
              fullName: formData.fullName,
              phone: formData.phone,
              email: formData.email,
              streetAddress: formData.streetAddress,
              apartment: formData.apartment,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              country: "India",
            },
            tracking_number: trackingId,
            courier_partner: "BlueDart Express",
            estimated_delivery: deliveryDate,
            items: items.map((it) => ({
              product_id: it.product.id,
              product_name: it.product.name,
              quantity: it.quantity,
              unit_price: it.product.price,
              color: it.selectedColor || "Default",
              lens_package: it.lensConfig?.packageName || "Standard Demo Lenses",
              total_price: (it.product.price + (it.lensConfig?.packagePrice || 0)) * it.quantity,
            })),
          }),
        });
      } catch (err) {
        console.warn("Failed to sync order with admin store", err);
      }

      setOrderConfirmed({
        orderId,
        trackingId,
        deliveryDate,
      });

      clearCart();
      setIsSubmitting(false);
      toast.success(`Order ${orderId} confirmed successfully!`);
    })();
  };

  // If order is completed
  if (orderConfirmed) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E8DEC8] rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">
            HAUTE LUNETTERIE RESERVED
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C] mb-3">
            Thank You for Your Order!
          </h1>
          <p className="text-sm text-[#7A7571] max-w-md mx-auto mb-8">
            Your eyewear is now assigned to our Mayur Vihar optical lab for
            precision calibration and dispatch.
          </p>

          <div className="bg-[#FAF3EB] border border-[#E8DEC8] rounded-xl p-5 max-w-md mx-auto text-left space-y-3 mb-8 text-xs">
            <div className="flex justify-between border-b border-[#E8DEC8]/60 pb-2">
              <span className="text-[#7A7571]">Order Reference:</span>
              <span className="font-bold text-[#0A251C]">
                {orderConfirmed.orderId}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E8DEC8]/60 pb-2">
              <span className="text-[#7A7571]">Tracking ID:</span>
              <span className="font-bold text-[#0A251C]">
                {orderConfirmed.trackingId}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E8DEC8]/60 pb-2">
              <span className="text-[#7A7571]">Estimated Delivery:</span>
              <span className="font-bold text-emerald-700">
                {orderConfirmed.deliveryDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7571]">Fulfillment Hub:</span>
              <span className="font-medium text-[#0A251C]">
                Mayur Vihar Phase I Atelier, Delhi
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg transition"
            >
              Return to Boutique Home
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-[#E8DEC8] hover:bg-[#FAF3EB] text-[#0A251C] text-xs font-bold uppercase tracking-widest rounded-lg transition"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#0A251C] mb-2">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-xs text-[#7A7571] max-w-sm mx-auto mb-6">
          Browse our curated eyewear collection and add designer silhouettes
          to proceed with checkout.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg transition"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FCFAF7] py-8 sm:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-xs text-[#7A7571] tracking-wider mb-2">
            <Link href="/" className="hover:text-[#0A251C] transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#0A251C] transition">
              Catalog
            </Link>
            <span>/</span>
            <span className="text-[#0A251C] font-semibold">Checkout</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
            Order Checkout &amp; Dispatch
          </h1>
        </div>

        <form
          onSubmit={handleSubmitOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
        >
          {/* ================= LEFT COLUMN: Address & Payment ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Contact & Shipping Address Card */}
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A251C] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <span>1. Shipping Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="097799 90207"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="patron@domain.com"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="House/Flat No., Street, Landmark"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0A251C] mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    placeholder="110091"
                    className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs focus:outline-none focus:border-[#0A251C]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Method */}
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A251C] mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A059]" />
                <span>2. Delivery Speed &amp; Fulfillment</span>
              </h2>

              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryMethod("courier")}
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${
                    deliveryMethod === "courier"
                      ? "border-[#0A251C] bg-[#FAF3EB]"
                      : "border-[#E8DEC8] bg-white hover:border-[#C5A059]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === "courier"}
                      onChange={() => setDeliveryMethod("courier")}
                      className="mt-0.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0A251C]">
                        Express Insured Air Courier
                      </p>
                      <p className="text-[11px] text-[#7A7571] mt-0.5">
                        Delivered in 48-72h with hard case &amp; tamper-proof seal
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0A251C]">
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${
                    deliveryMethod === "pickup"
                      ? "border-[#0A251C] bg-[#FAF3EB]"
                      : "border-[#E8DEC8] bg-white hover:border-[#C5A059]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === "pickup"}
                      onChange={() => setDeliveryMethod("pickup")}
                      className="mt-0.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0A251C]">
                        Store Pickup • Mayur Vihar Boutique
                      </p>
                      <p className="text-[11px] text-[#7A7571] mt-0.5">
                        Ready within 2 hours • Complimentary face adjustment
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">FREE</span>
                </label>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A251C] mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A059]" />
                <span>3. Payment Options</span>
              </h2>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === "razorpay"
                      ? "border-[#0A251C] bg-[#FAF3EB]"
                      : "border-[#E8DEC8] bg-white hover:border-[#C5A059]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="mt-0.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0A251C]">
                        Razorpay Secure Online Checkout
                      </p>
                      <p className="text-[11px] text-[#7A7571] mt-0.5">
                        UPI (GPay/PhonePe), Credit/Debit Cards, Netbanking &amp;
                        Wallets
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    RECOMMENDED
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === "cod"
                      ? "border-[#0A251C] bg-[#FAF3EB]"
                      : "border-[#E8DEC8] bg-white hover:border-[#C5A059]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-0.5 text-[#0A251C] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0A251C]">
                        Pay on Delivery / Pay at Store
                      </p>
                      <p className="text-[11px] text-[#7A7571] mt-0.5">
                        Cash or Card payment upon receiving your glasses
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Sticky Order Summary ================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-6 shadow-xs sticky top-28">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A251C] mb-4 pb-3 border-b border-[#E8DEC8]">
                Order Summary ({items.length} Silhouettes)
              </h2>

              {/* Items List */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-[#E8DEC8]/50 last:border-b-0"
                  >
                    <img
                      src={item.product.img}
                      alt={item.product.name}
                      className="w-12 h-12 object-contain bg-[#FAF3EB] rounded-lg p-1 border border-[#E8DEC8]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0A251C] truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-[#7A7571]">
                        Qty: {item.quantity} • {item.product.brand}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#0A251C]">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="mb-4 pt-2 border-t border-[#E8DEC8]">
                {promoCode ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800">
                      Code {promoCode} Applied (-12%)
                    </span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-red-500 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (FLAT12)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-[#FCFAF7] border border-[#E8DEC8] rounded-lg text-xs uppercase focus:outline-none focus:border-[#0A251C]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase rounded-lg transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-[#E8DEC8] pt-4 mb-6">
                <div className="flex justify-between text-[#7A7571]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#0A251C]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount (FLAT12)</span>
                    <span className="font-semibold">
                      −{formatCurrency(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#7A7571]">
                  <span>Delivery</span>
                  <span className="font-semibold text-[#0A251C]">
                    {deliveryMethod === "pickup" || deliveryFee === 0
                      ? "FREE"
                      : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0A251C] border-t border-[#E8DEC8] pt-3">
                  <span>Total Payable</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-[10px] text-[#7A7571] pt-1">
                  Inclusive of all GST taxes &amp; luxury packaging.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <span>
                  {isSubmitting
                    ? "Processing Atelier Dispatch..."
                    : `Confirm & Pay ${formatCurrency(total)}`}
                </span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#7A7571]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted &amp; 1-Year Guarantee</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
