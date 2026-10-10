"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { WishlistDrawer } from "@/components/layout/WishlistDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { AppointmentModal } from "@/components/layout/AppointmentModal";
import { LoginModal } from "@/components/layout/LoginModal";
import { OrderTrackingModal } from "@/components/pages/OrderTrackingModal";
import { LensCustomizerModal } from "@/components/optical/LensCustomizerModal";
import { useCart } from "@/context/CartContext";
import { Product, SelectedLensConfig } from "@/types";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const { addCustomLensToCart } = useCart();
  const [customizerProduct, setCustomizerProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<Product>;
      if (customEvent.detail) {
        setCustomizerProduct(customEvent.detail);
      }
    };
    window.addEventListener("open-lens-customizer", handleOpen);
    return () => window.removeEventListener("open-lens-customizer", handleOpen);
  }, []);

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
      <OrderTrackingModal />

      {/* Clinical Lens Customizer Overlay */}
      {customizerProduct && (
        <LensCustomizerModal
          product={customizerProduct}
          onClose={() => setCustomizerProduct(null)}
          onConfirmLensConfig={(config: SelectedLensConfig) => {
            addCustomLensToCart(customizerProduct, config);
            setCustomizerProduct(null);
          }}
        />
      )}
    </div>
  );
}
