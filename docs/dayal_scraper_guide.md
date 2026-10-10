# Dayal Opticals Luxury Eyewear Scraper & Importer Manual

This guide explains how to extract complete luxury product information from **Dayal Opticals India** (`https://dayalopticalsindia.com/`), including all color variants, uncompressed HD photography, optical specifications, and direct integration into our e-commerce platform.

---

## 1. Architectural Discovery

Dayal Opticals operates on an enterprise **Shopify** infrastructure (`shopId: 60885631222`). Because of this, fragile DOM scraping with headless browsers (Puppeteer, Selenium, Cheerio) is **not needed**. 

Instead, we utilize Shopify's native, high-throughput **Storefront Catalog JSON API**:
- **Full Catalog Pagination**: `https://dayalopticalsindia.com/products.json?limit=250&page={N}`
- **Brand Collections**: `https://dayalopticalsindia.com/collections/{brand-slug}/products.json?limit=250&page={N}`
- **Total Catalog Discovered**: **6,568 products** across 27 pages.

### Why this is the best method:
1. **Zero Bot Blockades**: Clean REST JSON responses without Cloudflare CAPTCHAs or headless browser memory overhead.
2. **100% Uncompressed Master HD Images**: Hosted on Shopify's global CDN (`cdn.shopify.com`) at original master resolutions (1500×1500 to 2048×2048).
3. **Structured Colorways & SKUs**: Every product contains a `variants` array where `option1` isolates each colorway with its own `featured_image` and `variant_ids` gallery linking.
4. **Clinical Optical Specifications**: Body HTML & Tags encode lens width, nose bridge length, temple length, frame material (Beta-Titanium, Italian acetate), shapes (Hexagon, Octagonal, Round, Square, Aviator), and gender.

---

## 2. CLI Script Reference: `scripts/scrape_dayal.js`

We have implemented a zero-dependency Node.js CLI tool: [`scripts/scrape_dayal.js`](file:///C:/Users/Gaurav/Desktop/shivam-optics/scripts/scrape_dayal.js).

### Available Commands & Options

| Command / Flag | Purpose | Example |
|---|---|---|
| `--limit=N` | Max products to process | `npm run scrape:dayal -- --limit=20` |
| `--all` | Scrape the entire 6,568-product catalog | `npm run scrape:dayal -- --all --csv` |
| `--brand="Name"` | Filter by luxury brand (uses fast-path collection) | `npm run scrape:dayal -- --brand=Cartier` |
| `--type=sunglasses\|eyeglasses` | Filter by eyewear type | `npm run scrape:dayal -- --type=sunglasses` |
| `--csv` | Also generate an Excel / Shopify-compatible CSV | `npm run scrape:dayal -- --limit=50 --csv` |
| `--download-images` | Download original HD images locally to `public/images/dayal/` | `npm run scrape:dayal -- --brand=Matsuda --download-images` |
| `--sync-store` | Automatically append new products to `.data/shivam_store.json` | `npm run scrape:dayal -- --limit=30 --sync-store` |
| `--output=path.json` | Custom output location | `npm run scrape:dayal -- --output=data/cartier.json` |

---

## 3. Step-by-Step Usage Examples

### Example A: Quick 20-Product Sample with CSV
```bash
npm run scrape:dayal -- --limit=20 --csv
```
- Outputs:
  - `data/dayal_scraped_products.json`
  - `data/dayal_scraped_products.csv`

### Example B: Scrape All Cartier Frames (Fast Collection Path)
```bash
npm run scrape:dayal -- --brand=Cartier --limit=50 --csv
```
- Fetches all Cartier models (e.g., `CARTIER 0626S`, `CARTIER 0588S`, etc.), their Gold / Havana / Grey variants, and high-res imagery.

### Example C: Scrape & Download Master HD Images Locally
```bash
npm run scrape:dayal -- --brand=Matsuda --limit=10 --download-images
```
- Downloads all multi-angle high-resolution images to:
  `public/images/dayal/matsuda/<product-slug>/angle_1.webp`
- Updates the JSON image paths to `/images/dayal/...` so they render locally in your app.

### Example D: Directly Populate Website Store Catalog
```bash
npm run scrape:dayal -- --brand="Jacques Marie Mage" --limit=25 --sync-store
```
- Automatically merges the new products and variant inventory into `.data/shivam_store.json`.
- Products appear immediately on `/products`, `/product/[id]`, and the Admin Panel (`/admin/products`, `/admin/inventory`).

---

## 4. Output Data Structure

Each product in the JSON output adheres to our platform's `Product` and `DbProduct` interface:

```json
{
  "id": "do-9522021925110",
  "brand": "Cartier",
  "name": "CARTIER 0626S",
  "category": "Sunglasses",
  "type": "sunglasses",
  "shape": "Round",
  "gender": "unisex",
  "size": "M",
  "rating": 4.9,
  "price": 87600,
  "originalPrice": 87600,
  "discountPct": 0,
  "tag": "LUXURY ATELIER",
  "tagType": "new",
  "img": "https://cdn.shopify.com/s/files/.../Cartier_0626S_006.webp",
  "images": [
    "https://cdn.shopify.com/s/files/.../Cartier_0626S_006.webp",
    "https://cdn.shopify.com/s/files/.../Cartier_0626S_007.webp",
    "https://cdn.shopify.com/s/files/.../Cartier_0626S_008.webp"
  ],
  "colors": ["#C5A059", "#78350F"],
  "description": "Model No 0626S Material Titanium Lens Size 51 mm Nose Bridge Length 21 mm Temple Length 145 mm...",
  "material": "Titanium",
  "measurements": {
    "lensWidth": 51,
    "bridgeWidth": 21,
    "templeLength": 145
  },
  "colorVariants": [
    {
      "id": "var-do-9522021925110-0",
      "variantId": 51608372773110,
      "sku": "SKU-CARTIER-0626S-1",
      "colorName": "GOLD & GREY 006",
      "colorHex": "#C5A059",
      "price": 87600,
      "available": true,
      "featuredImage": "https://cdn.shopify.com/s/files/.../Cartier_0626S_006.webp",
      "gallery": ["https://cdn.shopify.com/s/files/.../Cartier_0626S_006.webp"]
    }
  ],
  "sourceUrl": "https://dayalopticalsindia.com/products/cartier-0626s"
}
```
