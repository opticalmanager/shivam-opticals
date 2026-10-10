# Shivam Optics — Agent & Developer Operating Manual (AGENTS.md)

Welcome to the **Shivam Optics** codebase. This document is the authoritative, binding source of truth for architectural conventions, visual standards, cross-project inheritance rules, security guidelines, and development execution protocols.

All AI agents and developers working on this repository **must strictly adhere** to every rule outlined in this manual. Never hallucinate, never guess, and never deviate from these instructions.

---

## 1. Core Architectural Mental Model & Project Purpose

**Shivam Optics** is a premier luxury optical atelier and clinical eyewear e-commerce platform. The system operates across two deeply integrated environments:

1. **Luxury Customer Storefront (`/`, `/products`, `/product/[id]`, `/cart`, `/checkout`, etc.)**:
   - Unique atelier brand identity, custom homepage showcase, and bespoke navigation.
   - Interactive clinical lens customizer (OD/OS prescription inputs: Sphere, Cylinder, Axis, Add, Pupillary Distance, and single-vision, bifocal, progressive, and blue-light/Zeiss lens packages).
   - Real-time WebAssembly + WebGL 3D Virtual Try-On (MediaPipe 478 face landmarks + Three.js).
   - Real-time pincode serviceability and delivery date estimator.
   - Persistent Cart Drawer, Wishlist Drawer, and verified Phone OTP patron authentication.
2. **Enterprise Admin Operating System (`/admin`, `/admin/orders`, `/admin/products`, `/admin/settings`, etc.)**:
   - High-density executive command center.
   - 5-stage optical laboratory assembly queue:
     `Confirmed` → `In Lab Assembly` → `Quality Check` → `Dispatched` → `Delivered`.
   - Comprehensive customer optical prescription viewer (OD/OS values + doctor Rx attachment).
   - Printable GST tax invoices formatted with `@media print` using optical HSN codes (`9003` for spectacle frames, `9001` for ophthalmic lenses).
   - SKU-level variant stock & color matrix, Cloudflare R2 image synchronization, and universal atomic settings store (`public.admin_settings`).

---

## 2. Inviolable Cross-Project Inheritance & Boundary Rules

### 2.1. Strict Inviolability of Shivam Optics Brand & Front Door
- **NEVER** overwrite, replace, or destroy Shivam Optics' Homepage (`app/page.tsx`, `components/home/*`).
- **NEVER** overwrite or replace Shivam Optics' Header/Navbar (`components/layout/Header.tsx`) or Footer (`components/layout/Footer.tsx`) with Precision Optics' header/footer. Shivam Optics retains its own unique header and navigation bar; you may only attach trigger handlers (e.g. `openCart`, `openWishlist`, `openLoginModal`, `openTrackingModal`, `openSearchModal`).
- **NEVER** overwrite Shivam Optics' brand legal pages (Terms & Conditions, Privacy Policy, Brand Story).
- **Brand Name Rule**: The brand name is strictly **Shivam Optics** across all customer-facing copy, invoices, emails, SMS alerts, and meta titles. Never use "Precision Optics" or "Precision Opticals" in user-facing content.
- **Storage Namespace**: Client localStorage keys must strictly use the prefix `shivam_optics_*` (e.g., `shivam_optics_cart_v1`, `shivam_optics_wishlist_v1`, `shivam_optics_orders_v1`, `shivam_optics_patron_v1`).

### 2.2. Supabase & Database Inviolability (STRICTEST RULE)
- **ABSOLUTE RULE**: Shivam Optics **HAS ITS OWN SUPABASE AND POSTGRESQL INSTANCE**.
- **NEVER** copy, inject, or reference Precision Optics' database credentials, Supabase URL, or anon key into this project.
- **Shivam Optics Supabase Credentials (Active in `.env.local`)**:
  - `NEXT_PUBLIC_SUPABASE_URL`: `https://tbyldbrrqhfthrhjiwdv.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_q-0-VHwov62gVUU_st2u2g_cIr7PQJW`
  - `DATABASE_URL`: `postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
  - `DATABASE_DIRECT_URL`: `postgresql://postgres:Shivamoptics%402026@db.tbyldbrrqhfthrhjiwdv.supabase.co:5432/postgres`
- All schema migrations, queries, and tables must run strictly against Shivam Optics' PostgreSQL database.

### 2.3. Third-Party Integrations Policy
1. **Cloudflare R2 Object Storage**:
   - Shivam Optics will provision its own dedicated R2 bucket in the future.
   - For now, use the temporary shared Cloudflare R2 credentials from Precision Optics for asset streaming (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_TOKEN_VALUE`, `NEXT_PUBLIC_R2_PUBLIC_URL`).
   - Storefront media uploads must fall back gracefully to local public directory if R2 is unavailable.
2. **Shiprocket Logistics**:
   - Use the provided Shiprocket logistics credentials (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`).
   - **Unique Webhook Rule**: Shivam Optics must have its own unique webhook listener endpoint:
     `https://<shivam-domain>/api/webhooks/shiprocket` (or dynamic local equivalent `/api/webhooks/shiprocket`).
     - Webhook Secret: `shivam_shiprocket_sec_2026`.
   - Pickup location configuration must identify as Shivam Optics Atelier.
3. **Razorpay Payment Gateway**:
   - Shivam Optics has its own Razorpay credentials configured in `.env.local` (`rzp_test_TfX2gVZqD6Ern5`).
   - Payment order creation (`/api/razorpay/create-order`) and verification (`/api/razorpay/verify-payment`) must use Shivam Optics' keys and secret (`shivam_optics_webhook_secret_2026`).
4. **Fast2SMS / WhatsApp CRM**:
   - Port the SMS client (`lib/smsClient.ts`) and WhatsApp client (`lib/wacrmClient.ts`) to deliver automated OTP verification, order confirmations, and dispatch tracking notifications.

---

## 3. UI Design System & Brand Token Translation

When copying or porting components from Precision Optics, **ALWAYS translate the color palette to Shivam Optics’ brand tokens**. Never leave Precision Optics' signature orange (`#C86A28` / `#EA580C`) or espresso (`#2A1E17`) in Shivam Optics.

### 3.1. Luxury Token Translation Matrix

| Precision Optics Token | Shivam Optics Equivalent Token | Hex Code | Purpose / Application |
|---|---|---|---|
| **Brand Orange (`#C86A28` / `#EA580C`)** | **Atelier Gold (`var(--color-brand-gold)`)** | `#C5A059` | Primary CTA buttons, badges, highlights, focus rings |
| **Orange Hover (`#A8551E`)** | **Gold Hover (`var(--color-brand-goldHover)`)** | `#B08B45` | Button hover and active states |
| **Dark Espresso (`#2A1E17`)** | **Atelier Charcoal (`var(--color-brand-charcoal)`)** | `#2D2926` / `#1A1816` | Main dark headings, dark cards, footer background |
| **Accent Espresso (`#3D2E24`)** | **Heritage Forest Green (`var(--color-brand-green)`)** | `#0A251C` | Premium luxury accents, deep badges, banner highlights |
| **Canvas Cream (`#FAF7F2`)** | **Brand Cream (`var(--color-brand-cream)`)** | `#FBF9F5` / `#FCFAF7` | Main page background |
| **Light Cream (`#FAF3EB`)** | **Brand Sand (`var(--color-brand-sand)`)** | `#F4EFEA` / `#FAF3EB` | Section backdrops, sub-headers, pill backgrounds |
| **Border Neutral (`#E8DCCF`)** | **Soft Warm Border (`var(--color-brand-border)`)** | `#E8E2D9` / `#E8DEC8` | Card dividers, hairline outlines, table borders |
| **Muted Text (`#6B5E55`)** | **Atelier Muted (`var(--color-brand-muted)`)** | `#716B64` | Subtitles, helper text, breadcrumbs |

### 3.2. Typography Standards
- **Headings & Serif Displays**: Cormorant Garamond (`font-serif`, `var(--font-serif)`).
- **Body & Controls**: Jost / Montserrat (`font-sans`, `var(--font-sans)`).

### 3.3. Strict Zero Unicode Emojis Policy
- **Absolute Rule**: **NEVER** use unicode emojis anywhere in UI text, headings, badges, buttons, tooltips, placeholders, or toast notifications (strictly NO emojis like 👓, ⚡, 🏷️, ★, ✔, ❤️, 🚀, 📦, etc.).
- **Approved Icon Library**: Always use **Lucide Icons** (`lucide-react`) or clean inline SVGs:
  - Wishlist: `<Heart className="..." />`
  - Offers / Discounts: `<Zap className="..." />` or `<Tag className="..." />`
  - Ratings: `<Star className="fill-[#C5A059] text-[#C5A059] ..." />`
  - Filters: `<SlidersHorizontal className="..." />` or `<ChevronDown className="..." />`
  - Reset / Clear: `<RotateCcw className="..." />` or `<X className="..." />`
  - Lab Assembly: `<FlaskConical className="..." />` or `<Clock className="..." />`

### 3.4. Viewport Geometry & Container Widths (No Over-Stretching)
- **PLP Catalog Grid**: `max-w-[1440px]` or `max-w-[1480px]` with `mx-auto px-4 sm:px-6 lg:px-8`.
- **Content Sections**: `max-w-[1280px]` or `max-w-7xl` with `mx-auto px-4 sm:px-6 lg:px-8`.
- **Admin Command Center**: `max-w-[1400px]` with `mx-auto px-4 sm:px-6 lg:px-8`.
- **Product Cards**: Maintain strict aspect ratios (`aspect-[4/3]` or `aspect-square`). Never distort eyewear photography.

---

## 4. Client Routing & Next.js App Router Rules

### 4.1. Navigation Rule (No Raw `<a>` for Internal Links)
- **Always** use `Link` from `next/link` for internal page navigation (e.g. `<Link href="/admin/orders">`).
- **Never** use raw HTML `<a>` tags for internal routes to avoid hard browser reloads, FOUC, and context state clearing.

### 4.2. Next.js Static Prerender & `<Suspense>` Boundaries
- Any component or page consuming URL query parameters via `useSearchParams()` **must** be wrapped in a `<Suspense fallback={<LoadingSpinner />}>` boundary to prevent Next.js build-time prerender failures.

---

## 5. Dual Data Layer & Backend Standards

### 5.1. Dual Data Access Pattern
1. **Direct PostgreSQL Server Layer (`lib/db.ts` / `lib/adminDb.ts`)**:
   - Direct `pg.Pool` connection using `DATABASE_URL`.
   - Used inside `/api/admin/*` and customer transaction handlers (`/api/orders`, `/api/razorpay/*`).
   - Full ACID transaction support (`BEGIN`, `COMMIT`, `ROLLBACK`).
2. **Client / Edge Supabase Layer (`lib/supabase.ts`)**:
   - Initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Manages client authentication session tokens, realtime channels, and RLS queries.

### 5.2. Universal Admin Settings Storage
- All system configurations are stored centrally in the `public.admin_settings` table:
  `key TEXT PRIMARY KEY`, `value JSONB NOT NULL`, `updated_at TIMESTAMPTZ`.
- Standard keys: `general`, `payments`, `shipping`, `content`, `loyalty`, `roles`.
- Read and update through `/api/admin/settings` to guarantee transactional integrity.

---

## 6. Coding, TypeScript & Form Standards

1. **Strict Type Safety**: Enable strict typing across all files. Shared domain models live in `types/` (`types/index.ts`, `types/db.ts`, `types/tryOn.ts`). Never use `any` when explicit domain types can be modeled.
2. **Form Validation**: Use `react-hook-form` paired with `zod` schemas and `@hookform/resolvers/zod`.
3. **Optimized Renders**: Memoize filter matrices, price calculations, and table sorters with `useMemo` and `useCallback`.
4. **Documentation Integrity**: Retain all helpful code comments, docstrings, and architectural rationale.

---

## 7. Step-by-Step Implementation Flow Checklist

When executing tasks across phases, follow this strict sequential order:

- [ ] **Phase 1**: Dependencies (`package.json`), Database Migrations (`01` through `06`), Shared Types (`types/`), and foundational `lib/` utilities.
- [ ] **Phase 2**: Patron Authentication System (Phone OTP `/api/auth/send-otp`, `/api/auth/verify-otp`, `AuthContext`, `AuthModal`, Saved Prescriptions & Addresses).
- [ ] **Phase 3**: Cart Engine, Wishlist & Clinical Lens Customizer (`CartContext`, `WishlistContext`, `LensCustomizerModal`, `CartDrawer`, `/cart` page).
- [ ] **Phase 4**: Catalog PLP (`/products`) & Product Detail PDP (`/product/[id]`, filter rail, 3D Virtual Try-On, Pincode Estimator).
- [ ] **Phase 5**: Production Checkout, Razorpay Integration & Shiprocket Logistics (`UnifiedCheckoutForm`, `/api/razorpay/*`, `/api/shipping/*`, order confirmation).
- [ ] **Phase 6**: Enterprise Admin Operating System (`/admin/*`, 5-stage Lab queue, GST tax invoices, Product & Variant manager, Universal Settings).
- [ ] **Phase 7**: Quality Assurance, Next.js build validation, and end-to-end user journey verification.
