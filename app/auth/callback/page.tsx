"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function handleAuthVerification() {
      try {
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        if (errorParam) {
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(errorDesc || "The verification link is invalid or has expired.");
          return;
        }

        const code = searchParams.get("code");
        const returnUrl = searchParams.get("returnUrl") || "/account";

        if (code) {
          // PKCE code exchange flow
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("PKCE code exchange error:", error);
            if (!isMounted) return;
            setStatus("error");
            setErrorMessage(error.message || "Failed to exchange verification token.");
            return;
          }

          if (data?.session?.user && isMounted) {
            const user = data.session.user;
            const email = user.email || "";
            const name = user.user_metadata?.full_name || user.user_metadata?.name || "Shivam Patron";

            try {
              await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: user.id,
                  email,
                  name,
                }),
              });
            } catch (syncErr) {
              console.warn("Profile sync warning in callback:", syncErr);
            }

            loginWithEmail(email, {
              id: user.id,
              email,
              name,
              role: "customer",
            });

            setStatus("success");
            toast.success("Email Verified Successfully", {
              description: "Welcome to Shivam Opticals Atelier.",
            });

            setTimeout(() => {
              router.replace(returnUrl);
            }, 1200);
            return;
          }
        }

        // Implicit flow or existing session check
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && isMounted) {
          const user = sessionData.session.user;
          const email = user.email || "";
          const name = user.user_metadata?.full_name || user.user_metadata?.name || "Shivam Patron";

          loginWithEmail(email, {
            id: user.id,
            email,
            name,
            role: "customer",
          });

          setStatus("success");
          toast.success("Patron Session Verified", {
            description: "Redirecting to your atelier destination...",
          });

          setTimeout(() => {
            router.replace(returnUrl);
          }, 1200);
          return;
        }

        // Listen for next auth event (if hash parsing completes asynchronously)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "SIGNED_IN" && session?.user && isMounted) {
              const user = session.user;
              const email = user.email || "";
              const name = user.user_metadata?.full_name || user.user_metadata?.name || "Shivam Patron";

              loginWithEmail(email, {
                id: user.id,
                email,
                name,
                role: "customer",
              });

              setStatus("success");
              toast.success("Email Confirmed", {
                description: "Welcome to Shivam Opticals.",
              });

              setTimeout(() => {
                router.replace(returnUrl);
              }, 1200);
            }
          }
        );

        // Fallback timeout in case no session event arrives within 6 seconds
        const timeout = setTimeout(() => {
          if (isMounted && status === "loading") {
            setStatus("error");
            setErrorMessage("Session verification timed out. Please sign in with your email or mobile OTP.");
          }
        }, 6000);

        return () => {
          authListener?.subscription?.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err: any) {
        console.error("Auth callback unexpected error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err?.message || "An unexpected error occurred during verification.");
        }
      }
    }

    handleAuthVerification();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, loginWithEmail, status]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-16 px-4 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white border border-[#E8DEC8] rounded-3xl p-8 shadow-sm text-center space-y-6">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#0A251C]">
              <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block mb-1">
                AUTHENTICATING PATRON TOKEN
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0A251C]">
                Confirming Your Email...
              </h2>
              <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
                Validating your cryptographic verification link and initializing your Shivam Opticals vault session.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#16803E]/10 border border-[#16803E]/30 flex items-center justify-center mx-auto text-[#16803E]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#16803E] block mb-1">
                VERIFICATION COMPLETE
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0A251C]">
                Authentication Verified
              </h2>
              <p className="text-xs text-stone-500 mt-2">
                Your patron privileges are active. Transferring you to your destination now...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-600 block mb-1">
                VERIFICATION FAILED
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0A251C]">
                Link Expired or Invalid
              </h2>
              <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
                {errorMessage || "This confirmation link has already been used or has expired."}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 rounded-xl bg-[#0A251C] hover:bg-black text-[#C5A059] font-bold text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="pt-4 border-t border-[#E8DEC8]/60 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>256-Bit SSL Encrypted Session • Mayur Vihar Atelier</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#C5A059] mx-auto" />
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">
              Loading Atelier Verification...
            </p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
