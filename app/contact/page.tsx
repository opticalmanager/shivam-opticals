"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Send,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Glasses,
  Sparkles,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ContactPage() {
  const { openAppointmentModal } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Comprehensive Computerized Eye Test",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Please provide your name and contact phone number.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Consultation Request Received", {
        description: "Our Mayur Vihar master optician concierge will contact you within 2 to 4 hours.",
      });
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "Comprehensive Computerized Eye Test",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Atelier Breadcrumb & Header Banner */}
      <section className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold">
            <Link href="/" className="hover:text-[#0A251C] transition">Home</Link>
            <span>/</span>
            <span className="text-[#C5A059] font-bold">Contact & Atelier Store</span>
          </div>
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#C5A059] uppercase block">
            SHIVAM OPTICALS ATELIER • MAYUR VIHAR PHASE 1
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0A251C] tracking-tight">
            Consult With Our Optical Masters
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Experience clinical optometry precision, certified Zeiss lens diagnostics, and bespoke frame fittings at our flagship optical store in Mayur Vihar, New Delhi.
          </p>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Direct Atelier Coordinates */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                  PHYSICAL FLAGSHIP
                </span>
                <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                  Shivam Opticals Flagship Atelier
                </h2>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3.5 text-xs text-stone-700">
                <div className="w-9 h-9 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[#C5A059] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A251C] text-[11px] tracking-wider mb-0.5">
                    Store Location
                  </h3>
                  <p className="leading-relaxed">
                    Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Phase 1 Extension, New Delhi - 110091
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Landmark: Near Samachar Apartments • Opposite Pocket 1
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3.5 text-xs text-stone-700">
                <div className="w-9 h-9 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[#C5A059] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A251C] text-[11px] tracking-wider mb-0.5">
                    Visiting Hours
                  </h3>
                  <p className="font-medium text-[#0A251C]">Monday – Sunday: 10:30 AM – 09:00 PM</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Optometrist available daily for computerized eye tests
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3.5 text-xs text-stone-700">
                <div className="w-9 h-9 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[#C5A059] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A251C] text-[11px] tracking-wider mb-0.5">
                    Direct Phone Line
                  </h3>
                  <a
                    href="tel:09779990207"
                    className="font-medium text-[#0A251C] hover:text-[#C5A059] transition"
                  >
                    097799 90207
                  </a>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Direct optician assistance & order queries
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5 text-xs text-stone-700">
                <div className="w-9 h-9 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[#C5A059] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A251C] text-[11px] tracking-wider mb-0.5">
                    Concierge Inquiries
                  </h3>
                  <a
                    href="mailto:info@shivamoptics.in"
                    className="font-medium text-[#0A251C] hover:text-[#C5A059] transition"
                  >
                    info@shivamoptics.in
                  </a>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Response within 2-4 business hours
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://wa.me/919779990207?text=Hello%20Shivam%20Optics,%20I%20would%20like%20to%20inquire%20about%20eyewear%20styling%20and%20consultations."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://maps.google.com/?q=Shivam+Optical+Kanishka+Complex+Samachar+Market+Mayur+Vihar+Phase+1+Delhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Directions</span>
                </a>
              </div>
            </div>

            {/* Quick Consultation Callout */}
            <div className="bg-[#FAF3EB] rounded-2xl border border-[#E8DEC8] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#0A251C]">
                <Calendar className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Book Clinical Eye Test Online
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Prefer a guaranteed consultation slot without waiting? Reserve your computerized eye test or frame styling session in under 30 seconds.
              </p>
              <button
                type="button"
                onClick={openAppointmentModal}
                className="w-full py-3 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.16em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Reserve Consultation Slot</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Consultation & Concierge Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DEC8] p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-2 border-b border-[#E8DEC8] pb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                CONCIERGE INQUIRY
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0A251C]">
                Transmit an Optical Inquiry
              </h2>
              <p className="text-xs text-stone-500">
                Have a question regarding progressive lens packages, prescription accuracy, or designer frame sizing? Leave a message below.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#0A251C]">
                  Inquiry Received
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Shivam Opticals. A senior optometrist concierge has been notified and will contact you via phone or email shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#0A251C] text-[#0A251C] hover:bg-[#0A251C] hover:text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="patron@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Service of Interest
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059] bg-white cursor-pointer"
                  >
                    <option value="Comprehensive Computerized Eye Test">
                      Comprehensive Computerized Eye Test
                    </option>
                    <option value="Bespoke Luxury Frame Styling">
                      Bespoke Luxury Frame Styling & Fitting
                    </option>
                    <option value="Zeiss / Essilor Lens Recommendation">
                      Zeiss / Essilor Lens Thickness & Package Recommendation
                    </option>
                    <option value="Contact Lens Fitting & Consultation">
                      Contact Lens Fitting & Consultation
                    </option>
                    <option value="Ultrasonic Cleaning & Frame Tuning">
                      Ultrasonic Cleaning & Frame Tuning (Complimentary)
                    </option>
                    <option value="Corporate / Institutional Vision Inquiry">
                      Corporate / Institutional Vision Inquiry
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Message or Prescription Details (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please specify any particular frame models, eye power concerns, or questions for our optometrist..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "TRANSMITTING..." : "SUBMIT INQUIRY"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Your contact details are strictly confidential under our clinical privacy policy.</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
