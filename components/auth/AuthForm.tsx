"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Loader2,
  Lock,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { resolvePatronName, isValidEmail, isValidIndianPhone } from "@/lib/patronUtils";
import { toast } from "sonner";

interface AuthFormProps {
  onSuccess?: () => void;
  returnUrl?: string | null;
  mode?: "modal" | "page";
  initialType?: "signin" | "signup";
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onSuccess,
  returnUrl,
  mode = "modal",
  initialType = "signin",
}) => {
  const router = useRouter();
  const { loginWithPhone, loginWithEmail, authReturnUrl } = useAuth();
  const targetReturnUrl = returnUrl || authReturnUrl;

  const [authType, setAuthType] = useState<"signin" | "signup">(initialType);

  // Primary Method: 'phone' by default; switchable to 'email'
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "verify">("input");

  // Form inputs
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // OTP Verification state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedTarget, setVerifiedTarget] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for code resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "verify" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first OTP input when switching to verify step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Send Verification Code (Phone via SMS or Email via Supabase)
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (method === "phone") {
      const cleanPhone = phone.trim();
      if (!isValidIndianPhone(cleanPhone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number");
        return;
      }

      setIsSendingCode(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error || "Unable to dispatch verification SMS");
          return;
        }

        setVerifiedTarget(cleanPhone);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(data.cooldown || 30);
        toast.success("Verification code sent via SMS", {
          description: "Please check your messages for the 6-digit code.",
        });
      } catch (err) {
        console.warn("SMS OTP dispatch error:", err);
        toast.error("Network error while requesting verification code");
      } finally {
        setIsSendingCode(false);
      }
    } else {
      // Email authentication flow
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const inferredName = resolvePatronName(name, { email: cleanEmail });

      setIsSendingCode(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: inferredName,
            },
          },
        });

        if (error) {
          const isSmtpFailure =
            error.message?.toLowerCase().includes("confirmation email") ||
            error.message?.toLowerCase().includes("smtp") ||
            (error as any).status === 500;

          toast.error("Unable to dispatch verification email", {
            description: isSmtpFailure
              ? "Supabase SMTP connection failed. Please verify your SMTP host, port, and App Password in Supabase Settings, or sign in with Mobile OTP."
              : error.message || "Please check your email address and try again.",
          });
          return;
        }

        setVerifiedTarget(cleanEmail);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(30);
        toast.success("Verification code sent to your email", {
          description: `Sent to ${cleanEmail}. Valid for 10 minutes.`,
        });
      } catch (err: any) {
        console.warn("Supabase Email OTP dispatch error:", err);
        toast.error("Network error while requesting email code");
      } finally {
        setIsSendingCode(false);
      }
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (overrideCode?: string) => {
    const fullOtp = overrideCode || otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifyingCode(true);

    if (method === "phone") {
      try {
        const inferredName = resolvePatronName(name, { phone: verifiedTarget || phone });

        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: verifiedTarget || phone,
            otp: fullOtp,
            name: inferredName,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error || "Invalid verification code. Please check and try again.");
          return;
        }

        const patronProfile = data.user || {
          name: inferredName,
          phone: verifiedTarget || phone,
          role: "customer",
        };

        loginWithPhone(verifiedTarget || phone, patronProfile, data.orders || []);

        if (onSuccess) {
          onSuccess();
        } else if (targetReturnUrl) {
          router.push(targetReturnUrl);
        }
      } catch (err) {
        console.warn("Phone OTP verify error:", err);
        toast.error("Network error during code verification");
      } finally {
        setIsVerifyingCode(false);
      }
    } else {
      // Email Verification flow via Supabase
      try {
        const cleanEmail = (verifiedTarget || email).trim().toLowerCase();
        const inferredName = resolvePatronName(name, { email: cleanEmail });

        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: fullOtp.trim(),
          type: "email",
        });

        if (error || !data?.user) {
          toast.error("Invalid or expired verification code", {
            description: error?.message || "Please check the code received in your email.",
          });
          return;
        }

        // Synchronize patron profile to PostgreSQL store
        try {
          await fetch("/api/user/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: data.user.id,
              name: inferredName,
              email: cleanEmail,
            }),
          });
        } catch (syncErr) {
          console.warn("Patron profile background sync warning:", syncErr);
        }

        loginWithEmail(cleanEmail, {
          id: data.user.id,
          email: cleanEmail,
          name: inferredName,
          role: "customer",
        });

        if (onSuccess) {
          onSuccess();
        } else if (targetReturnUrl) {
          router.push(targetReturnUrl);
        }
      } catch (err: any) {
        console.warn("Email OTP verify error:", err);
        toast.error("Network error verifying email code");
      } finally {
        setIsVerifyingCode(false);
      }
    }
  };

  // OTP single-box auto-advance & paste handler
  const handleDigitChange = (index: number, val: string) => {
    // Handle pasting multi-digit code
    if (val.length > 1) {
      const pastedDigits = val.replace(/\D/g, "").slice(0, 6);
      if (pastedDigits.length > 0) {
        const newArr = [...otp];
        for (let i = 0; i < 6; i++) {
          newArr[i] = pastedDigits[i] || "";
        }
        setOtp(newArr);
        const nextIdx = Math.min(pastedDigits.length, 5);
        inputRefs.current[nextIdx]?.focus();

        if (pastedDigits.length === 6) {
          handleVerifyOtp(pastedDigits);
        }
        return;
      }
    }

    const clean = val.replace(/\D/g, "").slice(-1);
    const newArr = [...otp];
    newArr[index] = clean;
    setOtp(newArr);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && clean) {
      const candidate = newArr.join("");
      if (candidate.length === 6) {
        handleVerifyOtp(candidate);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verification View
  if (step === "verify") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setStep("input")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#0A251C] transition cursor-pointer mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Change {method === "phone" ? "Mobile Number" : "Email Address"}</span>
          </button>

          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
            TWO-STEP VERIFICATION
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0A251C]">
            Verify Your Identity
          </h2>
          <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
            {method === "phone" ? (
              <>
                Enter the 6-digit code sent via SMS to{" "}
                <span className="font-semibold text-[#0A251C]">{verifiedTarget || phone}</span>
              </>
            ) : (
              <>
                Enter the 6-digit verification code sent to{" "}
                <span className="font-semibold text-[#0A251C]">{verifiedTarget || email}</span>
              </>
            )}
          </p>
        </div>

        {/* 6 Discrete Digit Boxes */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-4">
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
              className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-white border border-[#E8DCCF] text-[#0A251C] shadow-2xs focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={isVerifyingCode || otp.join("").length !== 6}
          className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
        >
          {isVerifyingCode ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
              <span>Verifying Patron Identity...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>Verify &amp; Access Atelier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </button>

        {/* Resend Code Section */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-[#E8DCCF]/60 px-1">
          <span>Didn&apos;t receive the code?</span>
          {resendTimer > 0 ? (
            <span className="font-mono text-stone-400">Resend in {resendTimer}s</span>
          ) : (
            <button
              type="button"
              onClick={() => handleSendCode()}
              disabled={isSendingCode}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] transition flex items-center gap-1 cursor-pointer underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend Code</span>
            </button>
          )}
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Encrypted 256-bit patron session • Mayur Vihar Atelier</span>
        </div>
      </div>
    );
  }

  // Step 1: Input View (Phone Primary + Email Option)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">
          {authType === "signup" ? "NEW PATRON PRIVILEGE" : "PATRON ATELIER PRIVILEGE"}
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
          {authType === "signup"
            ? method === "phone"
              ? "Register with Mobile"
              : "Register with Email"
            : method === "phone"
            ? "Sign in with Mobile"
            : "Sign in with Email"}
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
          {authType === "signup"
            ? method === "phone"
              ? "Join Shivam Optical Atelier with your mobile number to receive a secure SMS verification code"
              : "Join Shivam Optical Atelier with your email address for instant digital Rx vault access"
            : method === "phone"
            ? "Enter your mobile number to receive a secure SMS verification code"
            : "Enter your registered email address to receive an instant verification code"}
        </p>
      </div>

      <form onSubmit={handleSendCode} className="space-y-4">
        {/* Full Name Field (Optional for both Phone and Email) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
            Full Name <span className="text-stone-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1 pl-1">
            Optional: If left blank, your identity will be curated automatically.
          </p>
        </div>

        {/* Primary Input based on Method */}
        {method === "phone" ? (
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
              Mobile Number <span className="text-[#0A251C]">*</span>
            </label>
            <div className="flex rounded-xl bg-white border border-[#E8DCCF] overflow-hidden focus-within:border-[#C5A059] focus-within:ring-1 focus-within:ring-[#C5A059] transition shadow-2xs">
              <div className="px-3 py-2.5 bg-[#FAF7F2] border-r border-[#E8DCCF] text-xs font-semibold text-[#0A251C] flex items-center gap-1.5 select-none shrink-0">
                <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none bg-transparent"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1 pl-1">
              Instant 6-digit verification code dispatched via SMS.
            </p>
          </div>
        ) : (
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
              Email Address <span className="text-[#0A251C]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1 pl-1">
              Secure authentication code sent to your email inbox.
            </p>
          </div>
        )}

        {/* Primary Action Button: Send Verification Code */}
        <button
          type="submit"
          disabled={isSendingCode}
          className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] mt-2"
        >
          {isSendingCode ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
              <span>Sending Verification Code...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>{authType === "signup" ? "Create Account & Receive Code" : "Send Verification Code"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </form>

      {/* Alternative Method Switcher */}
      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8DCCF]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-[#FCFAF7] px-3 text-stone-400">Or continue with</span>
        </div>
      </div>

      <div>
        {method === "phone" ? (
          <button
            type="button"
            onClick={() => {
              setMethod("email");
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8DCCF] bg-white hover:bg-[#FAF7F2] text-[#0A251C] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C5A059]"
          >
            <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Continue with Email</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMethod("phone");
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8DCCF] bg-white hover:bg-[#FAF7F2] text-[#0A251C] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C5A059]"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Continue with Mobile Number</span>
          </button>
        )}
      </div>

      {/* Privileges Strip */}
      <div className="pt-2 border-t border-[#E8DCCF]/60">
        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-medium text-stone-500">
          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF]/60">
            Digital Rx Vault Access
          </div>
          <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DCCF]/60">
            Real-time Lab Surfacing
          </div>
        </div>
      </div>

      {/* Sign In <-> Sign Up Toggle */}
      <div className="text-center pt-1 border-t border-[#E8DCCF]/40">
        {authType === "signin" ? (
          <p className="text-xs text-stone-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthType("signup");
                if (mode === "page" && !returnUrl) {
                  router.push("/signup");
                }
              }}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] underline transition cursor-pointer"
            >
              Create Patron Account
            </button>
          </p>
        ) : (
          <p className="text-xs text-stone-600">
            Already registered?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthType("signin");
                if (mode === "page" && !returnUrl) {
                  router.push("/login");
                }
              }}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] underline transition cursor-pointer"
            >
              Sign In to Atelier
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
