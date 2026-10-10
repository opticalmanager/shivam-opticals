"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, X, Phone, ShieldCheck, ArrowRight } from "lucide-react";

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, user, logout } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  if (!isLoginModalOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    login(phone, name || "Patron");
    setStep("phone");
    setPhone("");
    setName("");
    setOtp("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        onClick={closeLoginModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200 border border-[#E8E2D9]">
        {/* Header */}
        <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-[#C5A059]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-[0.12em] uppercase text-[#1A1816] font-serif">
                {user ? "Patron Account" : "Patron Sign In / Register"}
              </h3>
              <p className="text-[11px] text-[#716B64]">Shivam Optical Haute Lunetterie</p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1 hover:text-[#C5A059] text-stone-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center text-xl font-serif font-bold text-[#0A251C] mx-auto">
              {user.name?.charAt(0) || "P"}
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1A1816]">{user.name}</h4>
              <p className="text-xs text-[#716B64] font-mono mt-0.5">{user.phone}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3EB] text-[#C5A059] border border-[#E8DEC8]">
                VIP Optical Patron
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                closeLoginModal();
              }}
              className="w-full py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : step === "phone" ? (
          <form onSubmit={handleSendOtp} className="p-6 space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Kapoor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Mobile Number (SMS OTP) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98100 12345"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm outline-none focus:border-[#C5A059] font-mono"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  +91
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>CONTINUE WITH OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-stone-400 border-t border-stone-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit SSL encrypted patron verification</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            <div className="text-center pb-1">
              <p className="text-xs text-stone-600">Enter the 4-digit code sent to</p>
              <p className="font-mono font-bold text-sm text-stone-900 mt-0.5">+91 {phone}</p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • •"
                className="w-full py-3 text-center text-xl font-mono tracking-[0.5em] rounded-xl border border-stone-300 outline-none focus:border-[#C5A059]"
              />
              <p className="text-[10px] text-center text-stone-400 mt-1">
                (Test sandbox code: Any 4 digits, e.g. 1234)
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0A251C] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] rounded-xl transition cursor-pointer shadow-sm"
              >
                VERIFY &amp; ACCESS ACCOUNT
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-center text-xs text-[#C5A059] hover:underline font-bold"
            >
              Change Mobile Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
