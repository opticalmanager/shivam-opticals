# Shivam Optical - Product Import Specification & CSV Schema Guide

This document defines the production data interchange format for importing eyewear frames, clinical ophthalmic glasses, luxury sunglasses, and lens packages into the Shivam Optical platform.

---

## 1. File Format Requirements

- **File Extension**: `.csv` (Comma Separated Values)
- **Character Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Text Qualifier**: Double Quotes (`"`) for text containing commas, line breaks, or special characters.
- **Header Row**: The first row must strictly contain the exact column headers specified below.

---

## 2. Multi-Variant Row Architecture

Shivam Optical utilizes a handle-based grouped catalog structure (similar to international optical e-commerce standards):

- If a product exists in **multiple colorways or SKU variants**, each variant is entered on its own row sharing the **exact same `handle` and product-level fields** (`title`, `brand`, `category`, `gender`, `shape`, `rim_type`, `frame_material`, `base_price`, `mrp`, `description`).
- Variant-specific fields (`variant_sku`, `variant_color_name`, `variant_color_hex`, `variant_stock`, `variant_price_override`, `is_default_variant`, `image_1_url` through `image_4_url`) differ on each row.
- If a product has only 1 colorway, it occupies exactly 1 row with `is_default_variant` set to `TRUE`.

---

## 3. Data Dictionary & Field Specifications

| Column Header | Data Type | Required? | Description & Allowed Values | Example Value |
|---|---|---|---|---|
| `handle` | String | Required | Unique alphanumeric slug identifying the product. Lowercase letters, numbers, and hyphens only. | `so-ray-ban-rb3025-aviator` |
| `title` | String | Required | Full retail model display name including model series. | `Ray-Ban RB3025 Aviator Classic` |
| `brand` | String | Required | Exact registered brand name (e.g., `Ray-Ban`, `Carrera`, `Burberry`, `Tommy Hilfiger`, `Vogue`, `Hugo`, `Scott`, `Stepper`, `Armani Exchange`). | `Ray-Ban` |
| `category` | String | Required | Product department: `Sunglasses`, `Eyeglasses`, `Smart Glasses`, `Contact Lenses`, `Kids Eyewear`. | `Sunglasses` |
| `gender` | String | Required | Target patron demographic: `men`, `women`, `unisex`, `kids`. | `unisex` |
| `shape` | String | Required | Optical frame geometry: `aviator`, `rectangle`, `round`, `square`, `wayfarer`, `cat-eye`, `geometric`, `oval`, `clubmaster`. | `aviator` |
| `rim_type` | String | Required | Frame chassis construction: `full-rim`, `semi-rimless`, `rimless`. | `full-rim` |
| `frame_material` | String | Required | Material composition: `metal`, `acetate`, `titanium`, `tr90`, `mixed`. | `metal` |
| `base_price` | Decimal | Required | Effective selling price in INR (tax inclusive). Minimum 100. | `10490` |
| `mrp` | Decimal | Optional | Maximum Retail Price / Compare-At strike-through price in INR. Must be >= `base_price`. | `12990` |
| `lens_properties` | String | Optional | Semicolon-delimited clinical lens coatings and properties. | `UV400 Protection; Polarized Glare Reduction; Anti-Reflective ARC` |
| `lens_width_mm` | Integer | Required | Caliber / lens diameter across widest point in mm (typically 48 - 62). | `58` |
| `bridge_width_mm` | Integer | Required | Distance between lenses in mm (typically 14 - 22). | `14` |
| `temple_length_mm` | Integer | Required | Side temple arm length in mm (typically 135 - 150). | `135` |
| `frame_width_mm` | Integer | Required | Total frontal hinge-to-hinge width in mm (typically 130 - 148). | `140` |
| `frame_weight` | String | Optional | Total chassis weight including demo lenses (e.g., `24g`, `14g`). | `24g` |
| `hsn_code` | String | Required | GST Harmonized System of Nomenclature code: `9003` (Spectacle Frames), `9004` (Sunglasses), `9001` (Ophthalmic Lenses). | `9004` |
| `description` | String | Required | Rich craftsmanship prose, hinge mechanism, ergonomics, and material origin. | `"An enduring icon of aeronautical heritage..."` |
| `is_new_arrival` | Boolean | Required | `TRUE` or `FALSE`. Highlights product in New Arrivals section. | `TRUE` |
| `is_best_seller` | Boolean | Required | `TRUE` or `FALSE`. Highlights product with Best Seller atelier badge. | `TRUE` |
| `is_on_sale` | Boolean | Required | `TRUE` or `FALSE`. Triggers percentage discount chip. | `FALSE` |
| `try_on_enabled` | Boolean | Required | `TRUE` or `FALSE`. Enables MediaPipe + Three.js virtual try-on module. | `TRUE` |
| `variant_sku` | String | Required | Unique manufacturer or atelier inventory SKU code. | `RB3025-001-58-GLD` |
| `variant_color_name` | String | Required | Human-readable colorway description (frame color / lens tint). | `Arista Gold / G-15 Green` |
| `variant_color_hex` | String | Required | 6-character hexadecimal color code for swatch rendering (e.g. `#C5A059`, `#1A1816`). | `#C5A059` |
| `variant_stock` | Integer | Required | Available stock quantity in physical boutique inventory. Minimum 0. | `15` |
| `variant_price_override` | Decimal | Optional | Specific price for this variant if it differs from `base_price`. Leave blank if same. | ` ` |
| `is_default_variant` | Boolean | Required | `TRUE` for exactly one variant per product to set the primary default swatch. | `TRUE` |
| `image_1_url` | URL | Required | Primary frontal / 3/4 quarter perspective studio photography URL. Direct HTTPS only. | `https://images2.ray-ban.com/.../0RB3025__001_58__shad__qt.png` |
| `image_2_url` | URL | Optional | Front-facing orthogonal studio photography URL. Direct HTTPS only. | `https://images2.ray-ban.com/.../0RB3025__001_58__shad__fr.png` |
| `image_3_url` | URL | Optional | Side profile / temple engraving studio photography URL. Direct HTTPS only. | `https://images2.ray-ban.com/.../0RB3025__001_58__shad__al.png` |
| `image_4_url` | URL | Optional | Folded, packaging, or genuine case studio photography URL. Direct HTTPS only. | `https://images2.ray-ban.com/.../0RB3025__001_58__shad__bk.png` |

---

## 4. Strict Quality Standards for Image URLs

Shivam Optical enforces high-luxury visual standards across all storefront displays. Any uploaded media must conform to the following rules:

1. **Direct High-Resolution Photography**: Image URLs must point directly to high-resolution JPEG, PNG, or WebP files (minimum 800x800px, preferably 1200x1200px or higher).
2. **Transparent or Neutral Studio Background**: Images must be photographed against clean white, transparent, or subtle neutral studio backgrounds.
3. **Strict Ban on Scraped Watermarks & Screenshots**: Under no circumstances should images contain embedded third-party retailer banners, captured mobile cards, competitor watermarks (e.g., Fastrack, Cartier cards captured via screenshot), or discount ribbons.
4. **No Clipart or Wireframe Placeholders**: Generic SVG wireframes or circular cliparts are strictly prohibited on active catalog items.
5. **Brand Consistency**: The frame pictured in the image URL must strictly correspond to the brand, model, and color specified in the variant row.
