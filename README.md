# Shivam Optical — Luxury Eyewear Atelier & Clinical Web App

A premier luxury optical atelier and clinical eyewear e-commerce platform built for **Shivam Optical**, located at Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Phase 1 Extension, New Delhi - 110091.

---

## ✨ Features & Architecture

### 1. Luxury Customer Storefront
* **Brand Aesthetic**: Bespoke Haute Lunetterie aesthetic with Atelier Gold (`#C5A059`), Atelier Charcoal (`#1A1816`), and Heritage Green (`#0A251C`) design tokens.
* **Filterable Optical & Sun Catalog**: Real-time filtering by silhouette shape (Aviator, Rectangle, Round, Cat-Eye, Geometric, Wayfarer, etc.), material, brand, and gender with responsive drawer filters.
* **3-View Showcase & 3D Virtual Try-On**: Real-time WebAssembly + WebGL 3D face landmark tracking (MediaPipe + Three.js).
* **Clinical Lens Customizer**: Comprehensive prescription customization (OD/OS Sphere, Cylinder, Axis, Add, Pupillary Distance) with Single Vision, Digital HD Progressive, and Zero Power Screen Guard packages.
* **Cart & Wishlist Engine**: Sliding drawer cart with live subtotal calculations, free insured delivery meter, and persistent wishlist.
* **Online Booking**: Clinical eye exam consultation booking for the Mayur Vihar boutique clinic.

### 2. Dual Data Layer & Backend
* **Supabase & PostgreSQL**: Live relational database with ACID transactions, Row-Level Security (RLS) policies, and connection pooler support.
* **Razorpay Payment Gateway**: Seamless checkout with UPI, Card, and Netbanking support.
* **Admin OS & Lab Assembly Queue**: High-density command center with a 5-stage optical laboratory assembly queue (`Confirmed` → `In Lab Assembly` → `Quality Check` → `Dispatched` → `Delivered`), printable GST tax invoices (HSN 9003 / 9001), and inventory management.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router, Turbopack)
* **UI & Components**: React 19, Tailwind CSS, Lucide Icons, Framer Motion
* **Database & Auth**: PostgreSQL 17, Supabase JS Client
* **Payments**: Razorpay
* **Type Safety**: TypeScript 5

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18+ or 20+
* npm or pnpm

### 2. Installation
```bash
git clone https://github.com/opticalmanager/shivam-opticals.git
cd shivam-opticals
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and populate your credentials:
```bash
cp .env.example .env.local
```

### 4. Database Migrations & Seeding
```bash
# Run PostgreSQL / Supabase migrations
npm run db:migrate

# Seed categories, brands, lens packages & catalog
npm run db:seed
```

### 5. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
npm start
```

---

## 📍 Store Information
* **Boutique Atelier**: Shop No-1, Kanishka Complex, SAMACHAR Market, Mayur Vihar Phase I Extension, New Delhi - 110091
* **Contact Phone**: 097799 90207
* **Hours**: Monday – Sunday • 10:30 AM – 9:00 PM
