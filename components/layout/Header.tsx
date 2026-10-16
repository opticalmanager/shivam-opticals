"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, Calendar, Search, User, Heart, ShoppingBag } from "lucide-react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { totalWishlist, openWishlist } = useWishlist();
  const { openLoginModal, openAppointmentModal, openSearchModal, isLoggedIn, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF3EB] border-b border-[#E8DEC8]/60 transition-all duration-300">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Top Row: Centered Brand Name & Right Utilities */}
        <div className="relative flex items-center justify-center pt-2.5 pb-0.5">
          {/* Mobile Menu Trigger (hidden on desktop) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden absolute left-0 p-1 text-[#0A251C] hover:text-[#C5A059] transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Name Centered: SHIVAM OPTICALS */}
          <Link href="/" className="inline-block py-0.5 text-center group">
            <span className="text-[17px] sm:text-[19px] md:text-[21px] font-serif font-bold tracking-[0.28em] text-[#0A251C] uppercase whitespace-nowrap group-hover:text-[#C5A059] transition-colors">
              SHIVAM OPTICALS
            </span>
          </Link>

          {/* Top Right Utilities: SEARCH, APPOINTMENT, WISHLIST, CART */}
          <div className="flex items-center space-x-3.5 sm:space-x-5 text-[9.5px] md:text-[10px] font-semibold tracking-[0.14em] uppercase text-[#1A1816]/90 absolute right-0">
            {/* SEARCH */}
            <button
              onClick={openSearchModal}
              className="hidden sm:flex items-center gap-1.5 hover:text-[#C5A059] transition py-0.5 group cursor-pointer"
              title="Search Catalog"
            >
              <Search className="w-3.5 h-3.5 text-[#1A1816] group-hover:text-[#C5A059] transition" />
              <span>SEARCH</span>
            </button>

            {/* APPOINTMENT */}
            <button
              onClick={openAppointmentModal}
              className="hidden md:flex items-center gap-1.5 hover:text-[#C5A059] transition py-0.5 group cursor-pointer"
              title="Book Appointment"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1A1816] group-hover:text-[#C5A059] transition" />
              <span>APPOINTMENT</span>
            </button>

            {/* LOGIN / ACCOUNT ICON */}
            {isLoggedIn ? (
              <Link
                href="/account"
                className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
                title={`Account (${user?.name})`}
              >
                <User className="w-[20px] h-[20px] text-[#2B2825] group-hover:text-black transition" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF3EB]" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
                title="Sign In / My Account"
              >
                <User className="w-[20px] h-[20px] text-[#2B2825] group-hover:text-black transition" />
              </button>
            )}

            {/* WISHLIST ICON */}
            <button
              onClick={openWishlist}
              className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-[20px] h-[20px] text-[#2B2825] group-hover:text-[#BB4D00] transition" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-[#BB4D00] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
                  {totalWishlist}
                </span>
              )}
            </button>

            {/* CART ICON */}
            <button
              onClick={openCart}
              className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
              title="Cart"
            >
              <ShoppingBag className="w-[20px] h-[20px] text-[#2B2825] group-hover:text-black transition" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-[#1C1917] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Centered Navigation Row */}
        <nav className="hidden lg:flex items-center justify-center pt-1 pb-2.5 text-[10px] md:text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#1A1816]/90 space-x-6">
          {/* NEW ARRIVALS with Meta Pill */}
          <div className="flex items-center gap-1">
            <Link
              href="/products?filter=new"
              className="flex items-center gap-1 hover:text-[#C5A059] transition nav-link"
            >
              <span>NEW ARRIVALS</span>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold tracking-wider uppercase border border-[#76A9EA] bg-[#E8F2FD] text-[#0A66C2] ml-1 shadow-xs">
              <svg className="w-3 h-2 text-[#0A66C2]" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 1C3.238 1 1 3.238 1 6s2.238 5 5 5c3.2 0 4.5-5 6-5s2.8 5 6 5c2.762 0 5-2.238 5-5s-2.238-5-5-5c-3.2 0-4.5 5-6 5s-2.8-5-6-5z" />
              </svg>
              <span>META</span>
            </span>
          </div>

          <Link href="/products?type=eyeglasses" className="flex items-center gap-1 hover:text-[#C5A059] transition nav-link">
            <span>EYEGLASSES</span>
          </Link>

          <Link href="/products?type=sunglasses" className="flex items-center gap-1 hover:text-[#C5A059] transition nav-link">
            <span>SUNGLASSES</span>
          </Link>

          <Link href="/products?shape=Round" className="flex items-center gap-1 hover:text-[#C5A059] transition nav-link">
            <span>SHAPES GUIDE</span>
          </Link>

          <Link href="/products?brand=Cartier" className="flex items-center gap-1 hover:text-[#C5A059] transition whitespace-nowrap nav-link">
            <span>LUXURY BRANDS</span>
          </Link>

          {/* SALE BUTTON */}
          <Link
            href="/products?sale=true"
            className="inline-flex items-center group cursor-pointer hover:opacity-85 transition select-none px-1"
            title="Special Sale - Up to 40% Off"
          >
            <span className="font-serif italic font-bold text-[#BD2B23] text-[16px] -rotate-6 inline-block leading-none group-hover:scale-105 transition-transform">
              Sale
            </span>
            <span className="text-[8px] font-bold uppercase text-[#BD2B23] border-b border-[#BD2B23] tracking-wider leading-none ml-1 inline-block -translate-y-0.5">
              UP TO 40%
            </span>
          </Link>

          <Link href="/about" className="hover:text-[#C5A059] transition whitespace-nowrap nav-link">
            ABOUT US
          </Link>

          <Link href="/contact" className="hover:text-[#C5A059] transition whitespace-nowrap nav-link">
            CONTACT
          </Link>

          <button
            onClick={openAppointmentModal}
            className="hover:text-[#C5A059] transition whitespace-nowrap nav-link cursor-pointer"
          >
            BOOK EYE TEST
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8DEC8] bg-[#FAF3EB] px-6 py-5 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex justify-around pb-3 border-b border-[#E8DEC8] text-[11px] font-semibold tracking-wider uppercase text-[#0A251C]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openSearchModal();
              }}
              className="flex items-center gap-1.5 py-1"
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAppointmentModal();
              }}
              className="flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Appointment
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openLoginModal();
              }}
              className="flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" /> {isLoggedIn ? "Account" : "Login"}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openWishlist();
              }}
              className="flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" /> Wishlist
            </button>
          </div>

          <div className="space-y-3 text-xs font-semibold tracking-wider uppercase text-[#0A251C]">
            <Link
              href="/products?filter=new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 hover:text-[#C5A059]"
            >
              <span>NEW ARRIVALS</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold border border-[#76A9EA] bg-[#E8F2FD] text-[#0A66C2]">
                META
              </span>
            </Link>
            <Link
              href="/products?type=eyeglasses"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              EYEGLASSES
            </Link>
            <Link
              href="/products?type=sunglasses"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              SUNGLASSES
            </Link>
            <Link
              href="/products?brand=Cartier"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              LUXURY BRANDS
            </Link>
            <Link
              href="/products?sale=true"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 hover:text-[#C5A059]"
            >
              <span className="text-[#BD2B23] font-semibold">SPECIAL SALE</span>
              <span className="inline-flex items-center">
                <span className="font-serif italic font-bold text-[#BD2B23] text-sm -rotate-6">Sale</span>
                <span className="text-[8px] font-bold uppercase text-[#BD2B23] border-b border-[#BD2B23] ml-1">UP TO 40%</span>
              </span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              ABOUT US
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              CONTACT & ATELIER
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#C5A059]"
            >
              MY ACCOUNT & ORDERS
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
