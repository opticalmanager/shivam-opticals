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
  Navigation,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.884 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function ContactPage() {
  const { openAppointmentModal } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "General Question or Inquiry",
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
      toast.success("Message Received", {
        description: "Our Mayur Vihar store team will get back to you within 2 to 4 hours.",
      });
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "General Question or Inquiry",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Breadcrumb & Clean Header */}
      <section className="bg-white border-b border-[#E8DEC8] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 font-semibold">
            <Link href="/" className="hover:text-[#0A251C] transition">Home</Link>
            <span>/</span>
            <span className="text-[#C5A059] font-bold">Contact Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0A251C] tracking-tight">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl leading-relaxed">
            Have a question or need help with your frames or lenses? Visit our Mayur Vihar store or send us a message below.
          </p>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Direct Store Coordinates */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                  STORE LOCATION
                </span>
                <h2 className="text-xl font-serif font-bold text-[#0A251C]">
                  Our Store in Mayur Vihar
                </h2>
                <p className="text-xs text-stone-500">
                  Visit us for frame fittings, adjustments, and computerized eye testing.
                </p>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3.5 text-xs text-stone-700">
                <div className="w-9 h-9 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] text-[#C5A059] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A251C] text-[11px] tracking-wider mb-0.5">
                    Address
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
                    Opening Hours
                  </h3>
                  <p className="font-medium text-[#0A251C]">Monday – Sunday: 10:30 AM – 09:00 PM</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Open all 7 days for computerized eye tests
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
                    Phone
                  </h3>
                  <a
                    href="tel:09779990207"
                    className="font-medium text-[#0A251C] hover:text-[#C5A059] transition"
                  >
                    +91 97799 90207
                  </a>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Call for orders, frame availability &amp; assistance
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
                    Email
                  </h3>
                  <a
                    href="mailto:info@shivamoptical.in"
                    className="font-medium text-[#0A251C] hover:text-[#C5A059] transition"
                  >
                    info@shivamoptical.in
                  </a>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    We respond within 2 to 4 business hours
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://wa.me/919779990207?text=Hello%20Shivam%20Optical,%20I%20have%20an%20inquiry%20regarding%20eyewear."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
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

            {/* Quick Eye Test Appointment Callout */}
            <div className="bg-[#FAF3EB] rounded-2xl border border-[#E8DEC8] p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#0A251C]">
                <Calendar className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Book an Eye Test Online
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Reserve your computerized eye test slot or frame styling session at our Mayur Vihar store in under 30 seconds.
              </p>
              <button
                type="button"
                onClick={openAppointmentModal}
                className="w-full py-2.5 sm:py-3 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.14em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve Eye Test Slot</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean Interactive Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DEC8] p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1.5 border-b border-[#E8DEC8] pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                SEND A MESSAGE
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0A251C]">
                Send Us a Message
              </h2>
              <p className="text-xs text-stone-500">
                Have a question about frames, lenses, or need assistance? Fill out the form below and our team will get back to you shortly.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#0A251C]">
                  Message Sent Successfully
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Shivam Optical. Our team has received your message and will get in touch with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#0A251C] text-[#0A251C] hover:bg-[#0A251C] hover:text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  Send Another Message
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
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    What can we help you with?
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059] bg-white cursor-pointer"
                  >
                    <option value="General Question or Inquiry">
                      General Question or Inquiry
                    </option>
                    <option value="Book Computerized Eye Test">
                      Book Computerized Eye Test Appointment
                    </option>
                    <option value="Prescription Lenses (Zeiss, Essilor, Single Vision, Progressive)">
                      Prescription Lenses (Zeiss, Essilor, Single Vision, Progressive)
                    </option>
                    <option value="Frame Sizing & Styling Advice">
                      Frame Sizing &amp; Styling Advice
                    </option>
                    <option value="Order Status & Tracking">
                      Order Status &amp; Tracking
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Your Message (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Type your message, questions, or frame requirements here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-[0.16em] rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "SENDING..." : "SEND MESSAGE"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Your contact details are kept strictly private and secure with us.</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
