"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { WishlistDrawer } from "@/components/layout/WishlistDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { AppointmentModal } from "@/components/layout/AppointmentModal";
import { LoginModal } from "@/components/layout/LoginModal";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Pure administrative canvas: NO storefront header, NO footer, NO cart/wishlist drawers, NO consumer modals
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FCFAF7] text-[#1A1816]">
      <div>
        <Header />
        <main>{children}</main>
      </div>
      <Footer />

      {/* Global Interactive Overlays (Mounted strictly on storefront routes) */}
      <CartDrawer />
      <WishlistDrawer />
      <SearchModal />
      <AppointmentModal />
      <LoginModal />
    </div>
  );
}
