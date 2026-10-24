import React from "react";
import Link from "next/link";
import { Glasses, ArrowRight, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#FCFAF7] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        {/* Atelier Icon */}
        <div className="w-16 h-16 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Glasses className="w-8 h-8 text-[#C5A059]" />
        </div>

        {/* Header */}
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C5A059] mb-2">
          Frame Not Found
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1816] font-normal mb-3">
          Atelier Archive Unavailable
        </h1>
        <p className="text-xs sm:text-sm text-[#716B64] leading-relaxed mb-8">
          The requested designer frame or bespoke edition is currently unavailable in our active atelier catalog. Explore our collection or return home.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A251C] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Catalog</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-[#FAF3EB] text-[#1A1816] border border-[#E8DEC8] text-xs font-semibold uppercase tracking-widest rounded-lg transition-colors"
          >
            <Home className="w-4 h-4 text-[#716B64]" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
