const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Fetching diverse top luxury products from Shivam Optical Supabase...');

  const query = `
    SELECT 
      p.*, 
      b.name as brand_name, 
      c.name as cat_name, 
      c.slug as cat_slug
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.is_best_seller DESC, p.rating DESC, p.created_at ASC
    LIMIT 30;
  `;

  const prodsRes = await pool.query(query);
  const products = prodsRes.rows;
  console.log(`Retrieved ${products.length} products`);

  // Also fetch all product_images and product_variants for these products
  const productIds = products.map(p => p.id);
  const variantsRes = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = ANY($1)',
    [productIds]
  );
  const imagesRes = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY display_order ASC',
    [productIds]
  );

  const variantsByProd = {};
  for (const v of variantsRes.rows) {
    if (!variantsByProd[v.product_id]) variantsByProd[v.product_id] = [];
    variantsByProd[v.product_id].push(v);
  }

  const imagesByProd = {};
  for (const img of imagesRes.rows) {
    if (!imagesByProd[img.product_id]) imagesByProd[img.product_id] = [];
    imagesByProd[img.product_id].push(img);
  }

  const mappedProducts = products.map((row) => {
    const rawImages = (imagesByProd[row.id] || [])
      .slice()
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.display_order || 0) - (b.display_order || 0))
      .map(img => img.url?.trim())
      .filter(Boolean);

    // If rawImages empty, try color_variants
    const cvImages = [];
    if (Array.isArray(row.color_variants)) {
      row.color_variants.forEach(cv => {
        if (cv.featuredImage) cvImages.push(cv.featuredImage);
        if (Array.isArray(cv.gallery)) cv.gallery.forEach(g => cvImages.push(g));
      });
    }

    const resolvedImages = rawImages.length > 0 ? rawImages : (cvImages.length > 0 ? cvImages : ['/images/placeholder.jpg']);
    const primaryImg = resolvedImages[0];

    const prodVariants = variantsByProd[row.id] || [];
    const variants = prodVariants.length > 0
      ? prodVariants.map(v => {
          const varImgObj = (imagesByProd[row.id] || []).find(img => img.variant_id === v.id);
          return {
            id: v.id,
            colorName: (v.color_name || '').replace(/\s+/g, ' ').trim(),
            colorHex: v.color_hex || '#1A1816',
            image: varImgObj?.url || primaryImg,
            inStock: v.stock_quantity > 0,
          };
        })
      : (Array.isArray(row.color_variants) ? row.color_variants.map((cv, idx) => ({
          id: cv.id || `var-${row.slug || row.id}-${idx}`,
          colorName: (cv.colorName || '').replace(/\s+/g, ' ').trim(),
          colorHex: cv.colorHex || '#1A1816',
          image: cv.featuredImage || cv.gallery?.[0] || primaryImg,
          inStock: cv.available !== false,
        })) : [{
          id: `var-${row.id}-0`,
          colorName: row.color || 'Standard',
          colorHex: row.color_hex || '#1A1816',
          image: primaryImg,
          inStock: true,
        }]);

    const colors = variants.map(v => v.colorHex).filter(Boolean);

    return {
      id: row.slug || row.id,
      brand: row.brand_name || 'Ray-Ban',
      name: row.name,
      subtitle: row.subtitle || (row.is_best_seller ? 'BESTSELLER' : (row.is_on_sale ? 'ON SALE' : undefined)),
      price: Number(row.base_price || 0),
      originalPrice: row.original_price ? Number(row.original_price) : Math.round(Number(row.base_price || 0) * 1.2),
      discountPct: row.discount_pct || (row.original_price ? Math.round(((Number(row.original_price) - Number(row.base_price)) / Number(row.original_price)) * 100) : 15),
      category: row.cat_slug || 'sunglasses',
      type: row.cat_slug || 'sunglasses',
      gender: row.gender || 'unisex',
      shape: row.shape || 'rectangle',
      rimType: row.rim_type || 'full-rim',
      material: row.material || 'acetate',
      color: row.color || variants[0]?.colorName || 'Black',
      colorHex: row.color_hex || variants[0]?.colorHex || '#1A1816',
      colors: colors.length > 0 ? colors : ['#1A1816'],
      lensProperties: row.lens_properties || ['anti-reflective', 'uv-protection'],
      size: row.size || 'M',
      isNewArrival: Boolean(row.is_new_arrival),
      isBestSeller: Boolean(row.is_best_seller),
      isOnSale: Boolean(row.is_on_sale),
      isLimitedEdition: Boolean(row.is_limited_edition),
      rating: Number(row.rating) || 4.9,
      reviewCount: Number(row.review_count) || 24,
      tag: row.is_on_sale ? 'ON SALE' : (row.is_best_seller ? 'BESTSELLER' : undefined),
      tagType: row.is_on_sale ? 'sale' : 'featured',
      img: primaryImg,
      images: resolvedImages,
      description: row.description || `${row.brand_name || 'Luxury'} eyewear engineered with high optical precision.`,
      specs: row.specs || {
        lensWidth: 54,
        bridgeWidth: 18,
        templeLength: 145,
        frameWidth: 140,
        weight: '22g',
      },
      measurements: {
        lensWidth: row.specs?.lensWidth || 54,
        bridgeWidth: row.specs?.bridgeWidth || 18,
        templeLength: row.specs?.templeLength || 145,
      },
      packageDimensions: row.package_dimensions || {
        lengthCm: 18,
        breadthCm: 9,
        heightCm: 7,
        weightKg: 0.25,
      },
      variants: variants,
      colorVariants: row.color_variants || [],
      tryOnEnabled: Boolean(row.try_on_enabled),
      tryOnModelUrl: row.try_on_model_url || undefined,
      tryOnConfig: row.try_on_configuration || undefined,
      sourceUrl: row.source_url || undefined,
    };
  });

  // Also preserve lens packages from original data/products.ts
  const outputCode = `import { Product, LensPackage } from "@/types";

export const PRODUCTS: Product[] = ${JSON.stringify(mappedProducts, null, 2)};

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
`;

  fs.writeFileSync(path.join(__dirname, '../data/products.ts'), outputCode, 'utf8');
  console.log('Successfully wrote 30 real luxury products to data/products.ts!');
  await pool.end();
}

main().catch(err => {
  console.error('Error generating products data:', err);
  process.exit(1);
});
