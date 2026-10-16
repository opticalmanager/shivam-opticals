import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { Toaster } from "sonner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shivam Opticals | Luxury Eyewear & Haute Lunetterie",
  description:
    "Shivam Opticals - Handcrafted Italian Acetate, Titanium Eyeglasses & Polarized Sunglasses. Premium lenses, Free Express Shipping & 14-Day Returns.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${cormorant.variable} ${jost.variable} ${montserrat.variable}`}
    >
      <body className="font-sans antialiased selection:bg-[#C5A059] selection:text-white min-h-screen">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <StorefrontShell>{children}</StorefrontShell>
              {/* Toast Feedback */}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#FAF3EB",
                    color: "#1A1816",
                    borderColor: "#E8DEC8",
                  },
                }}
              />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
