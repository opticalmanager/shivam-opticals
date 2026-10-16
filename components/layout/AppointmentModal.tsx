"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, X, MapPin, CheckCircle2 } from "lucide-react";

export const AppointmentModal: React.FC = () => {
  const { isAppointmentModalOpen, closeAppointmentModal, bookAppointment } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: new Date().toISOString().split("T")[0],
    time: "11:00 AM",
    service: "Comprehensive Computerized Eye Test",
    notes: "",
  });

  if (!isAppointmentModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    bookAppointment(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={closeAppointmentModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200 border border-[#E8E2D9]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-[0.12em] uppercase text-[#1A1816] font-serif">
                Reserve Eye Test Consultation
              </h3>
              <p className="text-[11px] text-[#716B64]">Shivam Opticals • Mayur Vihar Phase 1</p>
            </div>
          </div>
          <button
            onClick={closeAppointmentModal}
            className="p-1 hover:text-[#C5A059] text-stone-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Banner */}
        <div className="px-5 py-2.5 bg-[#FAF3EB] border-b border-[#E8DEC8] flex items-center gap-2 text-[11px] text-[#716B64]">
          <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
          <span>Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Ph 1 Ext</span>
        </div>

        {/* Appointment Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Time Slot
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059] bg-white cursor-pointer"
              >
                <option value="11:00 AM">11:00 AM - Morning</option>
                <option value="01:00 PM">01:00 PM - Afternoon</option>
                <option value="03:00 PM">03:00 PM - Mid-Day</option>
                <option value="05:00 PM">05:00 PM - Evening</option>
                <option value="07:00 PM">07:00 PM - Night</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Select Optical Service
            </label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059] bg-white cursor-pointer"
            >
              <option value="Comprehensive Computerized Eye Test">
                Comprehensive Computerized Eye Test (Free with purchase)
              </option>
              <option value="Contact Lens Fitting & Clinical Trial">
                Contact Lens Fitting & Clinical Trial
              </option>
              <option value="Frame Styling & Lens Thickness Recommendation">
                Frame Styling & Lens Thickness Recommendation
              </option>
              <option value="Ultrasonic Cleaning & Hinge Adjustment">
                Ultrasonic Cleaning & Hinge Adjustment
              </option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>CONFIRM CONSULTATION RESERVATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
