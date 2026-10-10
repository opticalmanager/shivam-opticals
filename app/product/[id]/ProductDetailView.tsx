"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Heart,
  Glasses,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MessageCircle,
  Share2,
  Camera,
  Sparkles,
} from "lucide-react";
import { Product, ProductVariant, SelectedLensConfig } from "@/types";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ProductCard } from "@/components/home/ProductCard";
import { LensCustomizerModal } from "@/components/optical/LensCustomizerModal";
import { VirtualTryOnModal } from "@/components/optical/VirtualTryOnModal";
import { PincodeEstimator } from "@/components/product/PincodeEstimator";
import { hasTryOnModel } from "@/lib/try-on/products/TryOnProductConfig";

interface ProductDetailViewProps {
  product: Product;
  allProducts?: Product[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts = [],
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem, addCustomLensToCart, openCart } = useCart();

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Reset indices when product changes
  useEffect(() => {
    setActiveImgIdx(0);
    setSelectedVariantIdx(0);
  }, [product.id, product.name]);

  // Reset image view to first angle whenever colorway variant changes
  useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedVariantIdx]);

  // Accordions state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    about: false,
    pledge: false,
    shipping: false,
  });

  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const saved = isInWishlist(product.id);

  const selectedVariant =
    product.variants && product.variants.length > 0
      ? product.variants[selectedVariantIdx]
      : undefined;

  const isValidImageUrl = (url?: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic Image Array based on Selected Variant
  const imagesToDisplay = useMemo(() => {
    const list: string[] = [];

    const addImg = (url?: string) => {
      if (!url || !isValidImageUrl(url)) return;
      const clean = url.trim();
      if (!list.includes(clean)) {
        list.push(clean);
      }
    };

    // 1. Check active color variant
    const activeColorVariant = product.colorVariants?.[selectedVariantIdx];
    const activeVariant = product.variants?.[selectedVariantIdx];
    const featuredImg = activeColorVariant?.featuredImage || activeVariant?.image;

    // 2. Add primary featured image first
    if (featuredImg) {
      addImg(featuredImg);
    }

    // 3. Add dedicated gallery images for this variant
    if (activeColorVariant?.gallery && Array.isArray(activeColorVariant.gallery)) {
      activeColorVariant.gallery.forEach(addImg);
    }

    // 4. Barcode matching across product images
    if (featuredImg && product.images && product.images.length > 0) {
      const cleanFeatured = featuredImg.split("?")[0];
      const filename = cleanFeatured.split("/").pop() || "";
      const barcodeMatch = filename.match(/(\d{8,14})/);
      const barcode = barcodeMatch ? barcodeMatch[1] : null;

      if (barcode) {
        product.images.forEach((img) => {
          if (isValidImageUrl(img) && img.includes(barcode)) {
            addImg(img);
          }
        });
      }
    }

    // 5. If 1 or 0 variants, include all general product images
    const totalVariants = Math.max(
      product.colorVariants?.length || 0,
      product.variants?.length || 0
    );
    if (totalVariants <= 1 && product.images && product.images.length > 0) {
      product.images.forEach(addImg);
    }

    // 6. Fallback safety
    if (list.length === 0) {
      if (product.images && product.images.length > 0) {
        product.images.forEach(addImg);
      } else if (product.img) {
        addImg(product.img);
      }
    }

    if (list.length === 0) {
      list.push("/images/placeholder.jpg");
    }

    return list;
  }, [product, selectedVariantIdx]);

  const currentImage = imagesToDisplay[activeImgIdx] || imagesToDisplay[0];

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeEl = thumbnailContainerRef.current.children[activeImgIdx] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeImgIdx]);

  // Preload secondary images in background
  useEffect(() => {
    if (typeof window !== "undefined" && imagesToDisplay.length > 1) {
      imagesToDisplay.slice(1).forEach((imgUrl) => {
        if (!imgUrl) return;
        const targetSrc =
          imgUrl.includes("cdn.shopify.com") && !imgUrl.includes("width=")
            ? `${imgUrl}${imgUrl.includes("?") ? "&" : "?"}width=1000`
            : imgUrl;
        const preloader = new window.Image();
        preloader.src = targetSrc;
      });
    }
  }, [imagesToDisplay]);

  const handlePrevImage = useCallback(() => {
    setActiveImgIdx((prev) => (prev > 0 ? prev - 1 : imagesToDisplay.length - 1));
  }, [imagesToDisplay.length]);

  const handleNextImage = useCallback(() => {
    setActiveImgIdx((prev) => (prev < imagesToDisplay.length - 1 ? prev + 1 : 0));
  }, [imagesToDisplay.length]);

  const handleAddToCart = () => {
    addItem(product, selectedVariant?.colorHex || product.colors?.[0] || "#1A1816");
    toast.success(`Added ${product.brand} - ${product.name} to your shopping bag.`);
    openCart();
  };

  const handleConfirmLensConfig = (config: SelectedLensConfig) => {
    addCustomLensToCart(product, config);
    setIsCustomizerOpen(false);
    toast.success(`Added custom prescription lenses for ${product.name} to cart.`);
    openCart();
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("FLAT12");
    setCopiedCoupon(true);
    toast.success("Coupon FLAT12 copied to clipboard! 12% off applied at checkout.");
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(
      `Hi Shivam Optics Atelier, I am inquiring about ${product.brand} - ${product.name} (Price: ${formatCurrency(product.price)}). Could you provide live photos and concierge styling guidance?`
    );
    window.open(`https://wa.me/919779990207?text=${text}`, "_blank");
  };

  const formattedMaterial = product.material
    ? product.material
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Acetate";

  const formattedShape = product.shape
    ? product.shape.charAt(0).toUpperCase() + product.shape.slice(1)
    : "Rectangle";

  const formattedRimType = useMemo(() => {
    if (product.category === "contact-lenses") return null;
    const r = (product.rimType || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (r.includes("half") || r.includes("semi")) return "Half Rim";
    if (r.includes("less") || r.includes("no-rim")) return "Rimless";
    return "Full Rim";
  }, [product.rimType, product.category]);

  const countryOfOrigin =
    product.brand.toLowerCase() === "cartier" || product.brand.toLowerCase() === "lindberg"
      ? "Japan / France"
      : product.brand.toLowerCase() === "maybach"
      ? "Germany"
      : "Italy";

  const relatedProducts = useMemo(() => {
    if (allProducts && allProducts.length > 0) {
      return allProducts.filter((p) => p.id !== product.id).slice(0, 4);
    }
    return [];
  }, [allProducts, product.id]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#1A1816] font-sans antialiased selection:bg-[#C5A059] selection:text-white">
      {/* 1. Breadcrumb Trail */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-5 pb-3"
      >
        <ol className="flex items-center space-x-2 text-[11px] text-[#716B64] font-sans">
          <li>
            <Link href="/" className="hover:text-[#1A1816] transition-colors cursor-pointer">
              Home
            </Link>
          </li>
          <li className="text-neutral-300">/</li>
          <li>
            <Link
              href={`/products?brand=${encodeURIComponent(product.brand)}`}
              className="uppercase tracking-wider hover:text-[#1A1816] transition-colors cursor-pointer"
            >
              {product.brand}
            </Link>
          </li>
          <li className="text-neutral-300">/</li>
          <li
            className="font-medium text-[#1A1816] truncate max-w-[220px] sm:max-w-md"
            aria-current="page"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      {/* 2. Main Product Showcase Stage */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Gallery & Accordions (Span 7) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* White Rounded Main Image Card */}
            <div className="bg-white rounded-2xl border border-[#E8DEC8] w-full min-h-[420px] sm:min-h-[460px] lg:h-[490px] relative flex items-center justify-center p-4 sm:p-6 shadow-xs group overflow-hidden select-none isolate">
              {/* Top Left Craftsmanship Tag */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-[#0A251C] text-white shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>HAUTE LUNETTERIE</span>
              </div>

              {/* Floating Wishlist Heart Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#E8DEC8] text-[#1A1816] flex items-center justify-center shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 z-20"
                aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    saved ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-red-500"
                  }`}
                />
              </button>

              {/* Left Carousel Arrow */}
              {imagesToDisplay.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#E8DEC8] text-[#1A1816] flex items-center justify-center shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
                  aria-label="Previous view angle"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Main Eyewear Image */}
              <div className="w-full h-full flex items-center justify-center p-2">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full max-h-[380px] object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-105 select-none"
                  loading="eager"
                />
              </div>

              {/* Right Carousel Arrow */}
              {imagesToDisplay.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#E8DEC8] text-[#1A1816] flex items-center justify-center shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
                  aria-label="Next view angle"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* 3D Virtual Try-On Badge */}
              <button
                type="button"
                onClick={() => setIsTryOnOpen(true)}
                className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#0A251C]/90 hover:bg-[#0A251C] text-[#C5A059] border border-[#C5A059]/40 backdrop-blur-md shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>3D TRY-ON</span>
              </button>
            </div>

            {/* Horizontal Thumbnail Gallery */}
            {imagesToDisplay.length > 1 && (
              <div className="space-y-2 select-none">
                <div
                  ref={thumbnailContainerRef}
                  className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth scrollbar-none"
                >
                  {imagesToDisplay.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImgIdx(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-white border p-1 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                        activeImgIdx === idx
                          ? "border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-xs scale-102"
                          : "border-[#E8DEC8] hover:border-neutral-400 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                {/* View Angle Counter */}
                <div className="flex items-center justify-between text-[11px] text-[#716B64] px-1">
                  <span>
                    Angle {activeImgIdx + 1} of {imagesToDisplay.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {imagesToDisplay.map((_, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full transition-all ${
                          activeImgIdx === idx
                            ? "w-2.5 h-2.5 bg-[#0A251C]"
                            : "w-1.5 h-1.5 bg-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Information Accordions */}
            <div className="border-t border-[#E8DEC8] divide-y divide-[#E8DEC8] pt-2">
              {/* Accordion 1: About Us */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion("about")}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-[#1A1816] hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  <span>ABOUT SHIVAM OPTICS ATELIER</span>
                  {openAccordions.about ? (
                    <Minus className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {openAccordions.about && (
                  <div className="pt-3.5 pb-1 text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal animate-in fade-in duration-200">
                    Shivam Optics is India&apos;s premier luxury optical atelier and clinical vision center.
                    For over decades, we have curated the world&apos;s most prestigious eyewear houses,
                    delivering master craftsmanship, digital wavefront prescription lenses, and bespoke optical
                    solutions engineered with certified European laboratory precision.
                  </div>
                )}
              </div>

              {/* Accordion 2: The Shivam Pledge */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion("pledge")}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-[#1A1816] hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  <span>THE SHIVAM PLEDGE | AUTHENTICITY &amp; WARRANTY</span>
                  {openAccordions.pledge ? (
                    <Minus className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {openAccordions.pledge && (
                  <div className="pt-3.5 pb-1 text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal animate-in fade-in duration-200">
                    Every spectacle frame and sunglass sold at Shivam Optics is 100% authentic, sourced
                    directly from certified brand distributors with original certificate of authenticity,
                    branded protective hard case, microfiber cleaning cloth, and a 1-year manufacturer warranty
                    covering manufacturing defects.
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping & Returns */}
              <div className="py-4 border-b border-[#E8DEC8]">
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-[#1A1816] hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  <span>SHIPPING &amp; RETURNS</span>
                  {openAccordions.shipping ? (
                    <Minus className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-500" />
                  )}
                </button>
                {openAccordions.shipping && (
                  <div className="pt-3.5 pb-1 text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal animate-in fade-in duration-200">
                    Complimentary express insured courier delivery across India via BlueDart within 48 to 72 hours.
                    We offer a hassle-free 7-day exchange policy for unused frames with original packaging intact.
                    Prescription lenses are custom-manufactured to diopter specifications and backed by our
                    Vision Clarity Guarantee.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Buying Actions & Specifications (Span 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-3.5 sm:space-y-4">
            {/* Brand & Title */}
            <div>
              <span className="font-sans text-[12px] sm:text-[13px] font-normal uppercase tracking-[0.2em] text-[#1A1816] block mb-1">
                {product.brand}
              </span>
              <h1 className="font-sans text-[24px] sm:text-[28px] font-normal uppercase tracking-[0.03em] text-[#1A1816] leading-[1.25]">
                {product.name.replace(/\s+/g, " ").trim()}
              </h1>
            </div>

            {/* Price */}
            <div className="font-sans text-[17px] font-normal text-[#1A1816] flex items-center gap-3">
              <span className="font-bold text-lg text-[#0A251C]">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-neutral-400 line-through font-normal">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              {product.discountPct && product.discountPct > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#512D2B] text-white text-[10px] font-bold tracking-wider uppercase">
                  SAVE {product.discountPct}%
                </span>
              )}
            </div>

            {/* Colorway Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-0.5">
                <span className="font-sans text-[11px] font-medium text-[#1A1816] uppercase tracking-wider block">
                  Color:{" "}
                  <span className="font-normal text-neutral-600">
                    {product.variants[selectedVariantIdx]?.colorName?.replace(/\s+/g, " ").trim()}
                  </span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantIdx(idx);
                        setActiveImgIdx(0);
                      }}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                        selectedVariantIdx === idx
                          ? "border-[#C5A059] ring-2 ring-[#C5A059]/40 scale-110 shadow-xs"
                          : "border-neutral-300 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                      title={v.colorName?.replace(/\s+/g, " ").trim()}
                    >
                      {selectedVariantIdx === idx && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action: ADD TO CART */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#0A251C] hover:bg-[#C5A059] text-white py-3.5 px-6 font-sans font-medium text-[12px] sm:text-[13px] uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] text-center rounded-xl"
            >
              ADD TO CART
            </button>

            {/* 3D Virtual Try-On */}
            <button
              onClick={() => setIsTryOnOpen(true)}
              className="w-full bg-[#FCFAF7] hover:bg-[#FAF3EB] border-2 border-[#C5A059] text-[#1A1816] py-3.5 px-6 font-sans font-semibold text-[12px] sm:text-[13px] uppercase tracking-[0.14em] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] rounded-xl"
            >
              <Camera className="w-4 h-4 text-[#C5A059]" />
              <span>3D VIRTUAL TRY-ON (LIVE MIRROR)</span>
            </button>

            {/* Secondary Action: ADD PRESCRIPTION LENSES */}
            {product.category !== "contact-lenses" && (
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="w-full bg-[#FAF3EB] hover:bg-[#F4E9DD] border border-[#E8DEC8] text-[#1A1816] py-3 px-4 font-sans font-normal text-[11px] sm:text-[12px] uppercase tracking-[0.08em] transition-colors flex items-center justify-center gap-2 cursor-pointer text-center rounded-xl"
              >
                <Glasses className="w-4 h-4 text-[#C5A059]" />
                <span>ADD PRESCRIPTION LENSES (NIKON • ZEISS • ESSILOR)</span>
              </button>
            )}

            {/* Real-Time Courier EDD & Serviceability Estimator */}
            <PincodeEstimator isRx={product.category !== "contact-lenses"} />

            {/* Coupon Box */}
            <div className="bg-[#FAF3EB] border border-[#E8DEC8] p-3 sm:p-3.5 rounded-xl flex items-center justify-between font-sans text-[12px] text-[#1A1816]">
              <div>
                <span>Use code </span>
                <span className="font-bold text-[#C5A059]">FLAT12</span>
                <span> for 12% off your order</span>
              </div>
              <button
                onClick={handleCopyCoupon}
                className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#1A1816] hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                {copiedCoupon ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border border-[#E8DEC8] bg-white rounded-xl grid grid-cols-3 divide-x divide-[#E8DEC8] py-3 px-1 sm:px-2 shadow-2xs">
              <div className="flex flex-col items-center justify-center text-center px-1">
                <Truck className="w-5 h-5 text-[#0A251C] mb-1" />
                <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1A1816]">
                  FAST SHIPPING
                </span>
                <span className="font-sans text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">Ships in 48-72 Hrs</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center px-1">
                <ShieldCheck className="w-5 h-5 text-[#0A251C] mb-1" />
                <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1A1816]">
                  SECURE PAYMENT
                </span>
                <span className="font-sans text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">100% Safe Checkout</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center px-1">
                <RotateCcw className="w-5 h-5 text-[#0A251C] mb-1" />
                <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1A1816]">
                  7-DAY EXCHANGE
                </span>
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="font-sans text-[9px] sm:text-[10px] text-neutral-500 underline hover:text-[#C5A059] mt-0.5 cursor-pointer"
                >
                  View Policy
                </button>
              </div>
            </div>

            {/* WhatsApp Concierge Banner */}
            <button
              onClick={handleWhatsAppChat}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-sans font-medium text-[12px] sm:text-[13px] transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>Have questions or need live pictures? Chat with us.</span>
            </button>

            {/* Rating & Reviews Row */}
            <div className="border border-[#E8DEC8] bg-white rounded-xl px-4 py-2.5 flex items-center justify-between font-sans text-[12px] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#1A1816]">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]"
                    />
                  ))}
                </div>
                <span className="font-bold ml-1">{product.rating || 5.0}/5</span>
              </div>
              <span className="text-neutral-500 text-xs">
                {product.reviewCount || 38} certified client reviews
              </span>
            </div>

            {/* Specifications Section: INFORMATION */}
            <div className="pt-1">
              <h2 className="font-sans text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.18em] text-[#1A1816] mb-2">
                INFORMATION
              </h2>
              <div className="border border-[#E8DEC8] bg-white rounded-xl divide-y divide-[#E8DEC8] font-sans text-[11px] overflow-hidden shadow-2xs">
                {product.contactLensSpecs ? (
                  <>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Pack Size</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.contactLensSpecs.packSize || "30 Lenses Pack"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Wearing Schedule</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.contactLensSpecs.wearingSchedule || "Daily Disposable"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Base Curve (BC)</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.contactLensSpecs.baseCurve || "8.6 mm"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Water Content</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.contactLensSpecs.waterContent || "56%"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Material</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.contactLensSpecs.material || product.material || "Silicone Hydrogel"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Lens Size</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.specs?.lensWidth || 54} mm
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Nose Bridge Length</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.specs?.bridgeWidth || 18} mm
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Temple Length</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {product.specs?.templeLength || 145} mm
                      </span>
                    </div>
                    {formattedRimType && (
                      <div className="grid grid-cols-2 px-3.5 py-2">
                        <span className="text-neutral-500 font-normal">Rim Construction</span>
                        <span className="font-bold text-right text-[#1A1816]">
                          {formattedRimType}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Gender</span>
                      <span className="font-bold text-right text-[#1A1816] uppercase">
                        {product.gender || "UNISEX"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Material</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {formattedMaterial}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-3.5 py-2">
                      <span className="text-neutral-500 font-normal">Shape</span>
                      <span className="font-bold text-right text-[#1A1816]">
                        {formattedShape}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 px-3.5 py-2">
                  <span className="text-neutral-500 font-normal">Country of Origin</span>
                  <span className="font-bold text-right text-[#1A1816]">
                    {product.specs?.countryOfOrigin || countryOfOrigin}
                  </span>
                </div>
                {product.packageDimensions && (
                  <div className="grid grid-cols-2 px-3.5 py-2">
                    <span className="text-neutral-500 font-normal">Package Dimensions</span>
                    <span className="font-bold text-right text-[#1A1816]">
                      {product.packageDimensions.lengthCm}x{product.packageDimensions.breadthCm}x{product.packageDimensions.heightCm} cm ({product.packageDimensions.weightKg} kg)
                    </span>
                  </div>
                )}
                {/* Optical HSN Tax Codes */}
                <div className="grid grid-cols-2 px-3.5 py-2 bg-neutral-50/50">
                  <span className="text-neutral-500 font-normal">Optical HSN Code</span>
                  <span className="font-bold text-right text-[#1A1816]">
                    {product.category === "contact-lenses" ? "9001 (Contact Lenses)" : "9003 (Spectacle Frames)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E8DEC8]">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
                CURATED ATELIER COMPLEMENTS
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1816] uppercase">
                YOU MAY ALSO ADMIRE
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </section>

      {/* 4. Modals */}
      {isTryOnOpen && (
        <VirtualTryOnModal
          product={product}
          onClose={() => setIsTryOnOpen(false)}
          onAddToCart={() => handleAddToCart()}
          allProducts={allProducts}
          onOpenLensCustomizer={() => {
            setIsTryOnOpen(false);
            setIsCustomizerOpen(true);
          }}
        />
      )}

      {isCustomizerOpen && (
        <LensCustomizerModal
          product={product}
          onClose={() => setIsCustomizerOpen(false)}
          onConfirmLensConfig={handleConfirmLensConfig}
        />
      )}
    </div>
  );
};
