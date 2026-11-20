"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Send } from "lucide-react";

const OFFICIAL_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919779990207";

export function WhatsAppStickyButton() {
  const pathname = usePathname();
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show polite concierge greeting after a short delay if not dismissed this session
    try {
      const dismissed = sessionStorage.getItem("shivam_optics_wa_card_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsCardVisible(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case sessionStorage is restricted in sandbox/incognito
    }
  }, []);

  const handleDismissCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsCardVisible(false);
    try {
      sessionStorage.setItem("shivam_optics_wa_card_dismissed", "1");
    } catch {
      // Ignore storage errors
    }
  };

  // Compose dynamic contextual prompt tailored for Shivam Optical
  const { message, url } = useMemo(() => {
    let msg =
      "Hello Shivam Optical, I would like to consult with an optical master regarding frame fittings, computerized eye testing, and clinical lens packages at your Mayur Vihar store.";

    if (typeof window !== "undefined" && pathname) {
      if (pathname.startsWith("/product/")) {
        // Strip site suffix if present in page title
        const pageTitle =
          document.title?.split("|")[0]?.trim() || "this eyewear frame";
        msg = `Hello Shivam Optical, I am interested in inquiring about ${pageTitle}. Could you please assist me with frame availability, pricing, and prescription lens options?`;
      } else if (pathname === "/cart" || pathname === "/checkout") {
        msg =
          "Hello Shivam Optical, I am reviewing my eyewear order and have a question regarding checkout, power prescription verification, or delivery timeline.";
      } else if (pathname === "/contact" || pathname === "/about") {
        msg =
          "Hello Shivam Optical, I would like to schedule a visit for computerized eye testing and personalized frame styling at your Mayur Vihar Phase 1 atelier.";
      }
    }

    const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      msg
    )}`;

    return { message: msg, url: waUrl };
  }, [pathname]);

  if (!mounted) return null;

  return (
    <aside
      aria-label="WhatsApp Optical Concierge"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Floating Greeting Card (Desktop & Tablet) */}
      {isCardVisible && (
        <div
          role="dialog"
          aria-label="Shivam Optical Concierge Assistance"
          className="relative mb-3 w-[290px] sm:w-[320px] bg-white rounded-2xl border border-[#E8DEC8] p-4 shadow-[0_16px_40px_rgba(26,24,22,0.14)] animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all"
        >
          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismissCard}
            aria-label="Close concierge greeting"
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-[#716B64] hover:text-[#1A1816] hover:bg-[#FAF3EB] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Card Header with Status */}
          <div className="flex items-center gap-2.5 mb-2 pr-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <h4 className="text-[12px] font-bold text-[#0A251C] tracking-wide uppercase">
                Shivam Optical Concierge
              </h4>
              <p className="text-[10px] text-[#716B64] leading-tight">
                Mayur Vihar Atelier • Online
              </p>
            </div>
          </div>

          {/* Card Body */}
          <p className="text-[12px] text-[#2D2926] leading-relaxed mb-3">
            Need guidance with frame sizing, certified Zeiss lens packages, or
            computerized eye tests? Chat with our Optical Master directly.
          </p>

          {/* Direct WhatsApp Action Link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white py-2 px-3.5 rounded-xl font-medium text-[12px] shadow-sm transition-all duration-200 group/btn"
          >
            <span>Start WhatsApp Chat</span>
            <Send className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>

          {/* Card Arrow Tip pointing down to the button */}
          <div className="absolute -bottom-2 right-6 sm:right-7 w-4 h-4 bg-white border-r border-b border-[#E8DEC8] transform rotate-45" />
        </div>
      )}

      {/* Primary Sticky WhatsApp Button */}
      <div className="relative group">
        {/* Subtle Ambient Pulse Ring */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none -z-10"
          aria-hidden="true"
        />

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Shivam Optical on WhatsApp (+91 97799 90207)"
          title="Chat with Shivam Optical on WhatsApp"
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.65)] hover:scale-108 active:scale-95 transition-all duration-300 ring-2 ring-white/90 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 overflow-hidden"
        >
          {/* High-Fidelity Official WhatsApp Icon */}
          <Image
            src="/images/whatsapp-icon.png"
            alt="WhatsApp Chat"
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-full"
            priority
          />

          {/* Online Active Badge Indicator */}
          <span
            className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs"
            title="Optical Master Online"
            aria-hidden="true"
          />
        </a>

        {/* Hover Tooltip (when greeting card is closed) */}
        {!isCardVisible && (
          <div
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg bg-[#1A1816] text-[#FCFAF7] text-[11px] font-medium whitespace-nowrap shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 hidden sm:block"
          >
            Chat with Shivam Optical
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#1A1816] transform rotate-45" />
          </div>
        )}
      </div>
    </aside>
  );
}
