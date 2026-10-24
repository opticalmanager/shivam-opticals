import { Product, LensPackage } from "@/types";

/**
 * Shivam Optical - Product Catalog
 * Active products are stored and managed through PostgreSQL (public.products)
 * and can be published via the Admin OS (/admin/products).
 */
export const PRODUCTS: Product[] = [];

/**
 * Clinical Lens Packages for Precision Lens Customizer
 */
export const LENS_PACKAGES: LensPackage[] = [
  {
    id: "lp-single-vision",
    name: "Standard Clear Vision",
    lensType: "single-vision",
    price: 990,
    features: [
      "Anti-Reflective Coating (ARC)",
      "UV400 Ultraviolet Protection",
      "Scratch-Resistant Hard Coat",
      "Hydrophobic Easy-Clean Surface",
    ],
    recommended: false,
  },
  {
    id: "lp-blue-shield",
    name: "Digital Blue-Shield Pro",
    lensType: "blue-light",
    price: 1890,
    features: [
      "420nm High-Energy Blue Light Filter",
      "Super Hydrophobic Oleophobic Surface",
      "Anti-Static Dust Repellent Coating",
      "100% UV400 Dual-Side Shield",
      "Crystal Ultra-Clear Transparency",
    ],
    recommended: true,
  },
  {
    id: "lp-photochromic",
    name: "Transitions PhotoFusion X",
    lensType: "photochromic",
    price: 3490,
    features: [
      "Rapid Indoor-to-Outdoor Darkening",
      "Clear Indoors / Deep Tint in Sunlight",
      "Comprehensive Digital Eye Strain Protection",
      "Extreme Scratch & Impact Resistance",
      "Diamond Ultra Anti-Reflective Coating",
    ],
    recommended: false,
  },
  {
    id: "lp-zeiss-progressive",
    name: "Zeiss SmartLife Progressive",
    lensType: "progressive",
    price: 7490,
    features: [
      "Zeiss Freeform Digital Wavefront Technology",
      "Seamless Near, Intermediate & Distance Transition",
      "Custom Individualized Corridor Optimization",
      "Zeiss DuraVision Platinum AR Coating",
      "1 Year Vision Clarity Adaptation Guarantee",
    ],
    recommended: false,
  },
];
