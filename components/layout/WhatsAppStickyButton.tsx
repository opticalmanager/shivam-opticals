"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

const OFFICIAL_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919779990207";

export function WhatsAppStickyButton() {
  const pathname = usePathname();

  // Dynamic contextual prompt tailored for Shivam Optical
  const url = useMemo(() => {
    let msg =
      "Hello Shivam Optical, I would like to consult with an optical master regarding frame fittings, computerized eye testing, and clinical lens packages at your Mayur Vihar store.";

    if (typeof window !== "undefined" && pathname) {
      if (pathname.startsWith("/product/")) {
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

    return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      msg
    )}`;
  }, [pathname]);

  return (
    <aside
      aria-label="WhatsApp Contact"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto select-none"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Shivam Optical on WhatsApp (+91 97799 90207)"
        title="Chat with Shivam Optical on WhatsApp"
        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white shadow-[0_4px_16px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_24px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 sm:w-9 sm:h-9 fill-current"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </aside>
  );
}
