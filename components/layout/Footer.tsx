"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const { openAppointmentModal } = useAuth();
  const [email, setEmail] = useState("");

  if (pathname?.startsWith("/admin")) return null;

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed to Exclusive Privileges!", {
      description: `Updates will be sent to ${email}`,
    });
    setEmail("");
  };

  return (
    <footer className="bg-[#EAE4DC] text-[#1A1816] border-t border-[#E8E2D9] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E8E2D9]/70">
          {/* Col 1: Eyewear Categories */}
          <div className="lg:col-span-2 space-y-3">
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
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Assistance</h5>
            <ul className="space-y-2 text-xs text-[#716B64]">
              <li>
                <Link href="/account" className="hover:text-[#1A1816] transition">
                  Patron Account & Orders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#1A1816] transition">
                  Atelier Store & Contact
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
                  Atelier Heritage & Optical Lab
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
          <div className="lg:col-span-4 space-y-3">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Shivam Optical</h5>
            <p className="text-xs text-[#716B64] leading-relaxed">
              SAMACHAR market, Shop No-1, Kanishka Complex, Mayur Vihar Phase I, extention, Mayur Vihar, Delhi, 110091.
              <br />
              Computerized eye testing, branded frames, and precision power lenses.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[#2D2926]">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1A1816]">Call / WhatsApp:</span>
              <a href="tel:09779990207" className="text-xs text-[#716B64] hover:text-[#C5A059] font-bold">
                097799 90207
              </a>
            </div>
          </div>

          {/* Col 4: Newsletter Subscription */}
          <div className="lg:col-span-4 space-y-3">
            <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-[#1A1816]">Exclusive Privileges</h5>
            <p className="text-xs text-[#716B64] leading-relaxed">
              Receive private vernissage invites, seasonal capsule access, and optical styling journals.
            </p>
            <form onSubmit={handleNewsletter} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] text-xs rounded-xs focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1A1816] hover:bg-[#C5A059] text-white text-xs font-bold tracking-[0.2em] uppercase rounded-xs transition whitespace-nowrap cursor-pointer"
              >
                SUBSCRIBE
              </button>
            </form>
            <p className="text-[10px] text-[#716B64]/80">By subscribing, you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#716B64] gap-4">
          <p>© 2026 SHIVAM OPTICAL. ALL RIGHTS RESERVED. MAYUR VIHAR PHASE I, DELHI - 110091.</p>
          <div className="flex items-center space-x-6">
            <span>SECURE ENCRYPTED CHECKOUT</span>
            <span>•</span>
            <span>UPI / CARDS / NETBANKING</span>
            <span>•</span>
            <span>PAN-INDIA DISPATCH</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
