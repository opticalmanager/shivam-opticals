"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "/account";
  const { isLoggedIn } = useAuth();

  // Route Safeguard: If already authenticated, redirect to destination
  useEffect(() => {
    if (isLoggedIn) {
      router.replace(returnUrl);
    }
  }, [isLoggedIn, returnUrl, router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#0A251C] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DEC8] p-6 sm:p-8 shadow-sm">
          <AuthForm mode="page" initialType="signin" returnUrl={returnUrl} />
        </div>

        {/* Security Assurance */}
        <div className="text-center space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Secure account authentication • Shivam Opticals</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#C5A059] mx-auto" />
            <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              Loading Sign In...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
