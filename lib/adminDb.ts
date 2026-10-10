import fs from "fs";
import path from "path";
import { PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { query } from "./pg";
export { getPgPool, query } from "./pg";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "shivam_store.json");

export interface StoredOrder {
  id: string;
  order_number: string;
  guest_name?: string;
  guest_email: string;
  guest_phone: string;
  status: "confirmed" | "optician_assembly" | "quality_check" | "dispatched" | "delivered" | "cancelled";
  payment_status: "paid" | "pending" | "failed";
  payment_method: string;
  payment_id?: string;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string;
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
  tracking_number?: string;
  courier_partner?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    color: string;
    lens_package?: string;
    total_price: number;
    snapshot: any;
  }>;
}

export interface StoredVariant {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  color_name: string;
  color_hex: string;
  stock_quantity: number;
  price: number;
  category: string;
}

export interface StoredCoupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

export interface StoredAppointment {
  id: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  service: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
}

export interface StoredCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  product_count?: number;
  created_at: string;
}

export interface StoredBrand {
  id: string;
  slug: string;
  name: string;
  origin: string;
  tagline: string;
  description?: string;
  is_featured?: boolean;
  is_active: boolean;
  product_count?: number;
  created_at: string;
}

export interface DataStoreSchema {
  products: Product[];
  orders: StoredOrder[];
  variants: StoredVariant[];
  coupons: StoredCoupon[];
  appointments: StoredAppointment[];
  categories: StoredCategory[];
  brands: StoredBrand[];
  settings: Record<string, any>;
}

function getInitialStore(): DataStoreSchema {
  // Convert PRODUCTS to variants
  const variants: StoredVariant[] = [];
  PRODUCTS.forEach((p, pIdx) => {
    (p.colors || ["#1A1816"]).forEach((c, cIdx) => {
      variants.push({
        id: `var-${p.id}-${cIdx}`,
        product_id: p.id,
        product_name: p.name,
        sku: `SKU-${p.id.toUpperCase()}-${cIdx + 1}`,
        color_name: cIdx === 0 ? "Signature Black" : cIdx === 1 ? "Champagne Gold" : "Polished Gunmetal",
        color_hex: c,
        stock_quantity: pIdx === 0 ? 3 : pIdx === 2 ? 4 : 12 + ((pIdx * 3) % 15),
        price: p.price,
        category: p.category || "Eyeglasses",
      });
    });
  });

  const initialOrders: StoredOrder[] = [
    {
      id: "ord-101",
      order_number: "SO-109284",
      guest_name: "Aishwarya Mukherjee",
      guest_email: "aishwarya.m@example.com",
      guest_phone: "098200 44122",
      status: "optician_assembly",
      payment_status: "paid",
      payment_method: "Razorpay Standard (UPI)",
      payment_id: "pay_Rzp9128381",
      subtotal: 2980,
      discount_amount: 0,
      shipping_fee: 0,
      total_amount: 2980,
      shipping_address: {
        fullName: "Aishwarya Mukherjee",
        phone: "098200 44122",
        email: "aishwarya.m@example.com",
        streetAddress: "Apt 4B, Kanishka Complex, Mayur Vihar Phase 1",
        city: "Delhi",
        state: "Delhi",
        pincode: "110091",
        country: "India",
      },
      courier_partner: "BlueDart Express",
      tracking_number: "BD-904128912",
      estimated_delivery: "Within 48 hours",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      items: [
        {
          id: "item-1",
          product_id: "so-101",
          product_name: "Half Frame Rectangle Metal",
          quantity: 2,
          unit_price: 1490,
          color: "#1A1816",
          lens_package: "Zeiss DuraVision BlueProtect (+₹1,490)",
          total_price: 2980,
          snapshot: PRODUCTS[0],
        },
      ],
    },
    {
      id: "ord-102",
      order_number: "SO-109285",
      guest_name: "Rahul Verma",
      guest_email: "rahul.v@example.com",
      guest_phone: "098112 90214",
      status: "quality_check",
      payment_status: "paid",
      payment_method: "Razorpay Standard (Credit Card)",
      payment_id: "pay_Rzp9128499",
      subtotal: 3990,
      discount_amount: 478,
      coupon_code: "FLAT12",
      shipping_fee: 0,
      total_amount: 3512,
      shipping_address: {
        fullName: "Rahul Verma",
        phone: "098112 90214",
        email: "rahul.v@example.com",
        streetAddress: "Block C-2, Pocket 1, Mayur Vihar Extension",
        city: "Delhi",
        state: "Delhi",
        pincode: "110091",
        country: "India",
      },
      courier_partner: "Delhivery Air",
      tracking_number: "DLV-8821903",
      estimated_delivery: "Within 24 hours",
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      items: [
        {
          id: "item-2",
          product_id: "so-104",
          product_name: "Full Frame Square Metal Eyeglasses",
          quantity: 1,
          unit_price: 3990,
          color: "#B45309",
          lens_package: "Zeiss Digital Progressive (+₹2,490)",
          total_price: 3990,
          snapshot: PRODUCTS[3],
        },
      ],
    },
    {
      id: "ord-103",
      order_number: "SO-109286",
      guest_name: "Sonali Kulkarni",
      guest_email: "sonali.k@example.com",
      guest_phone: "098331 78901",
      status: "confirmed",
      payment_status: "pending",
      payment_method: "Cash on Delivery / In-Store Pickup",
      subtotal: 1490,
      discount_amount: 0,
      shipping_fee: 150,
      total_amount: 1640,
      shipping_address: {
        fullName: "Sonali Kulkarni",
        phone: "098331 78901",
        email: "sonali.k@example.com",
        streetAddress: "D-14, Samachar Apartments, Mayur Vihar Phase 1",
        city: "Delhi",
        state: "Delhi",
        pincode: "110091",
        country: "India",
      },
      estimated_delivery: "Mayur Vihar Lab Pickup",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      items: [
        {
          id: "item-3",
          product_id: "so-102",
          product_name: "Half Frame Square",
          quantity: 1,
          unit_price: 1490,
          color: "#E5A93C",
          total_price: 1490,
          snapshot: PRODUCTS[1],
        },
      ],
    },
  ];

  const initialAppointments: StoredAppointment[] = [
    {
      id: "apt-101",
      name: "Dr. Vikram Seth",
      phone: "098110 55432",
      email: "vikram.seth@example.com",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      time: "11:30 AM",
      service: "Comprehensive Computerized Eye Test",
      status: "confirmed",
      notes: "Prescription update for progressive lenses.",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "apt-102",
      name: "Meera Sen",
      phone: "098711 23490",
      email: "meera.sen@example.com",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      time: "04:00 PM",
      service: "Bespoke Frame Fitting & Pupil Centering",
      status: "pending",
      notes: "First time luxury frames trial.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  const initialCategories: StoredCategory[] = [
    {
      id: "cat-1",
      slug: "eyeglasses",
      name: "Prescription Eyeglasses",
      description: "Precision engineered single-vision and progressive spectacles",
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "cat-2",
      slug: "sunglasses",
      name: "Polarized Sunglasses",
      description: "100% UV400 Japanese lenses with anti-glare filtration",
      display_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "cat-3",
      slug: "computer-glasses",
      name: "Blue-Cut Screen Glasses",
      description: "High-energy 410-455nm blue light protection for daily screen hours",
      display_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "cat-4",
      slug: "titanium",
      name: "Featherweight Titanium",
      description: "Hypoallergenic Beta-Titanium and Italian M49 bio-acetate silhouettes",
      display_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const initialBrands: StoredBrand[] = [
    { id: "br-1", slug: "gast", name: "GAST", origin: "Milan, Italy", tagline: "Independent Eyewear Architecture", is_active: true, created_at: new Date().toISOString() },
    { id: "br-2", slug: "cartier", name: "Cartier", origin: "Paris, France", tagline: "Haute Joaillerie & Lunetterie", is_active: true, created_at: new Date().toISOString() },
    { id: "br-3", slug: "montblanc", name: "Montblanc", origin: "Hamburg, Germany", tagline: "Precision Craftsmanship", is_active: true, created_at: new Date().toISOString() },
    { id: "br-4", slug: "ray-ban", name: "Ray-Ban", origin: "Milan, Italy", tagline: "Timeless Cultural Icons", is_active: true, created_at: new Date().toISOString() },
    { id: "br-5", slug: "tom-ford", name: "Tom Ford", origin: "New York, USA", tagline: "Sensual Luxury Design", is_active: true, created_at: new Date().toISOString() },
    { id: "br-6", slug: "lindberg", name: "Lindberg", origin: "Aarhus, Denmark", tagline: "Danish Minimalist Titanium", is_active: true, created_at: new Date().toISOString() },
  ];

  const initialCoupons: StoredCoupon[] = [
    {
      id: "cpn-1",
      code: "FLAT12",
      discount_type: "percentage",
      discount_value: 12,
      min_order_value: 1490,
      max_discount: 2500,
      usage_limit: 500,
      times_used: 28,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "cpn-2",
      code: "WELCOME10",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 999,
      max_discount: 1500,
      usage_limit: 1000,
      times_used: 14,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const initialSettings = {
    general: {
      storeName: "Shivam Optical",
      tagline: "Haute Lunetterie & Optometric Atelier",
      email: "contact@shivamoptics.in",
      phone: "097799 90207",
      currency: "INR (₹)",
      operatingHours: "Open 7 Days • 10:30 AM to 9:00 PM",
      address: "SAMACHAR market, Shop No-1, Kanishka Complex, Mayur Vihar Phase I, extention, Mayur Vihar, Delhi, 110091",
    },
    store: {
      mandatoryVerification: true,
      titaniumWarranty: true,
      complimentaryCaseAndCloth: true,
      allowCustomRxUpload: true,
    },
    payments: {
      razorpay: {
        enabled: true,
        mode: "test",
        keyId: "rzp_test_TfX2gVZqD6Ern5",
        keySecret: "9lrOQWoB18TQgHvX46AcBk2a",
        acceptedMethods: ["UPI", "GPay", "PhonePe", "Credit/Debit Cards", "NetBanking"],
      },
      cod: {
        enabled: true,
        minOrderValue: 500,
        maxOrderValue: 25000,
      },
    },
    shipping: {
      freeShippingThreshold: 1999,
      standardShippingFee: 150,
      expressShippingFee: 290,
      defaultCarrier: "BlueDart Express",
      supportedCarriers: ["BlueDart Express", "Delhivery Air", "Speed Post India"],
    },
    notifications: {
      orderEmail: true,
      labAssemblyWhatsApp: true,
      dispatchSms: true,
      lowStockStaffAlert: true,
    },
    marketing: {
      announcementTicker: "Complimentary Zeiss Lens Cleaning Kit with Every Premium Frame",
      campaigns: [
        {
          id: "camp-1",
          title: "Festive Haute Lunetterie Exclusive",
          channel: "WhatsApp & SMS",
          audience: "High-LTV Patrons (42 Recipients)",
          status: "Active",
          sentCount: 42,
          conversion: "19.0%",
        },
        {
          id: "camp-2",
          title: "Zeiss Progressive Lens Upgrade Notice",
          channel: "Email Newsletter",
          audience: "Prescription Wearers (118 Recipients)",
          status: "Scheduled",
          sentCount: 118,
          conversion: "14.4%",
        },
      ],
    },
    roles: [
      { id: "r-1", name: "Sunil Sharma", email: "sunil@shivamoptics.in", role: "Chief Optometrist", status: "Active" },
      { id: "r-2", name: "Anand Verma", email: "anand@shivamoptics.in", role: "Optical Lab Technician", status: "Active" },
      { id: "r-3", name: "Pooja Malhotra", email: "pooja@shivamoptics.in", role: "Atelier Concierge", status: "Active" },
    ],
  };

  return {
    products: PRODUCTS,
    orders: initialOrders,
    variants,
    coupons: initialCoupons,
    appointments: initialAppointments,
    categories: initialCategories,
    brands: initialBrands,
    settings: initialSettings,
  };
}

export function getStore(): DataStoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[adminDb] Error reading store, generating initial:", err);
    return getInitialStore();
  }
}

export function saveStore(store: DataStoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[adminDb] Error persisting store:", err);
  }
}

// ================= ORDERS ENGINE =================
export function getOrders(filters: { search?: string; status?: string; paymentStatus?: string; page?: number; limit?: number }) {
  const store = getStore();
  let list = [...store.orders];

  if (filters.status && filters.status !== "all") {
    list = list.filter((o) => o.status === filters.status);
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    list = list.filter((o) => o.payment_status === filters.paymentStatus);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.guest_name?.toLowerCase().includes(q) ||
        o.guest_email.toLowerCase().includes(q) ||
        o.guest_phone.includes(q) ||
        o.tracking_number?.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);

  // Status counts
  const allOrders = store.orders;
  const counts = {
    all: allOrders.length,
    confirmed: allOrders.filter((o) => o.status === "confirmed").length,
    optician_assembly: allOrders.filter((o) => o.status === "optician_assembly").length,
    quality_check: allOrders.filter((o) => o.status === "quality_check").length,
    dispatched: allOrders.filter((o) => o.status === "dispatched").length,
    delivered: allOrders.filter((o) => o.status === "delivered").length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
  };

  return {
    orders: paginated,
    pagination: { page, limit, total, totalPages },
    counts,
  };
}

export function getOrderById(id: string): StoredOrder | null {
  const store = getStore();
  return store.orders.find((o) => o.id === id || o.order_number === id) || null;
}

export function createOrder(data: Partial<StoredOrder>): StoredOrder {
  const store = getStore();
  const newOrder: StoredOrder = {
    id: `ord-${Date.now()}`,
    order_number: data.order_number || `SO-${Math.floor(100000 + Math.random() * 900000)}`,
    guest_name: data.guest_name || data.shipping_address?.fullName || "Patron",
    guest_email: data.guest_email || data.shipping_address?.email || "patron@shivamoptics.in",
    guest_phone: data.guest_phone || data.shipping_address?.phone || "09779990207",
    status: "confirmed",
    payment_status: data.payment_status || (data.payment_method?.toLowerCase().includes("razorpay") ? "paid" : "pending"),
    payment_method: data.payment_method || "Razorpay Standard",
    payment_id: data.payment_id || `pay_${Date.now()}`,
    subtotal: data.subtotal || 0,
    discount_amount: data.discount_amount || 0,
    coupon_code: data.coupon_code,
    shipping_fee: data.shipping_fee || 0,
    total_amount: data.total_amount || 0,
    shipping_address: data.shipping_address || {
      fullName: data.guest_name || "Patron",
      phone: data.guest_phone || "09779990207",
      streetAddress: "Mayur Vihar",
      city: "Delhi",
      state: "Delhi",
      pincode: "110091",
      country: "India",
    },
    courier_partner: "BlueDart Express",
    tracking_number: `BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
    estimated_delivery: "Within 48-72 hours",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: data.items || [],
  };

  // Decrement variant stock
  newOrder.items.forEach((item) => {
    const variant = store.variants.find((v) => v.product_id === item.product_id);
    if (variant && variant.stock_quantity > 0) {
      variant.stock_quantity = Math.max(0, variant.stock_quantity - item.quantity);
    }
  });

  store.orders.unshift(newOrder);
  saveStore(store);

  // Asynchronous sync to live Supabase PostgreSQL
  try {
    query(
      `INSERT INTO public.orders (
         order_number, guest_name, guest_email, guest_phone, status,
         payment_status, payment_method, payment_id, subtotal, discount_amount,
         coupon_code, shipping_fee, total_amount, shipping_address, tracking_number
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (order_number) DO NOTHING`,
      [
        newOrder.order_number,
        newOrder.guest_name,
        newOrder.guest_email,
        newOrder.guest_phone,
        newOrder.status,
        newOrder.payment_status,
        newOrder.payment_method,
        newOrder.payment_id,
        newOrder.subtotal,
        newOrder.discount_amount,
        newOrder.coupon_code || null,
        newOrder.shipping_fee,
        newOrder.total_amount,
        JSON.stringify(newOrder.shipping_address),
        newOrder.tracking_number,
      ]
    ).catch((e: any) => console.warn("[adminDb] Supabase order sync non-fatal warning:", e.message));
  } catch {}

  return newOrder;
}

export function updateOrder(id: string, updates: Partial<StoredOrder>): StoredOrder | null {
  const store = getStore();
  const idx = store.orders.findIndex((o) => o.id === id || o.order_number === id);
  if (idx === -1) return null;

  store.orders[idx] = {
    ...store.orders[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  saveStore(store);
  return store.orders[idx];
}

// ================= PRODUCTS ENGINE =================
export function getProducts(filters: {
  search?: string;
  category?: string;
  brand?: string;
  shape?: string;
  tab?: string;
  page?: number;
  limit?: number;
}) {
  const store = getStore();
  let list = [...store.products];

  // Distinct shapes, brands, categories for filter dropdowns
  const allBrands = Array.from(new Set(store.products.map((p) => p.brand).filter(Boolean)));
  const allCategories = Array.from(new Set(store.products.map((p) => p.category).filter(Boolean)));
  const allShapes = Array.from(new Set(store.products.map((p) => p.shape).filter(Boolean)));

  if (filters.category && filters.category !== "all") {
    const cat = filters.category.toLowerCase();
    list = list.filter(
      (p) => p.category?.toLowerCase() === cat || p.type?.toLowerCase() === cat
    );
  }

  if (filters.brand && filters.brand !== "all") {
    const b = filters.brand.toLowerCase();
    list = list.filter((p) => p.brand?.toLowerCase() === b);
  }

  if (filters.shape && filters.shape !== "all") {
    const s = filters.shape.toLowerCase();
    list = list.filter((p) => p.shape?.toLowerCase() === s);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.shape.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q)
    );
  }

  const counts = {
    all: store.products.length,
    published: store.products.length,
    draft: 0,
    outOfStock: store.variants.filter((v) => v.stock_quantity === 0).length,
  };

  const total = list.length;
  const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : (filters.page ? 10 : total);
  const totalPages = Math.ceil(total / limit) || 1;

  const paginated = filters.page ? list.slice((page - 1) * limit, page * limit) : list;

  return {
    products: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    counts,
    brands: allBrands,
    categories: allCategories,
    shapes: allShapes,
  };
}

export function importScrapedProducts(products: Product[]): {
  importedCount: number;
  newBrandsCount: number;
  newCategoriesCount: number;
} {
  const store = getStore();
  let importedCount = 0;
  let newBrandsCount = 0;
  let newCategoriesCount = 0;

  const existingIds = new Set(store.products.map((p) => p.id));
  const existingSourceUrls = new Set(store.products.map((p) => p.sourceUrl).filter(Boolean));
  const existingBrandNames = new Set((store.brands || []).map((b) => b.name.toLowerCase()));
  const existingCatNames = new Set((store.categories || []).map((c) => c.name.toLowerCase()));

  if (!store.brands) store.brands = [];
  if (!store.categories) store.categories = [];

  products.forEach((p) => {
    // Check if brand exists, else auto-register
    if (p.brand && !existingBrandNames.has(p.brand.toLowerCase())) {
      const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      store.brands.push({
        id: `brd-${brandSlug}`,
        slug: brandSlug,
        name: p.brand,
        origin: "Haute Lunetterie",
        tagline: "Independent Luxury Eyewear Architecture",
        is_active: true,
        created_at: new Date().toISOString(),
      });
      existingBrandNames.add(p.brand.toLowerCase());
      newBrandsCount++;
    }

    // Check if category exists, else auto-register
    if (p.category && !existingCatNames.has(p.category.toLowerCase())) {
      const catSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      store.categories.push({
        id: `cat-${catSlug}`,
        slug: catSlug,
        name: p.category,
        description: `Bespoke optical collection for ${p.category}`,
        display_order: store.categories.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      existingCatNames.add(p.category.toLowerCase());
      newCategoriesCount++;
    }

    // Deduplicate product
    const isDuplicate = existingIds.has(p.id) || (p.sourceUrl && existingSourceUrls.has(p.sourceUrl));
    if (!isDuplicate) {
      store.products.unshift(p);
      existingIds.add(p.id);
      if (p.sourceUrl) existingSourceUrls.add(p.sourceUrl);
      importedCount++;

      // Create variants
      if (p.colorVariants && p.colorVariants.length > 0) {
        p.colorVariants.forEach((cv, idx) => {
          store.variants.push({
            id: cv.id || `var-${p.id}-${idx}`,
            product_id: p.id,
            product_name: p.name,
            sku: cv.sku || `SKU-${p.id.toUpperCase()}-${idx + 1}`,
            color_name: cv.colorName || `Colorway ${idx + 1}`,
            color_hex: cv.colorHex || "#1A1816",
            stock_quantity: cv.available === false ? 0 : 12,
            price: cv.price || p.price,
            category: p.category,
          });
        });
      } else {
        (p.colors || ["#1A1816"]).forEach((c, idx) => {
          store.variants.push({
            id: `var-${p.id}-${idx}`,
            product_id: p.id,
            product_name: p.name,
            sku: `SKU-${p.id.toUpperCase()}-${idx + 1}`,
            color_name: idx === 0 ? "Default Color" : `Colorway ${idx + 1}`,
            color_hex: c,
            stock_quantity: 12,
            price: p.price,
            category: p.category,
          });
        });
      }
    }
  });

  saveStore(store);
  return { importedCount, newBrandsCount, newCategoriesCount };
}

export function getProductById(id: string): Product | null {
  const store = getStore();
  return store.products.find((p) => p.id === id) || null;
}

export function createProduct(productData: Partial<Product>): Product {
  const store = getStore();
  const id = `so-${Date.now()}`;
  const newProduct: Product = {
    id,
    brand: productData.brand || "GAST",
    name: productData.name || "Handcrafted Optical Frame",
    category: productData.category || "Eyeglasses",
    type: productData.type || "eyeglasses",
    shape: productData.shape || "Rectangle",
    gender: productData.gender || "unisex",
    size: productData.size || "M",
    rating: 5.0,
    price: productData.price || 1990,
    originalPrice: productData.originalPrice || 2990,
    discountPct: productData.discountPct || 33,
    tag: productData.tag || "NEW ARRIVAL",
    tagType: productData.tagType || "new",
    img: productData.img || (productData.images?.[0] || "/images/clean_frame_1.png"),
    images: productData.images || [productData.img || "/images/clean_frame_1.png"],
    colors: productData.colors || ["#1A1816", "#C5A059"],
    description: productData.description || "Precision engineered eyewear from Shivam Optical Mayur Vihar atelier.",
    material: productData.material || "Beta Titanium & Italian Acetate",
    measurements: productData.measurements || { lensWidth: 54, bridgeWidth: 17, templeLength: 142 },
    colorVariants: productData.colorVariants || [],
    sourceUrl: productData.sourceUrl || undefined,
    packageDimensions: productData.packageDimensions || {
      lengthCm: productData.type === "contact-lenses" ? 15 : 18,
      breadthCm: productData.type === "contact-lenses" ? 10 : 9,
      heightCm: productData.type === "contact-lenses" ? 4 : 7,
      weightKg: productData.type === "contact-lenses" ? 0.08 : 0.25,
    },
    contactLensSpecs: productData.contactLensSpecs || undefined,
  };

  // Add variants
  if (newProduct.colorVariants && newProduct.colorVariants.length > 0) {
    newProduct.colorVariants.forEach((cv, idx) => {
      store.variants.push({
        id: cv.id || `var-${id}-${idx}`,
        product_id: id,
        product_name: newProduct.name,
        sku: cv.sku || `SKU-${id.toUpperCase()}-${idx + 1}`,
        color_name: cv.colorName || `Colorway ${idx + 1}`,
        color_hex: cv.colorHex || "#1A1816",
        stock_quantity: cv.available === false ? 0 : 15,
        price: cv.price || newProduct.price,
        category: newProduct.category,
      });
    });
  } else {
    newProduct.colors.forEach((c, idx) => {
      store.variants.push({
        id: `var-${id}-${idx}`,
        product_id: id,
        product_name: newProduct.name,
        sku: `SKU-${id.toUpperCase()}-${idx + 1}`,
        color_name: idx === 0 ? "Default Color" : `Colorway ${idx + 1}`,
        color_hex: c,
        stock_quantity: 10,
        price: newProduct.price,
        category: newProduct.category,
      });
    });
  }

  store.products.unshift(newProduct);
  saveStore(store);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  store.products[idx] = {
    ...store.products[idx],
    ...updates,
  };

  // Synchronize variants if colorVariants provided
  if (updates.colorVariants && updates.colorVariants.length > 0) {
    store.variants = store.variants.filter((v) => v.product_id !== id);
    updates.colorVariants.forEach((cv, vIdx) => {
      store.variants.push({
        id: cv.id || `var-${id}-${vIdx}`,
        product_id: id,
        product_name: store.products[idx].name,
        sku: cv.sku || `SKU-${id.toUpperCase()}-${vIdx + 1}`,
        color_name: cv.colorName || `Colorway ${vIdx + 1}`,
        color_hex: cv.colorHex || "#1A1816",
        stock_quantity: cv.available === false ? 0 : 15,
        price: cv.price || store.products[idx].price,
        category: store.products[idx].category,
      });
    });
  }

  saveStore(store);
  return store.products[idx];
}

export function deleteProduct(id: string): boolean {
  const store = getStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;

  store.products.splice(idx, 1);
  store.variants = store.variants.filter((v) => v.product_id !== id);
  saveStore(store);
  return true;
}

// ================= INVENTORY ENGINE =================
export function getInventory(filters: { search?: string; filter?: string }) {
  const store = getStore();
  let list = [...store.variants];

  if (filters.filter === "low") {
    list = list.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= 5);
  } else if (filters.filter === "out") {
    list = list.filter((v) => v.stock_quantity === 0);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((v) => v.product_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
  }

  const stats = {
    totalSkus: store.variants.length,
    totalUnits: store.variants.reduce((sum, v) => sum + v.stock_quantity, 0),
    lowStockCount: store.variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= 5).length,
    outOfStockCount: store.variants.filter((v) => v.stock_quantity === 0).length,
  };

  return { inventory: list, stats };
}

export function updateStock(variantId: string, delta: number): StoredVariant | null {
  const store = getStore();
  const variant = store.variants.find((v) => v.id === variantId || v.sku === variantId);
  if (!variant) return null;

  variant.stock_quantity = Math.max(0, variant.stock_quantity + delta);
  saveStore(store);
  return variant;
}

// ================= CUSTOMERS ENGINE =================
export function getCustomers(search?: string) {
  const store = getStore();
  const map = new Map<string, any>();

  // Aggregate from orders
  store.orders.forEach((o) => {
    const key = o.guest_email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: `cust-${key.replace(/[^a-z0-9]/g, "")}`,
        full_name: o.shipping_address?.fullName || o.guest_name || "Valued Patron",
        email: o.guest_email,
        phone: o.guest_phone || o.shipping_address?.phone,
        total_orders: 0,
        total_spend: 0,
        city: o.shipping_address?.city || "Delhi",
        state: o.shipping_address?.state || "Delhi",
        last_order_date: o.created_at,
        recent_orders: [],
      });
    }

    const c = map.get(key);
    c.total_orders += 1;
    c.total_spend += o.total_amount;
    c.recent_orders.push({
      id: o.id,
      order_number: o.order_number,
      total_amount: o.total_amount,
      status: o.status,
      created_at: o.created_at,
    });
  });

  let customersList = Array.from(map.values());

  if (search) {
    const q = search.toLowerCase();
    customersList = customersList.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }

  const cumulativeLtv = customersList.reduce((sum, c) => sum + c.total_spend, 0);
  const avgOrderValue = customersList.length > 0 ? Math.round(cumulativeLtv / customersList.length) : 0;

  return {
    customers: customersList,
    stats: {
      totalCustomers: customersList.length,
      cumulativeLtv,
      avgOrderValue,
    },
  };
}

// ================= APPOINTMENTS ENGINE =================
export function getAppointments() {
  const store = getStore();
  return store.appointments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createAppointment(data: Partial<StoredAppointment>): StoredAppointment {
  const store = getStore();
  const newApt: StoredAppointment = {
    id: `apt-${Date.now()}`,
    name: data.name || "Patron",
    phone: data.phone || "09779990207",
    email: data.email || "",
    date: data.date || new Date().toISOString().split("T")[0],
    time: data.time || "11:00 AM",
    service: data.service || "Comprehensive Computerized Eye Test",
    status: "pending",
    notes: data.notes || "",
    created_at: new Date().toISOString(),
  };

  store.appointments.unshift(newApt);
  saveStore(store);

  // Asynchronous sync to live Supabase PostgreSQL
  try {
    query(
      `INSERT INTO public.appointments (
         booking_reference, patient_name, patient_phone, patient_email,
         service, appointment_date, time_slot, status, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (booking_reference) DO NOTHING`,
      [
        newApt.id,
        newApt.name,
        newApt.phone,
        newApt.email || null,
        newApt.service,
        newApt.date,
        newApt.time,
        newApt.status,
        newApt.notes || null,
      ]
    ).catch((e: any) => console.warn("[adminDb] Supabase appointment sync non-fatal warning:", e.message));
  } catch {}

  return newApt;
}

export function updateAppointmentStatus(id: string, status: StoredAppointment["status"]): boolean {
  const store = getStore();
  const apt = store.appointments.find((a) => a.id === id);
  if (!apt) return false;

  apt.status = status;
  saveStore(store);
  return true;
}

// ================= COUPONS ENGINE =================
export function getCoupons() {
  const store = getStore();
  return store.coupons;
}

export function createCoupon(data: Partial<StoredCoupon>): StoredCoupon {
  const store = getStore();
  const newCoupon: StoredCoupon = {
    id: `cpn-${Date.now()}`,
    code: (data.code || "SAVE10").toUpperCase(),
    discount_type: data.discount_type || "percentage",
    discount_value: data.discount_value || 10,
    min_order_value: data.min_order_value || 1000,
    max_discount: data.max_discount || null,
    usage_limit: data.usage_limit || 500,
    times_used: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.coupons.unshift(newCoupon);
  saveStore(store);
  return newCoupon;
}

export function toggleCoupon(id: string, isActive: boolean): boolean {
  const store = getStore();
  const c = store.coupons.find((x) => x.id === id);
  if (!c) return false;
  c.is_active = isActive;
  saveStore(store);
  return true;
}

export function deleteCoupon(id: string): boolean {
  const store = getStore();
  const idx = store.coupons.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  store.coupons.splice(idx, 1);
  saveStore(store);
  return true;
}

// ================= CATEGORIES ENGINE =================
export function getCategories(): StoredCategory[] {
  const store = getStore();
  const categories = store.categories || [];
  return categories.map((c) => {
    const count = (store.products || []).filter(
      (p) => (p.category || "").trim().toLowerCase() === (c.name || "").trim().toLowerCase()
    ).length;
    return {
      ...c,
      product_count: count,
      is_active: c.is_active ?? true,
      display_order: c.display_order ?? 1,
    };
  });
}

export function createCategory(data: any): StoredCategory {
  const store = getStore();
  if (!store.categories) store.categories = [];
  const slug = data.slug || (data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newCat: StoredCategory = {
    id: data.id || `cat-${Date.now()}`,
    slug,
    name: data.name || "New Category",
    description: data.description || "",
    display_order: Number(data.display_order ?? data.displayOrder ?? (store.categories.length + 1)),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : (data.isActive !== undefined ? Boolean(data.isActive) : true),
    created_at: new Date().toISOString(),
  };
  store.categories.push(newCat);
  saveStore(store);
  return newCat;
}

export function updateCategory(id: string, data: any): StoredCategory | null {
  const store = getStore();
  if (!store.categories) return null;
  const cat = store.categories.find((c) => c.id === id);
  if (!cat) return null;
  if (data.name !== undefined) cat.name = data.name.trim();
  if (data.slug !== undefined) cat.slug = data.slug.trim();
  if (data.description !== undefined) cat.description = data.description.trim();
  if (data.display_order !== undefined || data.displayOrder !== undefined) {
    cat.display_order = Number(data.display_order ?? data.displayOrder);
  }
  if (data.is_active !== undefined || data.isActive !== undefined) {
    cat.is_active = Boolean(data.is_active ?? data.isActive);
  }
  saveStore(store);
  return cat;
}

export function deleteCategory(id: string): boolean {
  const store = getStore();
  if (!store.categories) return false;
  const idx = store.categories.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.categories.splice(idx, 1);
  saveStore(store);
  return true;
}

// ================= BRANDS ENGINE =================
export function getBrands(): StoredBrand[] {
  const store = getStore();
  const brands = store.brands || [];
  return brands.map((b) => {
    const count = (store.products || []).filter(
      (p) => (p.brand || "").trim().toLowerCase() === (b.name || "").trim().toLowerCase()
    ).length;
    return {
      ...b,
      product_count: count,
      is_featured: Boolean(b.is_featured),
      is_active: b.is_active ?? true,
    };
  });
}

export function createBrand(data: any): StoredBrand {
  const store = getStore();
  if (!store.brands) store.brands = [];
  const slug = data.slug || (data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newBrand: StoredBrand = {
    id: data.id || `brd-${Date.now()}`,
    slug,
    name: data.name || "New Brand",
    origin: data.origin || "International",
    tagline: data.tagline || "",
    description: data.description || "",
    is_featured: Boolean(data.is_featured ?? data.isFeatured ?? false),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : (data.isActive !== undefined ? Boolean(data.isActive) : true),
    created_at: new Date().toISOString(),
  };
  store.brands.push(newBrand);
  saveStore(store);
  return newBrand;
}

export function updateBrand(id: string, data: any): StoredBrand | null {
  const store = getStore();
  if (!store.brands) return null;
  const brand = store.brands.find((b) => b.id === id);
  if (!brand) return null;
  if (data.name !== undefined) brand.name = data.name.trim();
  if (data.slug !== undefined) brand.slug = data.slug.trim();
  if (data.origin !== undefined) brand.origin = data.origin.trim();
  if (data.tagline !== undefined) brand.tagline = data.tagline.trim();
  if (data.description !== undefined) brand.description = data.description.trim();
  if (data.is_featured !== undefined || data.isFeatured !== undefined) {
    brand.is_featured = Boolean(data.is_featured ?? data.isFeatured);
  }
  if (data.is_active !== undefined || data.isActive !== undefined) {
    brand.is_active = Boolean(data.is_active ?? data.isActive);
  }
  saveStore(store);
  return brand;
}

export function deleteBrand(id: string): boolean {
  const store = getStore();
  if (!store.brands) return false;
  const idx = store.brands.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  store.brands.splice(idx, 1);
  saveStore(store);
  return true;
}

// ================= SETTINGS ENGINE =================
export function getSettings(key?: string) {
  const store = getStore();
  if (!key) return store.settings;
  return store.settings[key] || null;
}

export function updateSettings(key: string, value: any): boolean {
  const store = getStore();
  store.settings[key] = {
    ...(store.settings[key] || {}),
    ...value,
  };
  saveStore(store);
  return true;
}

// ================= DASHBOARD METRICS =================
export function getDashboardMetrics(range: string = "7d") {
  const store = getStore();
  const allOrders = store.orders || [];

  const now = new Date();
  const nowMs = now.getTime();

  // Filter orders by timeframe
  let filteredOrders = allOrders;
  let periodDays = 7;

  if (range === "today") {
    const todayStr = now.toISOString().split("T")[0];
    filteredOrders = allOrders.filter(
      (o) => new Date(o.created_at).toISOString().split("T")[0] === todayStr
    );
    periodDays = 1;
  } else if (range === "7d") {
    const cutoff = nowMs - 7 * 86400000;
    filteredOrders = allOrders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
    periodDays = 7;
  } else if (range === "30d") {
    const cutoff = nowMs - 30 * 86400000;
    filteredOrders = allOrders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
    periodDays = 30;
  } else if (range === "this_month") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    filteredOrders = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    periodDays = now.getDate();
  } else {
    // "all"
    filteredOrders = allOrders;
    periodDays = 7;
  }

  // Active revenue (non-cancelled)
  const totalRevenue = filteredOrders.reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + o.total_amount : sum),
    0
  );
  const totalOrders = filteredOrders.length;
  const uniquePatrons = new Set(filteredOrders.map((o) => o.guest_email.toLowerCase())).size;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Real status counts from all orders
  const statusCounts = {
    confirmed: allOrders.filter((o) => o.status === "confirmed").length,
    optician_assembly: allOrders.filter((o) => o.status === "optician_assembly").length,
    quality_check: allOrders.filter((o) => o.status === "quality_check").length,
    dispatched: allOrders.filter((o) => o.status === "dispatched").length,
    delivered: allOrders.filter((o) => o.status === "delivered").length,
  };

  const lowStock = store.variants
    .filter((v) => v.stock_quantity <= 5)
    .map((v) => ({
      id: v.id,
      product_name: v.product_name,
      color_name: v.color_name,
      sku: v.sku,
      stock_quantity: v.stock_quantity,
    }));

  const recentOrders = allOrders.slice(0, 6);

  // Real Sales History over 7 day intervals
  const salesHistory: Array<{ label: string; date: string; revenue: number; orders: number }> = [];
  const daysCount = range === "30d" ? 14 : 7;
  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(nowMs - i * 86400000);
    const dateStr = targetDate.toISOString().split("T")[0];
    const dayLabel = targetDate.toLocaleDateString("en-IN", {
      weekday: "short",
      ...(range === "30d" ? { day: "numeric", month: "short" } : {}),
    });

    const dayOrders = allOrders.filter(
      (o) =>
        o.status !== "cancelled" &&
        new Date(o.created_at).toISOString().split("T")[0] === dateStr
    );
    const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total_amount, 0);

    salesHistory.push({
      label: dayLabel,
      date: dateStr,
      revenue: dayRevenue,
      orders: dayOrders.length,
    });
  }

  // Real Top Products from orders
  const productSalesMap = new Map<string, { unitsSold: number; revenue: number }>();
  allOrders.forEach((o) => {
    if (o.status !== "cancelled") {
      o.items?.forEach((item) => {
        const prev = productSalesMap.get(item.product_id) || { unitsSold: 0, revenue: 0 };
        productSalesMap.set(item.product_id, {
          unitsSold: prev.unitsSold + (item.quantity || 1),
          revenue: prev.revenue + (item.total_price || item.unit_price * (item.quantity || 1)),
        });
      });
    }
  });

  let topProducts = Array.from(productSalesMap.entries())
    .map(([productId, sales]) => {
      const prod = store.products.find((p) => p.id === productId);
      return {
        id: productId,
        name: prod?.name || "Optical Frame",
        brand: prod?.brand || "GAST",
        price: prod?.price || 1490,
        img: prod?.img || "/images/clean_frame_1.png",
        unitsSold: sales.unitsSold,
        revenue: sales.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (topProducts.length === 0) {
    topProducts = store.products.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      img: p.img,
      unitsSold: 0,
      revenue: 0,
    }));
  }

  // Real Growth Calculation vs Prior Period
  const periodMs = periodDays * 86400000;
  const currentPeriodStart = nowMs - periodMs;
  const priorPeriodStart = nowMs - 2 * periodMs;

  const currentPeriodOrders = allOrders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= currentPeriodStart;
  });
  const priorPeriodOrders = allOrders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= priorPeriodStart && t < currentPeriodStart;
  });

  const currRev = currentPeriodOrders.reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + o.total_amount : sum),
    0
  );
  const priorRev = priorPeriodOrders.reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + o.total_amount : sum),
    0
  );

  const calcGrowth = (curr: number, prev: number): string => {
    if (prev === 0) {
      return curr > 0 ? "+100%" : "0.0%";
    }
    const pct = ((curr - prev) / prev) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  };

  const currCustomers = new Set(currentPeriodOrders.map((o) => o.guest_email.toLowerCase())).size;
  const priorCustomers = new Set(priorPeriodOrders.map((o) => o.guest_email.toLowerCase())).size;

  const currAov = currentPeriodOrders.length > 0 ? Math.round(currRev / currentPeriodOrders.length) : 0;
  const priorAov = priorPeriodOrders.length > 0 ? Math.round(priorRev / priorPeriodOrders.length) : 0;

  const growth = {
    revenue: calcGrowth(currRev, priorRev),
    orders: calcGrowth(currentPeriodOrders.length, priorPeriodOrders.length),
    customers: calcGrowth(currCustomers, priorCustomers),
    aov: calcGrowth(currAov, priorAov),
  };

  return {
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      totalCustomers: uniquePatrons,
      avgOrderValue,
      growth,
    },
    statusCounts,
    lowStock,
    recentOrders,
    salesHistory,
    topProducts,
  };
}
