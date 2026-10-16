"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Sun,
  Truck,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  PhoneCall,
  Navigation,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/home/ProductCard";
import { ShapeFilterBar } from "@/components/home/ShapeFilterBar";
import { useAuth } from "@/context/AuthContext";

const SUNGLASSES_SHAPES = [
  { name: "Aviator", queryParam: "Aviator", img: "/images/shapes/aviator.png" },
  { name: "Round", queryParam: "Round", img: "/images/shapes/round.png" },
  {
    name: "Rectangle",
    queryParam: "Rectangle",
    img: "/images/shapes/rectangle.png",
  },
  {
    name: "Cat Eye",
    queryParam: "Cat-Eye",
    img: "/images/shapes/cat_eye.png",
  },
  {
    name: "Geometric",
    queryParam: "Geometric",
    img: "/images/shapes/geometric.png",
  },
  {
    name: "Clubmaster",
    queryParam: "Clubmaster",
    img: "/images/shapes/clubmaster.png",
  },
  { name: "Square", queryParam: "Square", img: "/images/shapes/square.png" },
];

const EYEGLASSES_SHAPES = [
  {
    name: "Rectangle",
    queryParam: "Rectangle",
    img: "/images/shapes/eyeglass_rectangle.png",
  },
  {
    name: "Cateye",
    queryParam: "Cat-Eye",
    img: "/images/shapes/eyeglass_cateye.png",
  },
  {
    name: "Aviator",
    queryParam: "Aviator",
    img: "/images/shapes/eyeglass_aviator.png",
  },
  {
    name: "Geometric",
    queryParam: "Geometric",
    img: "/images/shapes/eyeglass_geometric.png",
  },
  {
    name: "Round",
    queryParam: "Round",
    img: "/images/shapes/eyeglass_round.png",
  },
  {
    name: "Clubmaster",
    queryParam: "Clubmaster",
    img: "/images/shapes/eyeglass_clubmaster.png",
  },
  {
    name: "Square",
    queryParam: "Square",
    img: "/images/shapes/eyeglass_square.png",
  },
];

const FAQ_ITEMS = [
  {
    title: "Buying of Sunglasses",
    content: (
      <>
        <p className="mb-2">
          <strong>UV400 vs. Polarized:</strong> All Shivam Opticals sunglasses offer
          certified 100% UV400 protection against both UVA and UVB rays. Our
          polarized editions incorporate an acoustic multi-layer iodine filter to
          eliminate blinding glare from water, tarmac, and snow without
          distorting natural colors.
        </p>
        <p>
          <strong>Face Shape Fit:</strong> Round faces benefit from angular
          Geometric and Rectangle frames; square jawlines harmonize with soft
          Round and Aviator silhouettes.
        </p>
      </>
    ),
  },
  {
    title: "Buying of Frames & Lenses",
    content: (
      <>
        <p className="mb-2">
          <strong>Lens Options:</strong> You can select Zero Power (Fashion / Blue
          Light), Single Vision (Distance or Reading), or Freeform Digital
          Progressives (no line bifocals with wide corridor transition).
        </p>
        <p>
          <strong>Thin High Index:</strong> For prescriptions over ±2.50, our
          1.61, 1.67, and 1.74 ultra-thin high-index lenses prevent lens
          thickness and heavy weight.
        </p>
      </>
    ),
  },
  {
    title: "Buying of Contact Lenses",
    content: (
      <>
        <p className="mb-2">
          We provide certified Silicone Hydrogel breathable daily, bi-weekly,
          and monthly disposable contact lenses from Alcon, Bausch &amp; Lomb,
          and Acuvue.
        </p>
        <p>
          Ensure you have a recent corneal curvature (BC) and diameter
          measurement. Our optometrist team verifies each prescription before
          fulfillment.
        </p>
      </>
    ),
  },
  {
    title: "Buying of Computer Glasses",
    content: (
      <>
        <p className="mb-2">
          <strong>Shield Against Digital Eye Strain:</strong> Shivam Opticals
          Blue-Block lenses filter out 98% of harmful 410-455nm high-energy blue
          radiation emitted by laptops, tablets, and smartphone displays.
        </p>
        <p>
          Available in both zero-power (plano) and prescription formats, fitted
          with anti-smudge hydrophobic oleophobic coatings.
        </p>
      </>
    ),
  },
  {
    title: "Frequently Asked Questions",
    content: (
      <>
        <p className="mb-2">
          <strong>How do I submit my prescription?</strong> You can type it during
          checkout, upload a photo of your doctor&apos;s slip, or send it
          directly to our optometrist on WhatsApp (
          <a
            href="tel:09779990207"
            className="underline font-semibold text-[#1A1816]"
          >
            097799 90207
          </a>
          ) after placing your order.
        </p>
        <p className="mb-2">
          <strong>What is the warranty policy?</strong> 1 Year Comprehensive
          Warranty on all frames and lens anti-reflective coatings against
          manufacturing defects.
        </p>
        <p>
          <strong>Returns &amp; Exchanges:</strong> 14-day hassle-free doorstep
          return and exchange guarantee if the fit or power is not 100%
          satisfactory.
        </p>
      </>
    ),
  },
];

export default function HomePage() {
  const { openAppointmentModal } = useAuth();
  const [collectionTab, setCollectionTab] = useState<"new" | "bestsellers">(
    "new"
  );
  const [selectedShape, setSelectedShape] = useState<string>("all");
  const [recCategory, setRecCategory] = useState<"men" | "women" | "kids">(
    "men"
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const recCarouselRef = useRef<HTMLDivElement>(null);

  const scrollRecCarousel = (direction: -1 | 1) => {
    if (recCarouselRef.current) {
      recCarouselRef.current.scrollBy({
        left: direction * 240,
        behavior: "smooth",
      });
    }
  };

  const [productsList, setProductsList] = useState(PRODUCTS);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      })
      .catch((err) => console.warn("Failed to load live catalog from Supabase:", err));
  }, []);

  // Filter products for collection section
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((p) => {
        if (
          selectedShape !== "all" &&
          (p.shape || "").toLowerCase() !== selectedShape.toLowerCase()
        ) {
          return false;
        }
        if (collectionTab === "bestsellers") {
          return p.isBestSeller || (p.rating && p.rating >= 4.8);
        }
        return true;
      })
      .slice(0, 10);
  }, [productsList, selectedShape, collectionTab]);

  // Recommended products dynamically filtered by patron demographic
  const recommendedProducts = useMemo(() => {
    const list = productsList.filter((p) => {
      if (recCategory === "kids") return p.gender === "kids";
      if (recCategory === "women") return p.gender === "women" || p.gender === "unisex";
      return p.gender === "men" || p.gender === "unisex";
    });
    return list.length > 0 ? list.slice(0, 8) : productsList.slice(0, 8);
  }, [productsList, recCategory]);

  return (
    <div className="w-full">
      {/* ================= HERO SECTION (EXACT BANNER IMAGE) ================= */}
      <section className="relative w-full overflow-hidden bg-[#7EA3BA] border-b border-[#E8E2D9]/60">
        <div className="w-full relative">
          <Link
            href="/products?type=sunglasses"
            className="block w-full relative cursor-pointer"
            title="Shop Beach Club Sunglasses Collection"
          >
            <img
              src="/images/banner.png"
              alt="Shivam Opticals - Beach Club Eyewear Collection"
              className="w-full h-auto object-cover object-center block select-none"
              fetchPriority="high"
            />
            <span className="sr-only">Shop Beach Club Eyewear</span>
          </Link>
        </div>
      </section>

      {/* ================= PRODUCT COLLECTION TABS: NEW ARRIVALS & BEST SELLERS ================= */}
      <section
        id="sunglasses"
        className="pt-6 md:pt-8 pb-16 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Tab Navigation & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex border-b border-[#E8E2D9] space-x-8 md:space-x-12 mb-6">
            <button
              onClick={() => setCollectionTab("new")}
              className={`pb-3 text-sm md:text-base font-semibold tracking-[0.2em] uppercase transition relative ${
                collectionTab === "new"
                  ? "text-[#1A1816] border-b-2 border-[#1A1816]"
                  : "text-[#716B64] hover:text-[#1A1816]"
              }`}
            >
              NEW ARRIVALS
            </button>
            <button
              onClick={() => setCollectionTab("bestsellers")}
              className={`pb-3 text-sm md:text-base font-semibold tracking-[0.2em] uppercase transition relative ${
                collectionTab === "bestsellers"
                  ? "text-[#1A1816] border-b-2 border-[#1A1816]"
                  : "text-[#716B64] hover:text-[#1A1816]"
              }`}
            >
              BEST SELLERS
            </button>
          </div>

          {/* Quick Shape Sub-filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-wider text-[#716B64] font-medium">
            {["all", "Aviator", "Round", "Rectangle", "Cat-Eye", "Geometric"].map(
              (shape) => {
                const isActive = selectedShape === shape;
                return (
                  <button
                    key={shape}
                    onClick={() => setSelectedShape(shape)}
                    className={`px-3.5 py-1.5 rounded-full border transition cursor-pointer ${
                      isActive
                        ? "border-[#1A1816] bg-[#1A1816] text-white"
                        : "border-[#E8E2D9] bg-white text-[#1A1816] hover:border-[#C5A059]"
                    }`}
                  >
                    {shape === "all" ? "All" : shape}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* 5-Column Product Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ================= SECTION: GET THE PERFECT SHAPE - SUNGLASSES ================= */}
      <ShapeFilterBar
        title="Get the perfect shape – Sunglasses"
        type="sunglasses"
        shapes={SUNGLASSES_SHAPES}
      />

      {/* ================= SECTION: TRIED, LOVED & RECOMMENDED ================= */}
      <section id="recommended" className="py-14 max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Title & Tab Bar */}
        <div className="text-center mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#717171] mb-1">
            BEST SELLERS
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-[0.05em] text-[#111827] uppercase mb-4">
            TRIED, LOVED &amp; RECOMMENDED
          </h2>
          <div className="inline-flex items-center space-x-8 text-xs font-semibold tracking-wider uppercase">
            {(["men", "women", "kids"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setRecCategory(cat)}
                className={`pb-1 transition uppercase ${
                  recCategory === cat
                    ? "text-[#00A896] border-b-2 border-[#00A896] font-bold"
                    : "text-[#9CA3AF] hover:text-[#111827]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Showcase Row: Left Editorial Card + Right Product Carousel */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3 relative">
          {/* Left Editorial Card */}
          <div className="w-full lg:w-[220px] shrink-0 rounded-lg overflow-hidden relative shadow-sm group">
            <img
              src="/images/rec_editorial_man.png"
              alt="Modern Essentials - Built for everyday wear"
              className="w-full h-full object-cover object-center block"
            />
            <Link
              href="/products?shape=Rectangle"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[82%] h-8 bg-white hover:bg-neutral-100 text-[#1A1816] text-[10px] font-bold uppercase tracking-wider rounded shadow transition flex items-center justify-center cursor-pointer"
            >
              SHOP NOW
            </Link>
          </div>

          {/* Right Carousel Container */}
          <div className="flex-1 relative overflow-hidden">
            <button
              onClick={() => scrollRecCarousel(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:text-black hover:scale-105 transition cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={recCarouselRef}
              className="flex gap-3 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-none items-stretch"
            >
              {recommendedProducts.map((p) => (
                <div key={p.id} className="w-[200px] sm:w-[215px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRecCarousel(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E5E7EB] flex items-center justify-center text-[#374151] hover:text-black hover:scale-105 transition cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= SECTION: GET THE PERFECT SHAPE - EYEGLASSES ================= */}
      <ShapeFilterBar
        title="Get the perfect shape – Eyeglasses"
        type="eyeglasses"
        shapes={EYEGLASSES_SHAPES}
      />

      {/* ================= ARTISAN CRAFT BANNER SECTION ================= */}
      <section
        id="lifestyle-banner"
        className="py-8 sm:py-10 bg-[#FAF3EB] border-t border-[#E8DEC8]"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="relative w-full overflow-hidden rounded-2xl shadow-md border border-[#E8DEC8] bg-white">
            <Link
              href="/products"
              className="block w-full cursor-pointer"
              title="Explore Eyewear Collection"
            >
              <img
                src="/images/artisan_craft_banner.png"
                alt="Handcrafted Luxury Frames on Sculptural Podiums"
                className="w-full h-auto block select-none object-cover"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS: "WORDS WE LIVE BY" ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-[0.1em] text-[#1A1816] uppercase">
            Words we <span className="italic font-normal text-[#8C6239]">live by</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#716B64] mt-2">
            Over 45,000+ discerning patrons across India wear Shivam Opticals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Review 1 */}
          <div className="bg-white p-8 rounded-xl border border-[#E8E2D9]/70 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#2D2926] font-light leading-relaxed italic mb-6">
                &ldquo;The Italian acetate frame feels extraordinarily light yet ultra
                sturdy. Better than international luxury brands at 3x the cost!
                Shivam Opticals delivered it with my high prescription within 3
                days.&rdquo;
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8E2D9]/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Aishwarya Mukherjee
                </h4>
                <span className="text-[10px] text-[#716B64] tracking-wider uppercase">
                  Verified Patron • Mumbai
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified Buyer"></span>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-white p-8 rounded-xl border border-[#E8E2D9]/70 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#2D2926] font-light leading-relaxed italic mb-6">
                &ldquo;Ordered the Beach Club polarized sunglasses for my driving
                trips. Glare reduction is top tier and the gold titanium temple
                finish doesn&apos;t tarnish in humid weather.&rdquo;
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8E2D9]/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Rahul Verma
                </h4>
                <span className="text-[10px] text-[#716B64] tracking-wider uppercase">
                  Verified Patron • New Delhi
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified Buyer"></span>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-white p-8 rounded-xl border border-[#E8E2D9]/70 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#2D2926] font-light leading-relaxed italic mb-6">
                &ldquo;The precision shape guide gave me exact clarity on how the
                cat-eye silhouette would fit my jawline. Highly recommend their
                blue-block computer screen lenses for long screen hours!&rdquo;
              </p>
            </div>
            <div className="pt-4 border-t border-[#E8E2D9]/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Sonali Kulkarni
                </h4>
                <span className="text-[10px] text-[#716B64] tracking-wider uppercase">
                  Verified Patron • Bengaluru
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified Buyer"></span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEED TO KNOW: ACCORDION SECTION ================= */}
      <section id="faq" className="py-16 bg-[#F4EFEA]/30 border-y border-[#E8E2D9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-[0.1em] text-[#1A1816] uppercase">
              Need to{" "}
              <span className="italic font-normal text-[#8C6239]">Know</span>
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#716B64] mt-2">
              Your comprehensive optical guide to frames, lenses, and precision
              vision
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={item.title}
                  className="accordion-item bg-white rounded-lg border border-[#E8E2D9] overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenFaqIndex(isOpen ? null : index)
                    }
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between font-medium text-[#1A1816] hover:text-[#C5A059] transition cursor-pointer"
                  >
                    <span className="text-sm font-semibold tracking-wide">
                      {item.title}
                    </span>
                    <span className="text-[#716B64]">
                      {isOpen ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-[#716B64] leading-relaxed border-t border-[#E8E2D9]/40 pt-4">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MORE THAN JUST GLASSES: VALUE PILLARS ================= */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xs sm:text-sm font-bold tracking-[0.35em] text-[#1A1816] uppercase mb-12">
            MORE THAN JUST GLASSES
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059] mb-3.5 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-1">
                1 Year Warranty
              </h4>
              <p className="text-[11px] text-[#716B64] leading-relaxed max-w-[200px]">
                Full replacement coverage on structural frame craftsmanship.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059] mb-3.5 shadow-sm">
                <Sun className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-1">
                100% UV Protection
              </h4>
              <p className="text-[11px] text-[#716B64] leading-relaxed max-w-[200px]">
                Certified UV400 Japanese lenses guarding macular health.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059] mb-3.5 shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-1">
                Free Express Delivery
              </h4>
              <p className="text-[11px] text-[#716B64] leading-relaxed max-w-[200px]">
                Prompt insured air courier delivery across India &amp; 14-day
                returns.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FBF9F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059] mb-3.5 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-1">
                German Fitting Lab
              </h4>
              <p className="text-[11px] text-[#716B64] leading-relaxed max-w-[200px]">
                Robotic CNC diamond edging accurate to 0.01mm pupil centering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STORE LOCATION & CONTACT US SECTION ================= */}
      <section
        id="contact"
        className="py-16 md:py-20 bg-[#FBF9F5] border-t border-[#E8E2D9]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAF3EB] border border-[#E8DEC8] rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#C5A059]/15 blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#C5A059] block">
                  VISIT OUR STORE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1A1816] leading-tight">
                  Shivam Opticals
                </h2>

                <div className="space-y-3.5 pt-2 text-sm text-[#2D2926]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8DEC8] flex items-center justify-center text-[#C5A059] shadow-xs shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1816]">Store Address:</p>
                      <p className="text-[#2D2926]/90 leading-relaxed mt-0.5">
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
                      <span className="font-bold text-[#1A1816]">
                        Call / WhatsApp:{" "}
                      </span>
                      <a
                        href="tel:09779990207"
                        className="text-[#1A1816] hover:text-[#C5A059] font-bold text-base transition ml-1 underline decoration-[#C5A059]/50 underline-offset-2"
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
                      <span className="font-bold text-[#1A1816]">
                        Store Hours:{" "}
                      </span>
                      <span className="text-[#2D2926]/90 font-medium ml-1">
                        Open 7 Days • 10:30 AM to 9:00 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <a
                  href="tel:09779990207"
                  className="w-full py-3.5 px-6 bg-[#1A1816] hover:bg-black text-white text-center font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-2 group"
                >
                  <PhoneCall className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                  <span>Call Us Now: 097799 90207</span>
                </a>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=SAMACHAR+market+Shop+No-1+Kanishka+Complex+Mayur+Vihar+Phase+I+extention+Delhi+110091"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-white hover:bg-[#F3EDE5] text-[#1A1816] text-center font-bold text-xs uppercase tracking-wider rounded-lg border border-[#E8DEC8] transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4 text-[#C5A059]" />
                  <span>Get Directions on Google Maps</span>
                </a>

                <button
                  onClick={openAppointmentModal}
                  className="w-full py-3.5 px-6 bg-[#C5A059] hover:bg-[#B08B45] text-[#1A1816] text-center font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#1A1816]" />
                  <span>Book In-Store Eye Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
