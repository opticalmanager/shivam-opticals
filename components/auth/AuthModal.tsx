"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Lock,
  MessageSquare,
  Smartphone,
  Loader2,
  Sparkles,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  returnUrl?: string | null;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSuccess,
  returnUrl: propReturnUrl,
  initialMode = "signin",
}) => {
  const router = useRouter();
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithPhone,
    authReturnUrl,
  } = useAuth();

  const isModalVisible = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || closeAuthModal;
  const targetReturnUrl = propReturnUrl || authReturnUrl;

  const [authType, setAuthType] = useState<"signin" | "signup">(initialMode);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isSwitchingChannel, setIsSwitchingChannel] = useState(false);
  const [displayPhone, setDisplayPhone] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state on close/open
  useEffect(() => {
    if (isModalVisible) {
      setAuthType(initialMode);
      setChannel("whatsapp");
      setIsOtpSent(false);
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(30);
    }
  }, [isModalVisible, initialMode]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, resendTimer]);

  if (!isModalVisible) return null;

  // Step 1: Send OTP via WhatsApp or SMS
  const handleSendOtp = async (targetChannel: "whatsapp" | "sms" = channel) => {
    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits || (rawDigits.length !== 10 && !phone.startsWith("+91"))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (authType === "signup" && !name.trim()) {
      toast.error("Please enter your full name for membership registration");
      return;
    }

    setIsLoadingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          channel: targetChannel,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to dispatch verification code");
        return;
      }

      setIsOtpSent(true);
      setActiveChannel(data.channel || targetChannel);
      setResendTimer(data.cooldown || 30);
      setDisplayPhone(phone);
      setOtp(["", "", "", "", "", ""]);

      toast.success(
        targetChannel === "whatsapp"
          ? "Verification code sent to your WhatsApp"
          : "Verification code sent via SMS",
        {
          description: data.fallbackUsed
            ? "WhatsApp was unavailable; code was dispatched via SMS."
            : `Valid for 10 minutes`,
        }
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch {
      toast.error("Network error while requesting verification code");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (overrideOtpString?: string) => {
    const fullOtp = overrideOtpString || otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: displayPhone || phone,
          otp: fullOtp,
          name: name.trim() || undefined,
          mode: authType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Invalid verification code. Please try again.");
        return;
      }

      loginWithPhone(
        displayPhone || phone,
        data.user || { name: name.trim() || "Valued Patron" },
        data.orders || []
      );

      handleClose();

      if (onSuccess) {
        onSuccess();
      } else if (targetReturnUrl) {
        router.push(targetReturnUrl);
      }
    } catch {
      toast.error("Network error during code verification");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle single-digit input with auto-advance
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (pasted.length === 6) {
          handleVerifyOtp(pasted);
        }
        return;
      }
    }

    const cleanDigit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && cleanDigit) {
      const candidateCode = newOtp.join("");
      if (candidateCode.length === 6) {
        handleVerifyOtp(candidateCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle switching channel on resend
  const handleSwitchChannelAndResend = async () => {
    const nextChannel = activeChannel === "whatsapp" ? "sms" : "whatsapp";
    setIsSwitchingChannel(true);
    await handleSendOtp(nextChannel);
    setIsSwitchingChannel(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Main Dialog Card */}
      <div className="relative bg-[#FCFAF7] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden z-50 border border-[#E8E2D9] animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="p-6 border-b border-[#E8DEC8] flex items-center justify-between bg-[#FAF3EB]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#716B64] uppercase">
                SHIVAM OPTICAL ATELIER
              </p>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#0A251C] tracking-wide">
              {isOtpSent
                ? "Enter Verification Code"
                : authType === "signin"
                ? "Patron Sign In"
                : "Patron Privilege Registration"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-[#E8DEC8] flex items-center justify-center text-[#716B64] hover:text-[#0A251C] hover:border-[#C5A059] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {!isOtpSent ? (
            /* =========================================================================
               STEP 1: Phone & Name Input
               ========================================================================= */
            <div className="space-y-5">
              {/* Mode Toggle Pills (Sign In / Register) */}
              <div className="grid grid-cols-2 p-1 bg-[#F4EFEA] rounded-xl border border-[#E8DEC8]">
                <button
                  type="button"
                  onClick={() => setAuthType("signin")}
                  className={`py-2 text-xs font-sans font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                    authType === "signin"
                      ? "bg-white text-[#0A251C] shadow-xs"
                      : "text-[#716B64] hover:text-[#1A1816]"
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType("signup")}
                  className={`py-2 text-xs font-sans font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                    authType === "signup"
                      ? "bg-white text-[#0A251C] shadow-xs"
                      : "text-[#716B64] hover:text-[#1A1816]"
                  }`}
                >
                  NEW PATRON
                </button>
              </div>

              {/* Full Name input for registration */}
              {authType === "signup" && (
                <div>
                  <label className="block text-[11px] font-sans font-semibold tracking-wider text-[#716B64] uppercase mb-1.5">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm text-[#1A1816] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition"
                  />
                </div>
              )}

              {/* Mobile Number Input */}
              <div>
                <label className="block text-[11px] font-sans font-semibold tracking-wider text-[#716B64] uppercase mb-1.5">
                  Mobile Number (India +91)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-sans font-bold text-stone-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone.replace(/^\+91\s?/, "")}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98100 12345"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8DEC8] rounded-xl text-sm font-sans text-[#1A1816] placeholder:text-stone-400 focus:outline-hidden focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  We will send a one-time 6-digit verification code.
                </p>
              </div>

              {/* Channel Selector: WhatsApp vs SMS */}
              <div>
                <label className="block text-[11px] font-sans font-semibold tracking-wider text-[#716B64] uppercase mb-1.5">
                  Send Verification Code Via
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setChannel("whatsapp")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-sans font-semibold transition cursor-pointer ${
                      channel === "whatsapp"
                        ? "border-[#0A251C] bg-[#0A251C] text-white shadow-xs"
                        : "border-[#E8DEC8] bg-white text-[#716B64] hover:border-stone-400"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("sms")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-sans font-semibold transition cursor-pointer ${
                      channel === "sms"
                        ? "border-[#0A251C] bg-[#0A251C] text-white shadow-xs"
                        : "border-[#E8DEC8] bg-white text-[#716B64] hover:border-stone-400"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>SMS Alert</span>
                  </button>
                </div>
              </div>

              {/* Primary Dispatch Button */}
              <button
                type="button"
                onClick={() => handleSendOtp(channel)}
                disabled={isLoadingOtp || !phone.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-[#C5A059] hover:bg-[#B08B45] text-white font-sans text-xs font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DISPATCHING SECURE CODE...</span>
                  </>
                ) : (
                  <>
                    <span>REQUEST VERIFICATION CODE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Patron Benefits Ribbon */}
              <div className="pt-2 border-t border-[#E8DEC8]/60 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[#716B64]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                  <span>Earn atelier loyalty points on every luxury purchase</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#716B64]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                  <span>Secure optical prescription & warranty records</span>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               STEP 2: 6-Digit OTP Verification
               ========================================================================= */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs text-[#716B64]">
                  Code dispatched to{" "}
                  <span className="font-bold text-[#0A251C]">
                    +91 {displayPhone.replace(/^\+91\s?/, "")}
                  </span>{" "}
                  via{" "}
                  <span className="capitalize font-semibold text-[#C5A059]">
                    {activeChannel}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-[11px] text-[#C5A059] hover:underline font-semibold cursor-pointer"
                >
                  Change mobile number
                </button>
              </div>

              {/* 6 Digit Input Grid */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-sans bg-white border border-[#E8DEC8] rounded-xl text-[#0A251C] focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30 focus:outline-hidden transition shadow-xs"
                  />
                ))}
              </div>

              {/* Verify Action Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isVerifying || otp.join("").length !== 6}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0A251C] hover:bg-[#153a2d] text-white font-sans text-xs font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING PATRON...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#C5A059]" />
                    <span>VERIFY & CONTINUE</span>
                  </>
                )}
              </button>

              {/* Resend & Channel Switch Actions */}
              <div className="pt-2 border-t border-[#E8DEC8] space-y-2 text-center">
                {resendTimer > 0 ? (
                  <p className="text-[11px] text-stone-500 font-sans">
                    Resend code available in{" "}
                    <span className="font-bold text-[#0A251C]">{resendTimer}s</span>
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSendOtp(activeChannel)}
                      disabled={isLoadingOtp}
                      className="text-xs font-bold text-[#0A251C] hover:text-[#C5A059] transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend via {activeChannel}</span>
                    </button>
                    <span className="hidden sm:inline text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={handleSwitchChannelAndResend}
                      disabled={isSwitchingChannel}
                      className="text-xs font-bold text-[#C5A059] hover:underline transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        Resend via {activeChannel === "whatsapp" ? "SMS" : "WhatsApp"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
