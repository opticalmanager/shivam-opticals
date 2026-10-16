"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Check,
  Eye,
  Glasses,
  Sun,
  Wrench,
  MapPin,
  Phone,
  Clock,
  PhoneCall,
  Navigation,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AboutPage() {
  const { openAppointmentModal } = useAuth();

  return (
    <div className="w-full">
      {/* ================= BREADCRUMB ================= */}
      <section className="bg-[#FAF3EB]/60 border-b border-[#E8DEC8] py-3.5">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-2 text-xs text-[#7A7571] tracking-wider uppercase">
            <Link href="/" className="hover:text-[#C5A059] transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#0A251C] font-semibold">About Us</span>
          </nav>
        </div>
      </section>

      {/* ================= ABOUT OUR STORE ================= */}
      <section className="py-16 md:py-20 border-b border-[#E8DEC8] bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Real Store Photo / Fitting Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-[#E8DEC8] bg-[#FCFAF7] relative">
                <img
                  src="/images/artisan_craft_banner.png"
                  alt="Shivam Opticals Eyewear Fitting and Care"
                  className="w-full h-auto object-cover"
                />
                <div className="p-5 bg-white border-t border-[#E8DEC8]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0A251C]">
                        Shivam Opticals
                      </h4>
                      <p className="text-xs text-[#7A7571]">
                        Mayur Vihar Phase 1, Delhi • Est. Store
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Simple, Genuine Story */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-wider uppercase text-[#C5A059] block">
                  WHO WE ARE
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C] leading-snug">
                  Clear Vision, Honest Advice, and Personal Care
                </h2>
              </div>

              <div className="space-y-4 text-sm text-neutral-600 leading-relaxed font-normal">
                <p>
                  At <strong className="text-[#0A251C] font-semibold">Shivam Opticals</strong>,
                  our goal is very simple: to make sure you see clearly and feel
                  comfortable in your glasses every single day.
                </p>
                <p>
                  We know that finding the right pair of spectacles can
                  sometimes be overwhelming with too many confusing options and
                  high prices. That is why we keep things straightforward. When
                  you walk into our store, we give you honest guidance on which
                  frame matches your face shape, which lenses suit your daily
                  screen or driving habits, and what fits your budget best.
                </p>
                <p>
                  Whether you need a routine eye test, blue-light computer
                  glasses to avoid screen strain, progressive lenses for reading
                  and distance, or sunglasses for driving, we are here to assist
                  you with friendly, dependable service.
                </p>
              </div>

              {/* Quick Highlight Checklist */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#0A251C] font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Accurate Computerized Eye Testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Large Selection of Branded &amp; Daily Frames</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Anti-Glare &amp; Blue-Cut Screen Lenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Free Frame Cleaning &amp; Nose Pad Fitting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHAT WE OFFER (4 SIMPLE PILLARS) ================= */}
      <section className="py-16 bg-[#FAF3EB]/50 border-b border-[#E8DEC8]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold tracking-wider uppercase text-[#C5A059] block">
              OUR SERVICES
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
              What You Get at Shivam Opticals
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Everything you need for your vision under one roof
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E8DEC8] shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A251C] mb-2">
                Computer Eye Testing
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Quick, comfortable, and accurate computerized eye checkup to
                find your exact power for clear, headache-free vision.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E8DEC8] shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center mb-4">
                <Glasses className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A251C] mb-2">
                Eyeglasses for Everyone
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Lightweight metal, durable acetate, rimless, and flexible
                frames designed for men, women, and kids in all shapes and
                sizes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E8DEC8] shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center mb-4">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A251C] mb-2">
                Sunglasses &amp; Contact Lenses
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Polarized and UV-protected shades for outdoor eye safety,
                along with branded daily and monthly contact lenses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E8DEC8] shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#FAF3EB] text-[#0A251C] flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A251C] mb-2">
                Frame Adjustments &amp; Repairs
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Loose screw tightening, nose pad replacement, and temple
                alignment done quickly while you wait.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STORE LOCATION & CONTACT US SECTION ================= */}
      <section
        id="store-details"
        className="py-16 md:py-20 bg-[#FCFAF7] border-t border-[#E8DEC8]"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-[#FAF3EB] border border-[#E8DEC8] rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#C5A059] block">
                  VISIT OUR STORE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#0A251C] leading-tight">
                  Shivam Opticals
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

                <a
                  href="https://www.google.com/maps/search/?api=1&query=SAMACHAR+market+Shop+No-1+Kanishka+Complex+Mayur+Vihar+Phase+I+extention+Delhi+110091"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-white hover:bg-[#F3EDE5] text-[#0A251C] text-center font-bold text-xs uppercase tracking-wider rounded-lg border border-[#E8DEC8] transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4 text-[#C5A059]" />
                  <span>Get Directions on Google Maps</span>
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
}
