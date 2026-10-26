import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designer Eyewear & Optical Frames Catalog",
  description:
    "Explore luxury spectacle frames, blue-cut screen glasses, and polarized sunglasses from Ray-Ban, Vogue, and artisan collections at Shivam Optical. Pan-India delivery & 14-day returns.",
  alternates: {
    canonical: "https://shivamoptical.in/products",
  },
  openGraph: {
    title: "Designer Eyewear & Optical Frames Catalog | Shivam Optical",
    description:
      "Handcrafted optical frames, polarized sunglasses, and precision computer lenses. Available at Shivam Optical Atelier.",
    url: "https://shivamoptical.in/products",
    siteName: "Shivam Optical",
    images: [
      {
        url: "https://shivamoptical.in/images/clean_frame_1.png",
        width: 1200,
        height: 630,
        alt: "Shivam Optical Eyewear Collection",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Designer Eyewear & Optical Frames Catalog | Shivam Optical",
    description:
      "Explore luxury spectacle frames and polarized sunglasses at Shivam Optical.",
    images: ["https://shivamoptical.in/images/clean_frame_1.png"],
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
