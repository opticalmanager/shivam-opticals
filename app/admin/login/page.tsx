"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
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
  
  // Remember Me is auto-checked as YES by default
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

  // Handle Password Submit
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both admin email and password.");
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
        toast.error("Authentication Failed", {
          description: data.error || "Invalid credentials or unauthorized administrator target.",
        });
        return;
      }

      toast.success("Administrator Authenticated", {
        description: `Welcome to Shivam Optics Command Center (${rememberMe ? "30-Day Session Active" : "Session Active"}).`,
      });

      // Immediate redirection
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Admin login network failure:", err);
      toast.error("Network error during admin authentication");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error("Please enter the administrator email address.");
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
        toast.error(data.error || "Failed to dispatch administrator OTP.");
        return;
      }

      setOtpStep("verify");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(45);
      toast.success("Security Code Dispatched", {
        description: `6-digit emergency OTP sent to ${email.trim().toLowerCase()}.`,
      });

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (err) {
      console.error("Admin send OTP error:", err);
      toast.error("Network error while dispatching security OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (overrideCode?: string) => {
    const fullCode = overrideCode || otpDigits.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
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
        toast.error("Verification Failed", {
          description: data.error || "Invalid or expired administrator OTP code.",
        });
        return;
      }

      toast.success("Administrator Verified via OTP", {
        description: `Access granted (${rememberMe ? "30-Day Session Active" : "Session Active"}).`,
      });

      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Admin OTP verification error:", err);
      toast.error("Network error verifying administrator OTP");
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
    <div className="min-h-screen bg-[#071B14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D2D23] via-[#071B14] to-[#040E0A] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-[#FAF7F2] select-none">
      <div className="max-w-md w-full space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-[#C5A059] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Storefront Atelier</span>
          </Link>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#C5A059] uppercase px-2 py-0.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20">
            SECURE TERMINAL
          </span>
        </div>

        {/* Executive Command Card */}
        <div className="bg-[#0A251C]/90 backdrop-blur-md rounded-3xl border border-[#C5A059]/30 p-7 sm:p-9 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle gold hairline glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-80" />

          {/* Crest & Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#071B14] border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#C5A059] shadow-inner mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
              SHIVAM OPTICS EXECUTIVE ATELIER
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Command Operating System
            </h1>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              Restricted workstation. Enter authorized credentials to manage laboratory queues, catalog inventory, and payments.
            </p>
          </div>

          {/* Mode Segmented Controller */}
          <div className="grid grid-cols-2 p-1 bg-[#071B14] border border-[#C5A059]/20 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                authMode === "password"
                  ? "bg-[#C5A059] text-[#0A251C] shadow-sm font-extrabold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                if (otpStep === "send") {
                  handleSendOtp();
                }
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                authMode === "otp"
                  ? "bg-[#C5A059] text-[#0A251C] shadow-sm font-extrabold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Emergency OTP
            </button>
          </div>

          {/* A. Password Form */}
          {authMode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Authorized Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    Administrator Email
                  </label>
                  <span className="text-[9px] font-mono uppercase text-[#C5A059] font-bold tracking-wider">
                    WHITELISTED
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shivamoptical999@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#071B14] border border-[#C5A059]/30 text-xs sm:text-sm text-white placeholder:text-stone-500 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-inner font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#071B14] border border-[#C5A059]/30 text-xs sm:text-sm text-white placeholder:text-stone-500 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#C5A059] transition p-0.5 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox (Pre-Checked as YES by Default) */}
              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#071B14] border-[#C5A059]/40 text-[#C5A059] focus:ring-[#C5A059] accent-[#C5A059] cursor-pointer"
                  />
                  <span className="text-xs text-stone-300 font-medium">
                    Remember this terminal for <strong className="text-white">30 days</strong>
                  </span>
                </label>
                <span className="text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/20">
                  AUTO-SECURE
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b268] text-[#0A251C] font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-[#C5A059]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A251C]" />
                    <span>Verifying Cryptographic Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Authenticate &amp; Enter Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* B. Emergency OTP Form */}
          {authMode === "otp" && (
            <div className="space-y-4">
              {otpStep === "send" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1.5">
                      Authorized Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#071B14] border border-[#C5A059]/30 text-xs sm:text-sm text-white placeholder:text-stone-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleSendOtp}
                    className="w-full py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b268] text-[#0A251C] font-extrabold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0A251C]" />
                        <span>Dispatching Admin OTP...</span>
                      </span>
                    ) : (
                      <span>Send 6-Digit Emergency Code</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-stone-300">
                      Enter the 6-digit emergency OTP dispatched to:
                    </p>
                    <p className="text-xs font-mono font-bold text-[#C5A059]">
                      {email}
                    </p>
                  </div>

                  {/* 6 Digit Input Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-3">
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
                        className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-[#071B14] border border-[#C5A059]/40 text-white shadow-inner focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30 outline-none transition-all"
                      />
                    ))}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#071B14] border-[#C5A059]/40 text-[#C5A059] focus:ring-[#C5A059] accent-[#C5A059] cursor-pointer"
                      />
                      <span className="text-xs text-stone-300 font-medium">
                        Remember for 30 days
                      </span>
                    </label>
                  </div>

                  {/* Verify Action Button */}
                  <button
                    type="button"
                    disabled={isLoading || otpDigits.join("").length !== 6}
                    onClick={() => handleVerifyOtp()}
                    className="w-full py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b268] text-[#0A251C] font-extrabold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0A251C]" />
                        <span>Verifying Security Code...</span>
                      </span>
                    ) : (
                      <span>Verify &amp; Enter Command Center</span>
                    )}
                  </button>

                  {/* Resend */}
                  <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-[#C5A059]/20">
                    <span>Didn&apos;t receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-stone-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="font-bold text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-[#C5A059]/20 flex items-start gap-2.5 text-[11px] text-stone-400">
            <ShieldAlert className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Authorized Personnel Only:</strong> All access attempts to this terminal are cryptographically authenticated and logged with IP timestamp.
            </p>
          </div>
        </div>

        {/* Domain Badge */}
        <div className="text-center text-[11px] text-stone-500 font-mono">
          <span>Target Host: </span>
          <span className="text-[#C5A059] font-bold">admin.shivamoptical.in</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071B14] flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" />
            <p className="text-xs text-stone-400 uppercase tracking-widest font-mono">
              Initializing Executive Terminal...
            </p>
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
