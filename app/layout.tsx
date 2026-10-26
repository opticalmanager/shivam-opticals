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
  metadataBase: new URL("https://shivamoptical.in"),
  title: {
    default: "Shivam Optical | Luxury Eyewear & Haute Lunetterie",
    template: "%s | Shivam Optical",
  },
  description:
    "Shivam Optical — Handcrafted Italian Acetate, Titanium Eyeglasses & Polarized Sunglasses. Atelier boutique in Mayur Vihar, Delhi. Free Express Shipping & 14-Day Returns.",
  keywords: [
    "Shivam Optical",
    "luxury eyewear Delhi",
    "optician Mayur Vihar",
    "computer glasses",
    "blue cut lenses",
    "Ray-Ban glasses",
    "titanium frames",
    "spectacles online India",
  ],
  category: "Eyewear & Optical Atelier",
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "https://shivamoptical.in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Shivam Optical | Luxury Eyewear & Haute Lunetterie",
    description:
      "Handcrafted Italian Acetate, Titanium Eyeglasses & Polarized Sunglasses. Premium clinical lenses, Free Express Shipping & 14-Day Returns.",
    url: "https://shivamoptical.in",
    siteName: "Shivam Optical",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shivam Optical | Luxury Eyewear & Haute Lunetterie",
    description:
      "Handcrafted Italian Acetate, Titanium Eyeglasses & Polarized Sunglasses in Mayur Vihar, Delhi.",
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
