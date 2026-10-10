"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ShieldCheck,
  Truck,
  Check,
  ShoppingBag,
  Glasses,
  Tag,
  Copy,
  RefreshCw,
  Sliders,
  Lightbulb,
  Share2,
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  PhoneCall,
  Navigation,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ProductDetailViewProps {
  product: Product;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
}) => {
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { openAppointmentModal } = useAuth();

  const isSaved = isInWishlist(product.id);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedCode, setCopiedCode] = useState(false);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{
    [key: string]: boolean;
  }>({
    about: false,
    warranty: false,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [
          product.img,
          "/images/metallic_aviator_front.jpg",
          "/images/metallic_aviator_detail.jpg",
        ];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, product.colors?.[0] || "#1A1816");
    }
    toast.success(`Added ${product.name} to cart!`);
    openCart();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("FLAT12");
    setCopiedCode(true);
    toast.success("Promo code FLAT12 copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const discount =
    product.discountPct ||
    Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );

  return (
    <div className="w-full">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1 w-full">
        {/* 1. Breadcrumb Hierarchy */}
        <nav className="flex items-center space-x-2 text-[11px] sm:text-xs text-[#7A7571] tracking-wider mb-6">
          <Link href="/" className="hover:text-[#0A251C] transition">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-[#7A7571] uppercase font-medium">
            {product.brand}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="text-[#0A251C] font-semibold truncate max-w-[240px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2. Two-Column Bespoke Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Big Product Image Showcase Card */}
            <div className="bg-white border border-[#E8DEC8] rounded-2xl p-5 sm:p-8 relative flex items-center justify-center w-full aspect-[4/3] sm:aspect-[1.18/1] shadow-xs group overflow-hidden transition-all">
              {/* Top Left Craftsmanship Tag */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-[#0A251C] text-white shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>HAUTE LUNETTERIE</span>
              </div>

              {/* Wishlist Heart Button (Top-Right) */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-[#E8DEC8] flex items-center justify-center text-neutral-400 hover:text-red-500 transition shadow-xs z-20 cursor-pointer"
                title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSaved ? "fill-red-500 text-red-500" : "text-neutral-400"
                  }`}
                />
              </button>

              {/* Main Eyewear Image */}
              <img
                src={galleryImages[selectedImgIndex] || product.img}
                alt={product.name}
                className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-105 select-none"
              />
            </div>

            {/* Interactive Angle Switching Pills & Carousel Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 select-none px-1">
              {/* Angle Selector Pills */}
              <div className="flex items-center gap-2">
                {["Angled View", "Front View", "Detail Shot"].map(
                  (label, idx) => {
                    const isActive = selectedImgIndex === idx;
                    return (
                      <button
                        key={label}
                        onClick={() => setSelectedImgIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider uppercase transition shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? "border-[#0A251C] bg-[#0A251C] text-white"
                            : "border-[#E8DEC8] bg-white text-[#7A7571] hover:text-[#0A251C]"
                        }`}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setSelectedImgIndex((prev) =>
                      prev === 0 ? galleryImages.length - 1 : prev - 1
                    )
                  }
                  className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-white hover:bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center transition shadow-2xs cursor-pointer"
                  aria-label="Previous view"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {galleryImages.map((_, idx) => (
                    <span
                      key={idx}
                      className={`rounded-full transition-all ${
                        selectedImgIndex === idx
                          ? "w-2 h-2 bg-[#0A251C]"
                          : "w-1.5 h-1.5 bg-neutral-300"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSelectedImgIndex((prev) =>
                      prev === galleryImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-white hover:bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center transition shadow-2xs cursor-pointer"
                  aria-label="Next view"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3 Refined Card Accordions */}
            <div className="pt-2 space-y-3">
              {/* Accordion 1: ABOUT US */}
              <div className="border border-[#E8DEC8] rounded-xl bg-white/90 p-4 transition-all hover:border-[#C5A059]/60 shadow-2xs">
                <button
                  onClick={() => toggleAccordion("about")}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shrink-0">
                      <Landmark className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0A251C] group-hover:text-[#C5A059] transition">
                      ABOUT SHIVAM OPTICAL
                    </span>
                  </div>
                  <span className="text-lg font-light text-neutral-400 select-none">
                    {openAccordions.about ? "−" : "+"}
                  </span>
                </button>
                {openAccordions.about && (
                  <p className="pt-3 text-xs text-[#7A7571] leading-relaxed pl-10">
                    Shivam Optical is a trusted optical boutique located at
                    Samachar Market, Mayur Vihar Phase 1 Extension, Delhi. For
                    over 15 years, we have provided accurate computerised eye
                    testing, precision German lens fitting, and a curated
                    assortment of fine domestic and luxury international eyewear
                    with honest pricing.
                  </p>
                )}
              </div>

              {/* Accordion 2: WARRANTY */}
              <div className="border border-[#E8DEC8] rounded-xl bg-white/90 p-4 transition-all hover:border-[#C5A059]/60 shadow-2xs">
                <button
                  onClick={() => toggleAccordion("warranty")}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0A251C] group-hover:text-[#C5A059] transition">
                      THE PRECISION PLEDGE | AUTHENTICITY &amp; WARRANTY
                    </span>
                  </div>
                  <span className="text-lg font-light text-neutral-400 select-none">
                    {openAccordions.warranty ? "−" : "+"}
                  </span>
                </button>
                {openAccordions.warranty && (
                  <p className="pt-3 text-xs text-[#7A7571] leading-relaxed pl-10">
                    Every frame and lens from Shivam Optical is 100% genuine and
                    sourced directly through certified distributor channels. All
                    products are backed by a 1-Year Comprehensive Warranty
                    covering manufacturing defects, along with complimentary
                    lifetime ultrasonic cleaning and hinge tightening at our
                    Delhi store.
                  </p>
                )}
              </div>

              {/* Accordion 3: SHIPPING */}
              <div className="border border-[#E8DEC8] rounded-xl bg-white/90 p-4 transition-all hover:border-[#C5A059]/60 shadow-2xs">
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0A251C] group-hover:text-[#C5A059] transition">
                      SHIPPING &amp; 7-DAY EXCHANGE
                    </span>
                  </div>
                  <span className="text-lg font-light text-neutral-400 select-none">
                    {openAccordions.shipping ? "−" : "+"}
                  </span>
                </button>
                {openAccordions.shipping && (
                  <p className="pt-3 text-xs text-[#7A7571] leading-relaxed pl-10">
                    We provide fast insured air-courier delivery across India,
                    dispatched within 48 to 72 hours. All shipments include
                    tamper-evident luxury hard cases and tracking details. Enjoy
                    complete peace of mind with our 7-day hassle-free exchange
                    guarantee.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Header Strip: Brand + In-Stock Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#C5A059] font-serif">
                {product.brand}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse"></span>
                IN STOCK • MAYUR VIHAR LAB
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C] tracking-tight leading-tight -mt-1">
              {product.name}
            </h1>

            {/* Rating & Reviews Bar */}
            <div className="flex items-center gap-2 text-xs text-[#0A251C] -mt-1 pb-1">
              <div className="flex text-amber-500 text-sm leading-none">
                ★★★★★
              </div>
              <span className="font-bold text-xs">5.0</span>
              <span className="text-neutral-300">•</span>
              <span className="text-[#7A7571] hover:text-[#0A251C] cursor-pointer underline text-[11px]">
                424 verified reviews
              </span>
            </div>

            {/* Price Display Card */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E8DEC8] shadow-2xs">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-[28px] font-bold text-[#0A251C] leading-none">
                  {formatCurrency(product.price)} INR
                </span>
                <span className="text-xs sm:text-sm text-[#9CA3AF] line-through font-normal">
                  {formatCurrency(product.originalPrice)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#512D2B] text-white font-bold tracking-wider uppercase">
                  SAVE {discount}%
                </span>
              </div>
              <p className="text-[11px] text-[#7A7571] mt-1.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inclusive of all taxes &amp; complimentary hard-case packaging</span>
              </p>
            </div>

            {/* Quantity Stepper & ADD TO CART Action Stack */}
            <div className="pt-1 flex items-center gap-3">
              <div className="flex items-center justify-between border border-[#E8DEC8] rounded-lg bg-white w-28 px-3 py-3 shadow-2xs shrink-0">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="text-[#0A251C] hover:text-[#C5A059] font-bold text-base px-1 leading-none select-none cursor-pointer"
                >
                  −
                </button>
                <span className="font-bold text-xs text-[#0A251C]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="text-[#0A251C] hover:text-[#C5A059] font-bold text-base px-1 leading-none select-none cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] rounded-lg transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] group"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                <span>ADD TO CART</span>
              </button>
            </div>

            {/* Secondary Banner: ADD PRESCRIPTION LENSES */}
            <a
              href={`https://wa.me/919779990207?text=${encodeURIComponent(
                `Hi Shivam Optical, I would like to add Prescription Lenses for ${product.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#FAF3EB] hover:bg-[#F3EDE5] border border-[#C5A059]/60 rounded-lg text-center text-xs font-semibold tracking-wider uppercase text-[#0A251C] transition flex items-center justify-center gap-2 group cursor-pointer shadow-2xs"
            >
              <Glasses className="w-4 h-4 text-[#C5A059]" />
              <span className="text-[11px] font-bold text-[#0A251C] group-hover:text-[#A38241] transition-colors">
                ADD PRESCRIPTION LENSES (NIKON • ZEISS • ESSILOR) &rarr;
              </span>
            </a>

            {/* Luxury Ticket Promo Box */}
            <div className="p-3.5 rounded-xl bg-[#FAF3EB]/70 border-dashed border border-[#C5A059]/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C5A059]" />
                <div className="text-[11px] text-[#1A1816]">
                  Use code{" "}
                  <strong className="font-bold text-[#0A251C] bg-white px-1.5 py-0.5 rounded border border-[#C5A059]/40">
                    FLAT12
                  </strong>{" "}
                  for 12% off your order
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0A251C] hover:text-[#C5A059] uppercase tracking-wider cursor-pointer transition"
              >
                <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{copiedCode ? "COPIED" : "COPY"}</span>
              </button>
            </div>

            {/* 3-Column Trust Pillars */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="border border-[#E8DEC8] rounded-xl p-3 text-center bg-white shadow-2xs">
                <Truck className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A251C] block">
                  FAST SHIPPING
                </span>
                <span className="text-[9px] text-[#7A7571] block mt-0.5">
                  Ships in 48-72h
                </span>
              </div>
              <div className="border border-[#E8DEC8] rounded-xl p-3 text-center bg-white shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A251C] block">
                  100% GENUINE
                </span>
                <span className="text-[9px] text-[#7A7571] block mt-0.5">
                  Certified Lab
                </span>
              </div>
              <div className="border border-[#E8DEC8] rounded-xl p-3 text-center bg-white shadow-2xs">
                <RefreshCw className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A251C] block">
                  7-DAY EXCHANGE
                </span>
                <button
                  onClick={() => toggleAccordion("warranty")}
                  className="text-[9px] text-[#C5A059] hover:underline block mt-0.5 mx-auto"
                >
                  Policy Details
                </button>
              </div>
            </div>

            {/* WhatsApp Concierge Consultation Bar */}
            <a
              href={`https://wa.me/919779990207?text=${encodeURIComponent(
                `Hi Shivam Optical, I have questions about ${product.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-[#F0FDF4] to-[#E8F8F0] border border-[#BBF7D0] flex items-center justify-between gap-3 shadow-2xs transition hover:shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#166534]">
                    Need live video or photos of this frame?
                  </p>
                  <p className="text-[10px] text-[#15803D]">
                    Chat directly with our Mayur Vihar Optometrist
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] bg-white px-2.5 py-1 rounded border border-[#BBF7D0] group-hover:bg-[#25D366] group-hover:text-white transition">
                Chat Now
              </span>
            </a>

            {/* Specifications Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0A251C] flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>SPECIFICATIONS</span>
                </h3>
                <span className="text-[10px] font-semibold text-[#C5A059] bg-[#FAF3EB] border border-[#E8DEC8] px-2.5 py-0.5 rounded-full">
                  {product.measurements
                    ? `${product.measurements.lensWidth} ▢ ${product.measurements.bridgeWidth} — ${product.measurements.templeLength} mm`
                    : "56 ▢ 16 — 140 mm"}
                </span>
              </div>

              <div className="border border-[#E8DEC8] rounded-xl overflow-hidden text-xs shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-[#E8DEC8] bg-white">
                      <td className="py-2.5 px-3.5 text-[#7A7571] w-2/5 font-medium">
                        Lens Size
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C]">
                        {product.measurements?.lensWidth || 56} mm
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8DEC8] bg-[#FAF6F0]">
                      <td className="py-2.5 px-3.5 text-[#7A7571] font-medium">
                        Nose Bridge Length
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C]">
                        {product.measurements?.bridgeWidth || 16} mm
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8DEC8] bg-white">
                      <td className="py-2.5 px-3.5 text-[#7A7571] font-medium">
                        Temple Length
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C]">
                        {product.measurements?.templeLength || 140} mm
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8DEC8] bg-[#FAF6F0]">
                      <td className="py-2.5 px-3.5 text-[#7A7571] font-medium">
                        Gender
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C] uppercase">
                        {product.gender}
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8DEC8] bg-white">
                      <td className="py-2.5 px-3.5 text-[#7A7571] font-medium">
                        Material
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C]">
                        {product.material || "Italian Acetate & Titanium"}
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8DEC8] bg-[#FAF6F0]">
                      <td className="py-2.5 px-3.5 text-[#7A7571] font-medium">
                        Shape
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0A251C]">
                        {product.shape}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Style Tip Box */}
              <div className="mt-3 p-3 rounded-lg bg-[#FAF3EB]/80 border border-[#E8DEC8] flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#7A7571] leading-relaxed">
                  <strong className="font-semibold text-[#0A251C]">
                    Style Tip:
                  </strong>{" "}
                  This silhouette complements oval, round, and heart-shaped face
                  contours. Visit our boutique clinic in Mayur Vihar for personal
                  fitting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FULL-WIDTH PRESCRIPTION LENSES BANNER */}
        <div className="mt-14 sm:mt-16 border border-[#E8DEC8] rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Left Snellen Eye Chart Panel */}
            <div className="md:col-span-3 bg-[#FAF3EB] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[#E8DEC8]">
              <div className="text-center font-serif text-[#1A1816] space-y-1.5 my-auto select-none opacity-85 py-3">
                <div className="text-4xl font-extrabold tracking-widest leading-none">
                  E
                </div>
                <div className="text-xl font-bold tracking-[0.35em] leading-tight">
                  F P
                </div>
                <div className="text-sm font-bold tracking-[0.3em] leading-tight">
                  T O Z
                </div>
                <div className="text-xs font-semibold tracking-[0.25em] leading-tight">
                  L P E D
                </div>
                <div className="text-[10px] font-semibold tracking-[0.25em] leading-tight">
                  P E C F D
                </div>
              </div>
              <span className="text-[8.5px] uppercase tracking-[0.2em] text-[#8C7A6B] mt-2 font-semibold">
                20/20 OPTICAL CERTIFIED
              </span>
            </div>

            {/* Center: Headline & WhatsApp Action Link */}
            <div className="md:col-span-6 p-6 sm:p-10 flex flex-col justify-center text-center space-y-3 bg-white">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#C5A059]">
                PRESCRIPTION LABORATORY
              </span>
              <h3 className="text-base sm:text-lg md:text-xl font-serif font-bold uppercase tracking-wider text-[#0A251C]">
                ADD PRESCRIPTION LENSES?
              </h3>
              <p className="text-xs text-[#7A7571] max-w-md mx-auto leading-relaxed">
                We offer prescription (Rx) lenses by all major companies
                including{" "}
                <strong className="text-[#0A251C] font-semibold">
                  Nikon, Carl Zeiss &amp; Essilor
                </strong>
                .
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/919779990207?text=${encodeURIComponent(
                    `Hi Shivam Optical, I have an eye prescription for ${product.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-[#0A251C] hover:text-[#C5A059] border-b-2 border-[#0A251C] hover:border-[#C5A059] pb-0.5 transition"
                >
                  <span>WHATSAPP US</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            {/* Right: Photography Panel */}
            <div className="md:col-span-3 h-52 md:h-auto overflow-hidden bg-neutral-100">
              <img
                src="/images/rx_lifestyle_glasses.png"
                alt="Prescription Glasses by Shivam Optical"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ================= STORE LOCATION & CONTACT US SECTION ================= */}
      <section
        id="contact"
        className="py-16 md:py-20 bg-[#FBF9F5] border-t border-[#E8DEC8] mt-12"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-[#FAF3EB] border border-[#E8DEC8] rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#C5A059] block">
                  VISIT OUR STORE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#0A251C] leading-tight">
                  Shivam Optical
                </h2>
                <div className="space-y-3.5 pt-2 text-sm text-[#1A1816]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shadow-xs shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0A251C]">Store Address:</p>
                      <p className="text-[#1A1816]/90 leading-relaxed mt-0.5">
                        SAMACHAR market, Shop No-1, Kanishka Complex,
                        <br />
                        Mayur Vihar Phase I, extention, Mayur Vihar, Delhi, 110091
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shadow-xs shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#0A251C]">
                        Call / WhatsApp:{" "}
                      </span>
                      <a
                        href="tel:09779990207"
                        className="text-[#0A251C] hover:text-[#C5A059] font-bold text-base transition ml-1 underline decoration-[#C5A059]/50 underline-offset-2"
                      >
                        097799 90207
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shadow-xs shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#0A251C]">
                        Store Hours:{" "}
                      </span>
                      <span className="text-[#1A1816]/90 font-medium ml-1">
                        Open 7 Days • 10:30 AM to 9:00 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <a
                  href="tel:09779990207"
                  className="w-full py-3.5 px-6 bg-[#0A251C] hover:bg-black text-white text-center font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-[#C5A059]" />
                  <span>Call Us Now: 097799 90207</span>
                </a>

                <button
                  onClick={openAppointmentModal}
                  className="w-full py-3.5 px-6 bg-[#C5A059] hover:bg-[#B08B45] text-[#0A251C] text-center font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#0A251C]" />
                  <span>Book In-Store Eye Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
