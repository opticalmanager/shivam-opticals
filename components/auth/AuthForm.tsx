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
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { isValidEmail, isValidIndianPhone } from "@/lib/patronUtils";
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

  // Primary toggle: Sign In vs Sign Up
  const [authType, setAuthType] = useState<"signin" | "signup">(initialType);

  // In Sign In: Password (default) vs OTP
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");

  // In Sign Up: Email vs Mobile number
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");

  // In Sign In with OTP: Email vs Mobile number
  const [otpLoginMethod, setOtpLoginMethod] = useState<"email" | "phone">("email");

  // Flow step: 'input' (details) vs 'verify' (OTP verification)
  const [step, setStep] = useState<"input" | "verify">("input");

  // Input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifiedTarget, setVerifiedTarget] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "verify" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Auto-focus first OTP digit when moving to verification
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Switch tabs cleanly
  const handleTabSwitch = (newType: "signin" | "signup") => {
    setAuthType(newType);
    setStep("input");
    setPassword("");
    setConfirmPassword("");
    setOtp(["", "", "", "", "", ""]);
    if (mode === "page") {
      const targetPath = newType === "signup" ? "/signup" : "/login";
      if (window.location.pathname !== targetPath) {
        router.push(`${targetPath}${targetReturnUrl ? `?returnUrl=${encodeURIComponent(targetReturnUrl)}` : ""}`);
      }
    }
  };

  // ----------------------------------------------------
  // Handler 1: Sign In with Password (Primary Login Flow)
  // ----------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPwd = password.trim();

    if (!cleanId) {
      toast.error("Please enter your email or mobile number.");
      return;
    }
    if (!cleanPwd) {
      toast.error("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPwd,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Incorrect login details. Please try again.");
        return;
      }

      const userData = data.user;
      if (cleanId.includes("@")) {
        loginWithEmail(cleanId, userData);
      } else {
        loginWithPhone(cleanId, userData);
      }

      toast.success("Welcome back!", {
        description: "You have logged in successfully.",
      });

      if (onSuccess) {
        onSuccess();
      } else if (targetReturnUrl) {
        router.push(targetReturnUrl);
      }
    } catch (err) {
      console.error("Login failure:", err);
      toast.error("Network error during login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Handler 2: Sign Up Step 1 -> Send Verification OTP
  // ----------------------------------------------------
  const handleSignupInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPwd = password.trim();
    const cleanConfirmPwd = confirmPassword.trim();

    if (!cleanName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (cleanPwd.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (cleanPwd !== cleanConfirmPwd) {
      toast.error("Passwords do not match. Please re-check.");
      return;
    }

    if (signupMethod === "email") {
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(targetReturnUrl || "/account")}`
            : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPwd,
          options: {
            data: { full_name: cleanName },
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message?.toLowerCase().includes("already registered")) {
            toast.error("An account with this email already exists. Please log in.");
            setIsSubmitting(false);
            return;
          }

          const isSmtpErr =
            error.message?.toLowerCase().includes("smtp") ||
            error.message?.toLowerCase().includes("confirmation email") ||
            (error as any).status === 500;

          if (isSmtpErr) {
            toast.error("Email service temporarily busy. Please sign up with Mobile Number for instant SMS code.");
            setIsSubmitting(false);
            return;
          }

          toast.error(error.message || "Unable to send verification code to this email.");
          setIsSubmitting(false);
          return;
        }

        setVerifiedTarget(cleanEmail);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(45);
        toast.success("Verification code sent!", {
          description: `We sent a 6-digit code to ${cleanEmail}.`,
        });
      } catch (err) {
        console.warn("Sign up initiate error:", err);
        toast.error("Network error while creating account.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Mobile Number Sign Up
      const cleanPhone = phone.trim();
      if (!isValidIndianPhone(cleanPhone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error || "Unable to send verification SMS.");
          return;
        }

        setVerifiedTarget(cleanPhone);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(data.cooldown || 30);
        toast.success("Verification code sent via SMS!", {
          description: `Please enter the 6-digit code sent to ${cleanPhone}.`,
        });
      } catch (err) {
        console.warn("Phone OTP dispatch error:", err);
        toast.error("Network error while requesting verification code.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ----------------------------------------------------
  // Handler 3: Sign In with OTP -> Send Code
  // ----------------------------------------------------
  const handleLoginWithOtpInitiate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpLoginMethod === "phone") {
      const cleanPhone = phone.trim();
      if (!isValidIndianPhone(cleanPhone)) {
        toast.error("Please enter a valid 10-digit mobile number.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error || "Unable to send SMS code.");
          return;
        }

        setVerifiedTarget(cleanPhone);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(data.cooldown || 30);
        toast.success("Verification code sent via SMS.");
      } catch {
        toast.error("Network error while sending verification SMS.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(targetReturnUrl || "/account")}`
            : undefined;

        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          toast.error(error.message || "Unable to send email verification code.");
          return;
        }

        setVerifiedTarget(cleanEmail);
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(45);
        toast.success("Verification code sent to your email.");
      } catch {
        toast.error("Network error while sending email code.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ----------------------------------------------------
  // Handler 4: Verify OTP (Finishes Signup or OTP Login)
  // ----------------------------------------------------
  const handleVerifyOtp = async (overrideCode?: string) => {
    const fullOtp = overrideCode || otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);

    const isPhoneTarget = !verifiedTarget.includes("@");

    if (isPhoneTarget) {
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: verifiedTarget,
            otp: fullOtp,
            name: name.trim() || undefined,
            password: authType === "signup" ? password.trim() : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error || "Invalid verification code. Please check and try again.");
          return;
        }

        const userProfile = data.user || {
          name: name.trim() || "Customer",
          phone: verifiedTarget,
          role: "customer",
        };

        loginWithPhone(verifiedTarget, userProfile, data.orders || []);

        toast.success(authType === "signup" ? "Account created successfully!" : "Logged in successfully!");

        if (onSuccess) {
          onSuccess();
        } else if (targetReturnUrl) {
          router.push(targetReturnUrl);
        }
      } catch {
        toast.error("Network error verifying code.");
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Email Verification flow
      try {
        const cleanEmail = verifiedTarget.trim().toLowerCase();

        let { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: fullOtp.trim(),
          type: authType === "signup" ? "signup" : "email",
        });

        // Fallback check between 'email' and 'signup' token types
        if (error && (error.message?.toLowerCase().includes("invalid") || error.message?.toLowerCase().includes("expired"))) {
          const fallbackRes = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: fullOtp.trim(),
            type: authType === "signup" ? "email" : "signup",
          });
          if (!fallbackRes.error && fallbackRes.data?.user) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (error || !data?.user) {
          toast.error("Invalid or expired verification code. Please check and try again.");
          return;
        }

        // Synchronize name & password hash to public.profiles
        try {
          await fetch("/api/user/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: data.user.id,
              name: name.trim() || data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
              email: cleanEmail,
              password: authType === "signup" ? password.trim() : undefined,
            }),
          });
        } catch (syncErr) {
          console.warn("Profile sync error:", syncErr);
        }

        loginWithEmail(cleanEmail, {
          id: data.user.id,
          email: cleanEmail,
          name: name.trim() || data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
          role: "customer",
        });

        toast.success(authType === "signup" ? "Account created successfully!" : "Logged in successfully!");

        if (onSuccess) {
          onSuccess();
        } else if (targetReturnUrl) {
          router.push(targetReturnUrl);
        }
      } catch {
        toast.error("Network error verifying email code.");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  // OTP single-box auto-advance & paste handler
  const handleDigitChange = (index: number, val: string) => {
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

  // ====================================================
  // VIEW: Step 2 - Verify OTP Screen
  // ====================================================
  if (step === "verify") {
    const isPhone = !verifiedTarget.includes("@");

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setStep("input")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#0A251C] transition cursor-pointer mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Change Details</span>
          </button>

          <h2 className="text-2xl font-serif font-bold text-[#0A251C]">
            {isPhone ? "Verify Mobile Number" : "Verify Email Address"}
          </h2>
          <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
            Enter the 6-digit verification code sent to{" "}
            <span className="font-semibold text-[#0A251C]">{verifiedTarget}</span>
          </p>
        </div>

        {/* 6 Discrete Digit Boxes */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 my-3">
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
              className="w-9 h-11 sm:w-12 sm:h-14 text-center text-base sm:text-xl font-bold font-mono rounded-lg sm:rounded-xl bg-white border border-[#E8DCCF] text-[#0A251C] shadow-2xs focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={isVerifying || otp.join("").length !== 6}
          className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
              <span>Verifying Code...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>{authType === "signup" ? "Verify & Complete Sign Up" : "Verify & Log In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </button>

        {/* Resend Code Section */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-[#E8DCCF]/60 px-1">
          <span>Didn&apos;t receive code?</span>
          {resendTimer > 0 ? (
            <span className="font-mono text-stone-400">Resend in {resendTimer}s</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (authType === "signup") {
                  handleSignupInitiate({ preventDefault: () => {} } as any);
                } else {
                  handleLoginWithOtpInitiate({ preventDefault: () => {} } as any);
                }
              }}
              disabled={isSubmitting}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] transition flex items-center gap-1 cursor-pointer underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend Code</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ====================================================
  // VIEW: Step 1 - Form Inputs
  // ====================================================
  return (
    <div className="space-y-6">
      {/* Top Segmented Tabs: Log In vs Sign Up */}
      <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] border border-[#E8DEC8] rounded-2xl">
        <button
          type="button"
          onClick={() => handleTabSwitch("signin")}
          className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            authType === "signin"
              ? "bg-[#0A251C] text-[#C5A059] shadow-xs"
              : "text-stone-500 hover:text-[#0A251C]"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch("signup")}
          className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            authType === "signup"
              ? "bg-[#0A251C] text-[#C5A059] shadow-xs"
              : "text-stone-500 hover:text-[#0A251C]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A251C]">
          {authType === "signup"
            ? "Create an Account"
            : loginMode === "password"
            ? "Welcome Back"
            : "Log In with OTP"}
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
          {authType === "signup"
            ? "Fill in your details below to create your account."
            : loginMode === "password"
            ? "Enter your email or mobile number and password to log in."
            : "We'll send a 6-digit verification code to log you in."}
        </p>
      </div>

      {/* ====================================================
          SIGN UP FORM (Name + Email/Phone + Pass + Confirm Pass)
          ==================================================== */}
      {authType === "signup" ? (
        <form onSubmit={handleSignupInitiate} className="space-y-4">
          {/* Method Selector: Email vs Phone */}
          <div className="flex items-center gap-2 p-1 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSignupMethod("email")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                signupMethod === "email"
                  ? "bg-white text-[#0A251C] shadow-2xs font-bold"
                  : "text-stone-500 hover:text-[#0A251C]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setSignupMethod("phone")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                signupMethod === "phone"
                  ? "bg-white text-[#0A251C] shadow-2xs font-bold"
                  : "text-stone-500 hover:text-[#0A251C]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Number</span>
            </button>
          </div>

          {/* Full Name Field */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
            </div>
          </div>

          {/* Identifier Field: Email or Mobile */}
          {signupMethod === "email" ? (
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Mobile Number <span className="text-red-500">*</span>
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
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Create Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#0A251C] transition cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#0A251C] transition cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Sending Verification Code...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Continue to Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </form>
      ) : loginMode === "password" ? (
        /* ====================================================
           SIGN IN FORM - PASSWORD MODE (PRIMARY)
           ==================================================== */
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {/* ID Field (Email or Mobile) */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Email or Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter email or 10-digit mobile"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700">
                Password <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#0A251C] transition cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0A251C] focus:ring-[#C5A059] border-stone-300 accent-[#0A251C]"
              />
              <span className="text-xs text-stone-600">Remember me</span>
            </label>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Logging In...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Log In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8DCCF]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#FCFAF7] px-3 text-stone-400">or</span>
            </div>
          </div>

          {/* Alternative: Log in with OTP Button */}
          <button
            type="button"
            onClick={() => {
              setLoginMode("otp");
              setPassword("");
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8DCCF] bg-white hover:bg-[#FAF7F2] text-[#0A251C] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C5A059]"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Log in with OTP instead</span>
          </button>
        </form>
      ) : (
        /* ====================================================
           SIGN IN FORM - OTP MODE
           ==================================================== */
        <form onSubmit={handleLoginWithOtpInitiate} className="space-y-4">
          {/* Method Selector: Email vs Phone */}
          <div className="flex items-center gap-2 p-1 bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setOtpLoginMethod("email")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                otpLoginMethod === "email"
                  ? "bg-white text-[#0A251C] shadow-2xs font-bold"
                  : "text-stone-500 hover:text-[#0A251C]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setOtpLoginMethod("phone")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                otpLoginMethod === "phone"
                  ? "bg-white text-[#0A251C] shadow-2xs font-bold"
                  : "text-stone-500 hover:text-[#0A251C]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Number</span>
            </button>
          </div>

          {/* Input field */}
          {otpLoginMethod === "email" ? (
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DCCF] text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-2xs"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl bg-white border border-[#E8DCCF] overflow-hidden focus-within:border-[#C5A059] focus-within:ring-1 focus-within:ring-[#C5A059] transition shadow-2xs">
                <div className="px-3 py-2.5 bg-[#FAF7F2] border-r border-[#E8DCCF] text-xs font-semibold text-[#0A251C] flex items-center gap-1.5 select-none shrink-0">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#0A251C] placeholder:text-stone-400 outline-none bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Send OTP Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Sending Code...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Send Verification Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8DCCF]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#FCFAF7] px-3 text-stone-400">or</span>
            </div>
          </div>

          {/* Switch back to Password Login */}
          <button
            type="button"
            onClick={() => setLoginMode("password")}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8DCCF] bg-white hover:bg-[#FAF7F2] text-[#0A251C] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C5A059]"
          >
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Log in with Password instead</span>
          </button>
        </form>
      )}

      {/* Footer Switcher between Sign In and Sign Up */}
      <div className="text-center pt-2 border-t border-[#E8DCCF]/60">
        {authType === "signin" ? (
          <p className="text-xs text-stone-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => handleTabSwitch("signup")}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] underline transition cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        ) : (
          <p className="text-xs text-stone-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => handleTabSwitch("signin")}
              className="font-bold text-[#0A251C] hover:text-[#C5A059] underline transition cursor-pointer"
            >
              Log In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
