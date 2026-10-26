"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const { openAppointmentModal } = useAuth();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#EAE4DC] text-[#1A1816] border-t border-[#E8E2D9] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 pb-12 border-b border-[#E8E2D9]/70">
          {/* Col 1: Eyewear Categories */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Eyewear</h5>
            <ul className="space-y-2 text-xs text-[#716B64]">
              <li>
                <Link href="/products?type=eyeglasses" className="hover:text-[#1A1816] transition">
                  Eyeglasses
                </Link>
              </li>
              <li>
                <Link href="/products?type=sunglasses" className="hover:text-[#1A1816] transition">
                  Sunglasses
                </Link>
              </li>
              <li>
                <Link href="/products?category=Screen+Glasses" className="hover:text-[#1A1816] transition">
                  Computer Glasses
                </Link>
              </li>
              <li>
                <Link href="/products?shape=Aviator" className="hover:text-[#1A1816] transition">
                  Titanium Collection
                </Link>
              </li>
              <li>
                <Link href="/products?type=sunglasses" className="hover:text-[#1A1816] transition">
                  Polarized Shades
                </Link>
              </li>
              <li>
                <Link href="/products?shape=Round" className="hover:text-[#1A1816] transition">
                  Rimless Minimalists
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Customer Care */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Assistance</h5>
            <ul className="space-y-2 text-xs text-[#716B64]">
              <li>
                <Link href="/account" className="hover:text-[#1A1816] transition">
                  My Account &amp; Orders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#1A1816] transition">
                  Atelier Store &amp; Contact
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openAppointmentModal}
                  className="hover:text-[#1A1816] transition text-left cursor-pointer"
                >
                  Book Eye Test Consultation
                </button>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#1A1816] transition">
                  Atelier Heritage &amp; Optical Lab
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#1A1816] transition">
                  Clinical Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Store Address & Contact */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Shivam Optical</h5>
            <p className="text-xs text-[#716B64] leading-relaxed">
              SAMACHAR market, Shop No-1, Kanishka Complex, Mayur Vihar Phase I, extention, Mayur Vihar, Delhi, 110091.
              <br />
              Computerized eye testing, branded frames, and precision power lenses.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-[#2D2926]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1A1816]">Call / WhatsApp:</span>
                <a href="tel:09779990207" className="text-xs text-[#716B64] hover:text-[#C5A059] font-bold">
                  097799 90207
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#716B64]">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1A1816]">Hours:</span>
                <span>Mon – Sun: 10:30 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#716B64] gap-4 text-center sm:text-left">
          <p>© 2026 SHIVAM OPTICAL. ALL RIGHTS RESERVED. MAYUR VIHAR PHASE I, DELHI - 110091.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
            <span>100% SECURE CHECKOUT</span>
            <span className="hidden sm:inline">•</span>
            <span>UPI / CARDS / NETBANKING</span>
            <span className="hidden sm:inline">•</span>
            <span>PAN-INDIA DISPATCH</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
