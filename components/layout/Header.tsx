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
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
        {/* Top Row: Symmetrical 3-Column Layout Guaranteed Never to Overlap on Mobile */}
        <div className="relative flex items-center justify-between lg:justify-center pt-2.5 pb-2 lg:pb-0.5">
          {/* Mobile Left: Menu Trigger + Quick Search (fixed w-16 on mobile for 100% center balance) */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 lg:hidden w-16">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1 text-[#0A251C] hover:text-[#C5A059] transition cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={openSearchModal}
              className="p-1.5 text-[#1A1816] hover:text-[#C5A059] transition cursor-pointer"
              title="Search Catalog"
              aria-label="Search Catalog"
            >
              <Search className="w-4 h-4 text-[#1A1816]" />
            </button>
          </div>

          {/* Brand Name Perfectly Centered: SHIVAM OPTICAL */}
          <div className="flex-1 min-w-0 text-center px-1">
            <Link href="/" className="inline-block py-0.5 max-w-full group">
              <span className="text-[13px] min-[360px]:text-[14px] min-[390px]:text-[15px] sm:text-[18px] md:text-[21px] font-serif font-bold tracking-[0.08em] min-[360px]:tracking-[0.13em] sm:tracking-[0.24em] md:tracking-[0.28em] text-[#0A251C] uppercase whitespace-nowrap truncate inline-block max-w-full group-hover:text-[#C5A059] transition-colors">
                SHIVAM OPTICAL
              </span>
            </Link>
          </div>

          {/* Top Right Utilities: Balanced w-16 on Mobile, Absolute on Desktop */}
          <div className="flex items-center justify-end gap-2 sm:gap-4 md:gap-5 shrink-0 w-16 lg:w-auto lg:absolute lg:right-0 text-[9.5px] md:text-[10px] font-semibold tracking-[0.14em] uppercase text-[#1A1816]/90">
            {/* Desktop SEARCH (with text label) */}
            <button
              onClick={openSearchModal}
              className="hidden lg:flex items-center gap-1.5 p-1 hover:text-[#C5A059] transition py-0.5 group cursor-pointer"
              title="Search Catalog"
              aria-label="Search Catalog"
            >
              <Search className="w-3.5 h-3.5 text-[#1A1816] group-hover:text-[#C5A059] transition" />
              <span>SEARCH</span>
            </button>

            {/* APPOINTMENT (md+) */}
            <button
              onClick={openAppointmentModal}
              className="hidden md:flex items-center gap-1.5 hover:text-[#C5A059] transition py-0.5 group cursor-pointer"
              title="Book Appointment"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1A1816] group-hover:text-[#C5A059] transition" />
              <span>APPOINTMENT</span>
            </button>

            {/* LOGIN / ACCOUNT ICON (md+) */}
            {isLoggedIn ? (
              <Link
                href="/account"
                className="hidden md:inline-flex relative items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
                title={`Account (${user?.name})`}
                aria-label="My Account"
              >
                <User className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px] text-[#2B2825] group-hover:text-black transition" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF3EB]" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="hidden md:inline-flex relative items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
                title="Sign In / My Account"
                aria-label="Sign In"
              >
                <User className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px] text-[#2B2825] group-hover:text-black transition" />
              </button>
            )}

            {/* WISHLIST ICON */}
            <button
              onClick={openWishlist}
              className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-[#2B2825] group-hover:text-[#C5A059] transition" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#C5A059] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
                  {totalWishlist}
                </span>
              )}
            </button>

            {/* CART ICON */}
            <button
              onClick={openCart}
              className="relative inline-flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
              title="Cart"
              aria-label="Cart"
            >
              <ShoppingBag className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-[#2B2825] group-hover:text-black transition" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#1C1917] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
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

      {/* Mobile Navigation Drawer with Overlay Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[49px] bg-black/40 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-40 lg:hidden border-t border-[#E8DEC8] bg-[#FAF3EB] px-5 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-50px)] overflow-y-auto">
            {/* Quick Action Dock */}
            <div className="grid grid-cols-4 gap-2 pb-3 border-b border-[#E8DEC8] text-[10px] font-bold tracking-wider uppercase text-[#0A251C]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSearchModal();
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-white/70 border border-[#E8DEC8] hover:border-[#C5A059] cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#0A251C]" />
                <span>Search</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAppointmentModal();
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-white/70 border border-[#E8DEC8] hover:border-[#C5A059] cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#0A251C]" />
                <span>Eye Test</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-white/70 border border-[#E8DEC8] hover:border-[#C5A059] cursor-pointer"
              >
                <User className="w-4 h-4 text-[#0A251C]" />
                <span>{isLoggedIn ? "Account" : "Sign In"}</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openWishlist();
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-white/70 border border-[#E8DEC8] hover:border-[#C5A059] cursor-pointer"
              >
                <Heart className="w-4 h-4 text-[#0A251C]" />
                <span>Wishlist</span>
              </button>
            </div>

            {/* Navigation Links with Touch-Friendly Heights */}
            <nav className="divide-y divide-[#E8DEC8]/50 text-xs font-semibold tracking-wider uppercase text-[#0A251C]">
              <Link
                href="/products?filter=new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                <span>NEW ARRIVALS</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold border border-[#76A9EA] bg-[#E8F2FD] text-[#0A66C2]">
                  META
                </span>
              </Link>
              <Link
                href="/products?type=eyeglasses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                <span>EYEGLASSES</span>
                <span className="text-[10px] text-stone-400 font-normal">Optical Frames</span>
              </Link>
              <Link
                href="/products?type=sunglasses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                <span>SUNGLASSES</span>
                <span className="text-[10px] text-stone-400 font-normal">Polarized & UV</span>
              </Link>
              <Link
                href="/products?brand=Ray-Ban"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                <span>LUXURY BRANDS</span>
                <span className="text-[10px] text-[#C5A059] font-bold">Ray-Ban, Carrera, Burberry</span>
              </Link>
              <Link
                href="/products?sale=true"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                <span className="text-[#BD2B23] font-bold">SPECIAL SALE</span>
                <span className="inline-flex items-center">
                  <span className="font-serif italic font-bold text-[#BD2B23] text-sm -rotate-6">Sale</span>
                  <span className="text-[8px] font-bold uppercase text-[#BD2B23] border-b border-[#BD2B23] ml-1">UP TO 40%</span>
                </span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                ABOUT OUR ATELIER
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                CONTACT &amp; STORE LOCATION
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] py-2.5 hover:text-[#C5A059] transition-colors"
              >
                MY ACCOUNT &amp; ORDERS
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
