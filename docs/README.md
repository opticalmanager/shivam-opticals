# Shivam Optical — Technical Architecture & Engineering Documentation

Welcome to the **Shivam Optical** engineering and architecture manual. This directory houses authoritative, validated architectural blueprints, security protocols, payment processing guides, and clinical optometry workflows.

This documentation serves as:
1. **The Single Source of Truth for AI Agents**: Preventing hallucinations, accidental code regressions, and credential mishandling.
2. **Industrial Learning & Blueprint Material**: Reusable, hardened patterns for architecting luxury and healthcare e-commerce applications.

---

## Documentation Library Index

| Document | Primary Topics & Standard Specifications |
|---|---|
| **[1. Security Architecture & Threat Defense](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/security_architecture_and_defense.md)** | Zero-Secret-in-DB policy, SQL injection prevention via `$1, $2` parameterized queries, timing-safe cryptographic comparisons (`crypto.timingSafeEqual`), and Phone OTP security. |
| **[2. Razorpay Payment Gateway Mastery](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/razorpay_payment_integration_mastery.md)** | Live Razorpay integration (`rzp_live_Tn3v56njBS0cGX`), Option 2 zero-ghost-order lifecycle, unified tracking ID across checkout and gateway, integer paise math, and webhook setup. |
| **[3. System Architecture Blueprint](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/ecommerce_architecture_blueprint.md)** | Dual data tier pattern (direct `pg.Pool` ACID transactions + Supabase client RLS), Next.js App Router conventions, `<Suspense>` search parameter boundaries, and universal `admin_settings`. |
| **[4. Order Lifecycle & Lab Assembly](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/order_lifecycle_and_lab_assembly.md)** | 5-Stage optical assembly pipeline (`Confirmed` → `In Lab Assembly` → `Quality Check` → `Dispatched` → `Delivered`), OD/OS clinical Rx data, printable GST tax invoices (HSN `9003` / `9001`), and Shiprocket tracking. |
| **[5. Catalog Variants & 3D Virtual Try-On](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/catalog_variants_and_tryon.md)** | Multi-color variant SKU matrix (1:N), Cloudflare R2 high-res image streaming, and client-side 3D try-on with MediaPipe 478 face landmarks and Three.js. |
| **[6. Dayal Eyewear Scraper Guide](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/dayal_scraper_guide.md)** | High-throughput catalog ingestion, media downloading, and variant normalization pipeline. |
| **[7. Supabase Email Templates Suite](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/supabase_email_templates.md)** | Responsive HTML email templates for patron registration, email verification, password reset, and invites. |
| **[8. Storefront UX & Copywriting Standards](file:///c:/Users/Gaurav/Desktop/shivam-optics/docs/storefront_ux_and_copywriting_standards.md)** | Translation of developer/infrastructure jargon into industry-standard luxury e-commerce copy, clean trust signals, and zero-emoji UI standards. |

---

## Rule of Maintenance for Developers & AI Agents
Whenever a new feature, database migration, or external API integration is introduced, the corresponding file in this `docs/` folder **must be updated immediately** to preserve system alignment and prevent drift.
