import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shivam Optical | Luxury Eyewear & Haute Lunetterie",
    short_name: "Shivam Optical",
    description:
      "Handcrafted Italian Acetate, Titanium Eyeglasses & Polarized Sunglasses. Atelier boutique in Mayur Vihar, Delhi.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#C5A059",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/images/clean_frame_1.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
