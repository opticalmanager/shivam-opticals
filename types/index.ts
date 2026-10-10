export type GenderCategory = 'men' | 'women' | 'unisex' | 'kids';

export type FrameShape =
  | 'aviator'
  | 'cat-eye'
  | 'rectangle'
  | 'round'
  | 'square'
  | 'geometric'
  | 'oval'
  | 'wayfarer'
  | 'hexagon'
  | 'octagonal'
  | string;

export type RimType = 'full-rim' | 'half-rim' | 'rimless' | 'semi-rimless' | string;

export type FrameMaterial =
  | 'titanium'
  | 'acetate'
  | 'metal'
  | '18k-gold-plated'
  | 'horn'
  | 'horn-gold'
  | 'combination'
  | 'stainless-steel'
  | 'polymer'
  | string;

export type LensProperty =
  | 'polarized'
  | 'uv-protection'
  | 'photochromic'
  | 'gradient'
  | 'blue-light-filter'
  | 'anti-reflective';

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  image?: string;
  inStock?: boolean;
}

export interface ColorVariant {
  id?: string;
  variantId?: number | string;
  sku: string;
  colorName: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number | null;
  available?: boolean;
  featuredImage?: string;
  gallery?: string[];
}

export interface ShippingPackageDimensions {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  weightKg: number;
}

export interface ContactLensSpecs {
  packSize?: string;
  wearingSchedule?: string;
  baseCurve?: string;
  waterContent?: string;
  material?: string;
}

export interface ProductSpecs {
  lensWidth: number; // e.g. 53mm
  bridgeWidth: number; // e.g. 18mm
  templeLength: number; // e.g. 145mm
  frameWidth?: number; // e.g. 140mm
  weight?: string;
  countryOfOrigin?: string;
  frontColor?: string;
  templeColor?: string;
  lensColor?: string;
  styleTip?: string;
  packageDimensions?: ShippingPackageDimensions;
  contactLensSpecs?: ContactLensSpecs;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  subtitle?: string;
  price: number; // In INR
  originalPrice?: number;
  discountPct?: number;
  category: 'sunglasses' | 'eyeglasses' | 'contact-lenses' | 'meta-smart' | 'kids' | string;
  type?: 'eyeglasses' | 'sunglasses' | 'contact-lenses' | string;
  gender: GenderCategory;
  shape: FrameShape;
  rimType?: RimType;
  material?: FrameMaterial;
  color?: string;
  colorHex?: string;
  colors?: string[];
  lensProperties?: LensProperty[];
  size?: 'S' | 'M' | 'L' | string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  isLimitedEdition?: boolean;
  rating?: number;
  reviewCount?: number;
  tag?: string;
  tagType?: string;
  img?: string;
  images: string[];
  description: string;
  specs?: ProductSpecs;
  measurements?: {
    lensWidth: number;
    bridgeWidth: number;
    templeLength: number;
  };
  variants?: ProductVariant[];
  colorVariants?: ColorVariant[];
  sourceUrl?: string;
  packageDimensions?: ShippingPackageDimensions;
  contactLensSpecs?: ContactLensSpecs;
  tryOnEnabled?: boolean;
  tryOnModelUrl?: string;
  tryOnConfig?: Partial<import('./tryOn').TryOnConfiguration>;
}

export * from './tryOn';

export interface FilterState {
  category: string;
  brands: string[];
  shapes: FrameShape[];
  rimTypes: RimType[];
  materials: FrameMaterial[];
  colors: string[];
  properties: LensProperty[];
  gender: GenderCategory[];
  priceRange: [number, number];
  searchQuery: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating';
  onlyNewArrivals?: boolean;
  onlySale?: boolean;
  minDiscount?: number;
}

export type LensTypeOption = 'single-vision' | 'progressive' | 'zero-power-blue' | 'frame-only';

export interface LensPackage {
  id: string;
  name: string;
  type?: string;
  lensType?: string;
  description?: string;
  price: number;
  badge?: string;
  features?: string[];
  recommended?: boolean;
}

export interface EyePrescription {
  sph: string;
  cyl: string;
  axis: string;
  add?: string;
}

export interface PrescriptionData {
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd: string; // Pupillary Distance
  fileName?: string;
}

export interface Prescription {
  odSphere?: string;
  odCylinder?: string;
  odAxis?: string;
  osSphere?: string;
  osCylinder?: string;
  osAxis?: string;
  pd?: string;
}

export interface SelectedLensConfig {
  lensType: LensTypeOption;
  lensPackage?: LensPackage;
  coatings?: string[];
  prescription?: PrescriptionData;
  totalLensPrice: number;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: ProductVariant;
  lensConfig?: SelectedLensConfig;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  apartment?: string;
}

export type PaymentMethod = 'razorpay' | 'upi' | 'card' | 'netbanking' | 'cod';

export type LabStatus =
  | 'confirmed'
  | 'optician_assembly'
  | 'quality_check'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  trackingNumber: string;
  customerId?: string;
  createdAt: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  paymentDetails?: any;
  paymentStatus?: 'paid' | 'unpaid' | 'failed' | 'refunded';
  subtotal: number;
  discount: number;
  couponApplied?: string;
  cleaningKitAdded?: boolean;
  totalAmount: number;
  status: 'confirmed' | 'optician_assembly' | 'quality_check' | 'dispatched' | 'delivered';
  estimatedDeliveryDate: string;
}

export interface Brand {
  id: string;
  name: string;
  origin: string;
  tagline: string;
  featuredImage: string;
  description: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  timings?: string;
  hours?: string;
  hasEyeTestingLab?: boolean;
  isFlagship?: boolean;
  image?: any;
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl?: string;
  mapEmbedUrl?: string;
}

export interface Appointment {
  id?: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  service: string;
  storeLocation?: string;
  notes?: string;
  createdAt?: string;
}

export interface AppointmentBooking {
  id: string;
  type: 'in-store' | 'home';
  fullName: string;
  phone: string;
  email: string;
  service: string;
  storeLocation?: string;
  address?: string;
  pincode?: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  phoneVerified?: boolean;
  phoneVerificationChannel?: 'whatsapp' | 'sms';
  role?: 'customer' | 'optician' | 'admin';
  joinedDate?: string;
  gemPoints: number;
  savedAddresses: ShippingAddress[];
  savedPrescriptions: {
    id: string;
    title: string;
    date: string;
    doctorName?: string;
    data: PrescriptionData;
  }[];
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'error' | 'warning';
}
