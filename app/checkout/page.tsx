"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { UnifiedCheckoutForm } from "@/components/checkout/UnifiedCheckoutForm";
import { UnifiedCheckoutSidebar } from "@/components/checkout/UnifiedCheckoutSidebar";
import { StepOrderSummary } from "@/components/checkout/StepOrderSummary";
import { CheckoutBreadcrumbs, CheckoutStep } from "@/components/checkout/CheckoutBreadcrumbs";
import { Order, PaymentMethod, ShippingAddress } from "@/types";
import { generateTrackingId, getEstimatedDeliveryDate, formatCurrency } from "@/lib/utils";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { toast } from "sonner";

function CheckoutContent() {
  const router = useRouter();
  const {
    items,
    rawSubtotal,
    subtotal,
    discountAmount,
    grandTotal,
    appliedCoupon,
    includeCleaningKit,
    clearCart,
  } = useCart();
  const { user, isLoggedIn, saveOrder, openAuthModal } = useAuth();

  // Initial Address
  const initialAddress: ShippingAddress = user.savedAddresses?.[0] || {
    fullName: user.name || "",
    firstName: user.name?.split(" ")[0] || "",
    lastName: user.name?.split(" ").slice(1).join(" ") || "",
    phone: user.phone || "",
    email: user.email || "",
    streetAddress: "",
    apartment: "",
    city: "New Delhi",
    state: "Delhi",
    pincode: "",
    country: "India",
  };

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(initialAddress);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");

  // Sync address from profile when logged in
  useEffect(() => {
    if (isLoggedIn && user.savedAddresses && user.savedAddresses.length > 0) {
      const addr = user.savedAddresses[0];
      const names = (addr.fullName || user.name || "").split(" ");
      setShippingAddress({
        ...addr,
        firstName: addr.firstName || names[0] || "",
        lastName: addr.lastName || names.slice(1).join(" ") || "",
        email: addr.email || user.email || initialAddress.email,
        phone: addr.phone || user.phone || initialAddress.phone,
      });
    }
  }, [isLoggedIn, user]);

  // Shipping policy state
  const [shippingPolicy, setShippingPolicy] = useState({
    freeShippingThreshold: 1999,
    standardShippingFee: 150,
    expressShippingFee: 350,
  });

  useEffect(() => {
    fetch("/api/shipping/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.freeShippingThreshold) {
          setShippingPolicy({
            freeShippingThreshold: data.freeShippingThreshold,
            standardShippingFee: data.standardShippingFee ?? 150,
            expressShippingFee: data.expressShippingFee ?? 350,
          });
        }
      })
      .catch((e) => console.warn("Failed to load shipping policy in checkout:", e));
  }, []);

  const effectiveSubtotal = rawSubtotal || subtotal || 0;
  const isEligibleForFreeShipping = effectiveSubtotal >= shippingPolicy.freeShippingThreshold;

  const shippingRates = {
    standard: isEligibleForFreeShipping ? 0 : shippingPolicy.standardShippingFee,
    express: shippingPolicy.expressShippingFee,
  };

  const currentShippingFee =
    shippingMethod === "standard" ? shippingRates.standard : shippingRates.express;
  const totalPayable = grandTotal + currentShippingFee;

  // Finalize order helper
  const finalizeOrder = async (orderData: Partial<Order>, existingTrackingId?: string) => {
    const trackingNumber = existingTrackingId || orderData.id || orderData.trackingNumber || generateTrackingId();

    const finalOrder: Order = {
      id: trackingNumber,
      trackingNumber,
      createdAt: new Date().toISOString(),
      items: [...items],
      shippingAddress: { ...shippingAddress },
      paymentMethod: orderData.paymentMethod || selectedPaymentMethod,
      paymentId: orderData.paymentId,
      paymentDetails: orderData.paymentDetails,
      paymentStatus: orderData.paymentStatus || "paid",
      subtotal: effectiveSubtotal,
      discount: discountAmount,
      couponApplied: appliedCoupon || undefined,
      cleaningKitAdded: includeCleaningKit,
      totalAmount: totalPayable,
      status: "confirmed",
      estimatedDeliveryDate: getEstimatedDeliveryDate(
        shippingMethod === "express" ? 2 : 4
      ),
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...finalOrder,
          customerId: user?.id || null,
          shippingFee: currentShippingFee,
          totalAmount: totalPayable,
        }),
      });

      saveOrder(finalOrder);
      setConfirmedOrder(finalOrder);
      setCurrentStep("summary");
      clearCart();
      setIsSubmittingOrder(false);
      window.scrollTo({ top: 0, behavior: "smooth" });

      toast.success("Order Placed Successfully", {
        description: `Order #${trackingNumber} has been confirmed. Thank you!`,
      });
    } catch (e) {
      console.warn("Order save fallback:", e);
      saveOrder(finalOrder);
      setConfirmedOrder(finalOrder);
      setCurrentStep("summary");
      clearCart();
      setIsSubmittingOrder(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Primary Action: Pay / Place Order
  const handlePayNow = async () => {
    if (items.length === 0) {
      toast.error("Your shopping cart is empty");
      return;
    }

    const firstName = shippingAddress.firstName || shippingAddress.fullName?.split(" ")[0];
    if (!firstName?.trim()) {
      toast.error("Please enter your first name");
      return;
    }
    if (!shippingAddress.streetAddress?.trim()) {
      toast.error("Please enter your street delivery address");
      return;
    }
    if (!shippingAddress.city?.trim()) {
      toast.error("Please enter your city");
      return;
    }
    if (!shippingAddress.pincode?.trim()) {
      toast.error("Please enter your 6-digit postal PIN code");
      return;
    }
    if (!shippingAddress.phone?.trim()) {
      toast.error("Please enter your contact phone number");
      return;
    }
    if (totalPayable < 1) {
      toast.error("Invalid Order Amount", {
        description: "Order total must be at least ₹1.00 for online checkout.",
      });
      return;
    }

    setIsSubmittingOrder(true);
    const trackingNumber = generateTrackingId();

    // Exclusive Razorpay Gateway Flow
    try {
      const amountInPaise = Math.round(totalPayable * 100);

      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: trackingNumber,
          isPaise: true,
          notes: {
            orderNumber: trackingNumber,
            customerName:
              shippingAddress.fullName ||
              `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
            customerEmail: shippingAddress.email || user?.email || "",
            customerPhone: shippingAddress.phone || user?.phone || "",
            shippingMethod,
          },
        }),
      });

      const createData = await createRes.json();

      if (!createData.success || !createData.order_id) {
        setIsSubmittingOrder(false);
        toast.error("Unable to Start Payment", {
          description: createData.error || "Please try again or select another payment option.",
        });
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setIsSubmittingOrder(false);
        toast.error("Payment Unavailable", {
          description: "Could not load the payment window. Please check your internet connection.",
        });
        return;
      }

      const cleanPhone = (shippingAddress.phone || user?.phone || "").replace(/\D/g, "").slice(-10);

      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency || "INR",
        name: "Shivam Optical",
        description: "Eyewear & Prescription Lenses",
        order_id: createData.order_id,
        prefill: {
          name:
            shippingAddress.fullName ||
            `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() ||
            user?.name ||
            "",
          email: shippingAddress.email || user?.email || "",
          contact: cleanPhone,
        },
        theme: {
          color: "#0A251C",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: trackingNumber,
                payment_method: "razorpay",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await finalizeOrder(
                {
                  paymentMethod: "razorpay",
                  paymentId: response.razorpay_payment_id,
                  paymentStatus: "paid",
                  paymentDetails: response,
                },
                trackingNumber
              );
            } else {
              setIsSubmittingOrder(false);
              toast.error("Payment Verification Failed", {
                description: "We could not verify this transaction. Please contact support with Payment ID: " + response.razorpay_payment_id,
              });
            }
          } catch (verErr) {
            console.error("Verification network error:", verErr);
            setIsSubmittingOrder(false);
            toast.error("Verification Delayed", {
              description: "Payment received. We are confirming your order now.",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmittingOrder(false);
            toast.info("Payment Cancelled", {
              description: "You closed the payment window. Your cart is preserved.",
            });
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on("payment.failed", function (response: any) {
        setIsSubmittingOrder(false);
        toast.error("Payment Failed", {
          description:
            response?.error?.description ||
            response?.error?.reason ||
            "The transaction could not be processed. Please try again.",
        });
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Payment initialization failure:", err);
      setIsSubmittingOrder(false);
      toast.error("Checkout Failed", {
        description: err?.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  // If order confirmed, show confirmation summary
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <StepOrderSummary
            order={confirmedOrder}
            onContinueShopping={() => router.push("/products")}
          />
        </div>
      </div>
    );
  }

  // If empty cart and no confirmed order
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-16">
        <div className="max-w-[600px] mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-[#E8DEC8] flex items-center justify-center mx-auto mb-4 text-[#716B64]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#0A251C] mb-2">
            Your Shopping Cart is Empty
          </h2>
          <p className="text-xs text-[#716B64] mb-6">
            Explore our curated catalog of luxury frames and precision lens packages.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A251C] hover:bg-[#C5A059] text-white hover:text-[#0A251C] text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Discover Eyewear Collection</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      <CheckoutBreadcrumbs
        currentStep={currentStep}
        canNavigateTo={(step) => step !== "summary"}
        onStepClick={(step) => setCurrentStep(step)}
      />

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block mb-0.5">
              SECURE CHECKOUT
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
              Shipping &amp; Payment
            </h1>
          </div>
          <Link
            href="/cart"
            className="text-xs text-[#716B64] hover:text-[#0A251C] flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cart</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (Left 7 Cols) */}
          <div className="lg:col-span-7">
            <UnifiedCheckoutForm
              shippingAddress={shippingAddress}
              onAddressChange={setShippingAddress}
              shippingMethod={shippingMethod}
              onShippingMethodChange={setShippingMethod}
              shippingRates={shippingRates}
              paymentMethod={selectedPaymentMethod}
              onPaymentMethodChange={setSelectedPaymentMethod}
              onSubmitPay={handlePayNow}
              isSubmitting={isSubmittingOrder}
              totalPayable={totalPayable}
            />
          </div>

          {/* Sticky Order Review Sidebar (Right 5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white border border-[#E8DEC8] rounded-2xl shadow-2xs overflow-hidden">
              <UnifiedCheckoutSidebar
                items={items}
                subtotal={effectiveSubtotal}
                shippingFee={currentShippingFee}
                shippingLabel={shippingRates.standard === 0 ? "FREE" : formatCurrency(currentShippingFee)}
                discountAmount={discountAmount}
                totalPayable={totalPayable}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] py-24 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#716B64]">
            Loading Checkout...
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
