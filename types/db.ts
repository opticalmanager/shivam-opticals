/**
 * Shivam Optics - Database Entity Models & Types
 * Mirroring PostgreSQL schemas with strict type-safety
 */

export type UserRole = "customer" | "admin" | "optician";

export interface DbProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  loyalty_points: number;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCustomerAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBrand {
  id: string;
  slug: string;
  name: string;
  origin?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  featured_image_url?: string | null;
  description?: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSpecs {
  lensWidth: number;
  bridgeWidth: number;
  templeLength: number;
  frameWidth?: number;
  weight?: string;
  material?: string;
}

export interface TryOnConfiguration {
  modelVersion: number;
  calibrationVersion: number;
  scaleMultiplier: number;
  verticalOffset: number;
  depthOffset: number;
  pitchOffset: number;
  yawOffset: number;
  rollOffset: number;
  frameWidth: number;
  lensWidth: number;
  bridgeWidth: number;
  templeLength: number;
}

export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  brand_id?: string | null;
  category_id?: string | null;
  gender: "men" | "women" | "unisex" | "kids";
  shape: "aviator" | "cat-eye" | "rectangle" | "round" | "square" | "geometric" | "oval" | "wayfarer" | "hexagon" | "octagonal" | string;
  rim_type: "full-rim" | "half-rim" | "rimless" | "semi-rimless";
  material: string;
  color: string;
  color_hex: string;
  base_price: number;
  original_price?: number | null;
  lens_properties: string[];
  specs: ProductSpecs;
  description?: string | null;
  source_url?: string | null;
  color_variants?: any[];
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_on_sale: boolean;
  is_limited_edition: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  try_on_enabled?: boolean;
  try_on_model_url?: string | null;
  try_on_configuration?: TryOnConfiguration;
  created_at: string;
  updated_at: string;
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  variant_id?: string | null;
  url: string;
  alt_text?: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface DbLensPackage {
  id: string;
  lens_type: "single-vision" | "progressive" | "zero-power-blue" | "frame-only";
  name: string;
  description?: string | null;
  price: number;
  badge?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface EyePrescriptionData {
  sph: string;
  cyl: string;
  axis: string;
  add?: string | null;
}

export interface DbPrescription {
  id: string;
  user_id?: string | null;
  patient_name: string;
  doctor_name?: string | null;
  rx_date?: string | null;
  right_eye: EyePrescriptionData;
  left_eye: EyePrescriptionData;
  pd: number;
  file_url?: string | null;
  created_at: string;
}

export type OrderStatus =
  | "confirmed"
  | "optician_assembly"
  | "quality_check"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface DbOrder {
  id: string;
  order_number: string;
  customer_id?: string | null;
  guest_name?: string | null;
  guest_email: string;
  guest_phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_id?: string | null;
  payment_details?: Record<string, any>;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string | null;
  shipping_fee: number;
  total_amount: number;
  shipping_address: {
    fullName: string;
    phone: string;
    email?: string;
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  tracking_number: string;
  courier_partner: string;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  lens_package_id?: string | null;
  prescription_id?: string | null;
  quantity: number;
  unit_price: number;
  lens_price: number;
  total_price: number;
  product_snapshot: any;
  created_at: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface DbAppointment {
  id: string;
  booking_reference: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string | null;
  service: string;
  store_location: string;
  appointment_date: string;
  time_slot: string;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount?: number | null;
  valid_from: string;
  valid_until?: string | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface DbAdminSettings {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}
