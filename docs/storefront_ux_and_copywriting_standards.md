# Storefront UX & Copywriting Standards — Industrial E-Commerce Blueprint

## 1. Executive Summary & Design Principle

Customer trust in luxury and clinical e-commerce is built upon **clarity, simplicity, and reassuring professionalism** — not technical boasts or internal developer jargon. 

A frequent anti-pattern in developer-built stores is leaking infrastructure implementation details (such as SSL encryption ciphers, database terminology, internal tax HSN codes, or courier API service names) into customer-facing interfaces. This creates visual clutter, introduces cognitive friction, and reduces checkout conversion rates.

This document outlines the **authoritative standards for customer-facing copywriting and trust signaling** across Shivam Optical and serves as an architectural blueprint for future e-commerce projects.

---

## 2. Storefront Vocabulary Translation Matrix

| Developer / Internal Jargon (Avoid on Customer UI) | Industry-Standard Customer Copy (Recommended) | Rationale & User Impact |
|---|---|---|
| `256-bit SSL Encrypted`, `256-bit Bank Grade Encryption` | `100% Safe & Secure Payment`, `100% Secure Checkout` | Customers find "256-bit SSL" outdated and geeky; modern shoppers look for clean, reassuring trust marks like "100% Safe & Secure". |
| `SECURE CHECKOUT PIPELINE` | `SECURE CHECKOUT`, `Order Details` | "Pipeline" is engineering jargon. Shoppers understand "Checkout" or "Order Details". |
| `Shiprocket Standard Surface`, `Shiprocket Priority Air Express` | `Standard Delivery`, `Express Delivery` | Couriers and logistics partners are backend aggregators. Shoppers expect clean service levels with clear delivery windows. |
| `Shiprocket Verified` | `Tracked Delivery`, `Reliable Delivery` | Reassures the customer that their package is tracked without exposing courier platform names. |
| `Razorpay Official Gateway`, `OFFICIAL INTEGRATION` | `Online Payment (UPI, Cards, NetBanking)`, `RECOMMENDED` | Customers want to see their payment options (Google Pay, PhonePe, Cards) rather than the payment gateway brand name. |
| `Launching Razorpay Secure Window...` | `Opening Payment Window...` | Plain English explaining the upcoming browser action. |
| `Pay Securely via Razorpay (₹X,XXX)` | `Complete Payment (₹X,XXX)` | Simple, decisive CTA button copy. |
| `Includes 18% GST (HSN 9003 & 9001)` | `Inclusive of all taxes` | HSN codes belong on legal tax invoices, not in customer cart or checkout breakdowns. |
| `Optical HSN Code: 9003` (on PDP spec table) | `Authenticity: 100% Certified Original` | Replaces a tax accounting code with a valuable customer purchase incentive. |
| `Patron Identification`, `Guest Patron` | `Account Details`, `Guest Checkout` | "Patron Identification" sounds bureaucratic; "Account Details" is universal and clear. |
| `Select Saved Destination` | `Saved Addresses` | Standard e-commerce nomenclature used by Amazon, Apple, and Myntra. |
| `Privilege Voucher`, `Privilege Discount` | `Coupon Code`, `Coupon Discount` | Clear and instantly recognized by deal-seeking shoppers. |
| `Mayur Vihar Optical Lab Assembly Queue` | `Order Crafting & Delivery Status` | Translates an internal production queue into an engaging, customer-centric status tracker. |
| `Mayur Vihar optical lens grinding` | `Precision lens fitting & finishing` | "Lens grinding" sounds abrasive and industrial; "lens fitting & finishing" sounds artisanal and high-quality. |
| `Retrieving orders from atelier ledger...` | `Loading your orders...` | Avoids confusing financial/database terms in UI loading states. |

---

## 3. Trust Signal Architecture & Placement Rules

### 3.1. Checkout Sidebar Security Strip
The checkout sidebar should display a minimal, elegant 3-item assurance strip:
1. `<ShieldCheck />` **Free & Insured Doorstep Delivery**
2. `<Lock />` **100% Safe & Secure Payment**
3. `<CheckCircle2 />` **100% Certified Authentic Eyewear**

### 3.2. Form Validation & Payment Feedback
- **Never display raw exception messages** or cryptographic errors (`HMAC verification failed`, `pg_query_params error`) to the user.
- **Friendly Toast Copy**:
  - Instead of: `Payment Signature Verification Failed: Security check failed. HMAC mismatch.`
  - Use: `Payment Verification Failed: We could not verify this transaction. Please contact support with Payment ID: pay_XXXXX.`
  - Instead of: `Order #${id} registered in Mayur Vihar optical lab queue.`
  - Use: `Order #${id} has been confirmed. Thank you!`

### 3.3. Zero Unicode Emojis Policy
- Modern luxury brands avoid unicode emojis in headings, badges, toasts, and buttons.
- Always use vector icons from `lucide-react` with precise sizing (`w-3.5 h-3.5` or `w-4 h-4`) and brand token coloring (`#C5A059`, `#0A251C`, `#16803E`).

---

## 4. Summary Checklist for Frontend Audits

Before releasing any customer-facing page, verify:
- [ ] No mention of "SSL", "256-bit", "AES", or "TLS" in customer badges.
- [ ] No mention of "HSN" or tax commodity codes on catalog or checkout summaries (reserved strictly for printable invoices).
- [ ] No courier API service names (e.g. "Shiprocket Surface") exposed to the customer.
- [ ] Form inputs and breadcrumbs use standard labels (`Account`, `Address`, `Payment`, `Confirmation`).
- [ ] Zero unicode emojis used across all components.
- [ ] CTAs use active, confident verbs (`Proceed to Checkout`, `Complete Payment`, `Apply`).
