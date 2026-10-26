"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Glasses,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";

  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("shivamoptical999@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Remember me is checked by default
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // OTP flow state
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(45);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authMode === "otp" && otpStep === "verify" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, resendTimer]);

  // Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Invalid email or password.");
        return;
      }

      toast.success("Login successful.");

      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 400);
    } catch (err) {
      console.error("Admin login network failure:", err);
      toast.error("Network error during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error("Please enter your admin email.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to send verification code.");
        return;
      }

      setOtpStep("verify");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(45);
      toast.success(`Verification code sent to ${email.trim().toLowerCase()}`);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (err) {
      console.error("Admin send OTP error:", err);
      toast.error("Network error while sending verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (overrideCode?: string) => {
    const fullCode = overrideCode || otpDigits.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullCode,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Invalid or expired code.");
        return;
      }

      toast.success("Verification successful.");

      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 400);
    } catch (err) {
      console.error("Admin OTP verification error:", err);
      toast.error("Network error verifying code.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP single-box auto-advance & paste handler
  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newArr = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newArr[i] = pasted[i] || "";
        }
        setOtpDigits(newArr);
        const nextIdx = Math.min(pasted.length, 5);
        otpRefs.current[nextIdx]?.focus();
        if (pasted.length === 6) {
          handleVerifyOtp(pasted);
        }
        return;
      }
    }

    const clean = val.replace(/\D/g, "").slice(-1);
    const newArr = [...otpDigits];
    newArr[index] = clean;
    setOtpDigits(newArr);

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (index === 5 && clean) {
      const code = newArr.join("");
      if (code.length === 6) {
        handleVerifyOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-[#1A1816]">
      <div className="max-w-md w-full space-y-6">
        {/* Simple Header Back Link */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#0A251C] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Storefront</span>
          </Link>
          <span className="text-xs text-[#6B7280] font-medium">
            Shivam Optical
          </span>
        </div>

        {/* Premium Light Login Card */}
        <div className="bg-white rounded-3xl border border-[#E8DEC8] p-8 sm:p-10 shadow-xl shadow-stone-200/50">
          {/* Logo & Clean Heading */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center mx-auto text-[#0A251C] shadow-xs mb-3">
              <Glasses className="w-6 h-6 text-[#0A251C]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#0A251C] tracking-tight">
              Admin Login
            </h1>
            <p className="text-xs text-[#6B7280]">
              Sign in to manage your store
            </p>
          </div>

          {/* Simple Tab: Password vs OTP */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMode("password")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === "password"
                  ? "bg-white text-[#0A251C] shadow-xs font-bold"
                  : "text-[#6B7280] hover:text-[#0A251C]"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                if (otpStep === "send") {
                  handleSendOtp();
                }
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === "otp"
                  ? "bg-white text-[#0A251C] shadow-xs font-bold"
                  : "text-[#6B7280] hover:text-[#0A251C]"
              }`}
            >
              OTP Code
            </button>
          </div>

          {/* Mode 1: Password Form */}
          {authMode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-[#1A1816] block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shivamoptical999@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8DEC8] text-sm text-[#1A1816] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A251C] focus:ring-1 focus:ring-[#0A251C] transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-[#1A1816] block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-[#E8DEC8] text-sm text-[#1A1816] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A251C] focus:ring-1 focus:ring-[#0A251C] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0A251C] transition p-0.5 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me (Strictly 'Remember me', checked by default) */}
              <div className="pt-1 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#0A251C] focus:ring-[#0A251C] accent-[#0A251C] cursor-pointer"
                  />
                  <span className="text-xs text-[#4B5563] font-medium">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-[#0A251C] hover:bg-[#144233] text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: OTP Form */}
          {authMode === "otp" && (
            <div className="space-y-4">
              {otpStep === "send" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1816] block mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8DEC8] text-sm text-[#1A1816] outline-none focus:border-[#0A251C] focus:ring-1 focus:ring-[#0A251C]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleSendOtp}
                    className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-[#144233] text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm hover:shadow"
                  >
                    {isSendingOtp ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending code...</span>
                      </span>
                    ) : (
                      <span>Send Code</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-[#6B7280]">
                      Enter the 6-digit code sent to:
                    </p>
                    <p className="text-xs font-semibold text-[#0A251C]">
                      {email}
                    </p>
                  </div>

                  {/* 6 Digit Input Boxes */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-9 h-11 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold font-mono rounded-lg sm:rounded-xl bg-white border border-[#E8DEC8] text-[#0A251C] focus:border-[#0A251C] focus:ring-2 focus:ring-[#0A251C]/20 outline-none transition"
                      />
                    ))}
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#0A251C] focus:ring-[#0A251C] accent-[#0A251C] cursor-pointer"
                      />
                      <span className="text-xs text-[#4B5563] font-medium">
                        Remember me
                      </span>
                    </label>
                  </div>

                  {/* Verify Action Button */}
                  <button
                    type="button"
                    disabled={isLoading || otpDigits.join("").length !== 6}
                    onClick={() => handleVerifyOtp()}
                    className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-[#144233] text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm hover:shadow"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      <span>Verify &amp; Sign In</span>
                    )}
                  </button>

                  {/* Resend Link */}
                  <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#E8DEC8]">
                    <span>Didn&apos;t receive code?</span>
                    {resendTimer > 0 ? (
                      <span>Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="font-semibold text-[#0A251C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A251C]" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
