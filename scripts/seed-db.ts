import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { PRODUCTS } from "../data/products";

// Manually load .env.local and .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, "utf-8");
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || "").trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

async function seedDatabase() {
  loadEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL is not set in .env.local or .env");
    process.exit(1);
  }

  console.log("⚡ Connecting to Supabase database for seeding...");
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  try {
    // 1. Seed Categories
    console.log("🌱 Seeding Categories...");
    const categories = [
      { slug: "eyeglasses", name: "Eyeglasses", description: "Bespoke optical frames tailored for clinical accuracy" },
      { slug: "sunglasses", name: "Sunglasses", description: "UV400 polarized luxury sun protection" },
      { slug: "reading-glasses", name: "Reading Glasses", description: "Lightweight reading frames for close-focus clarity" },
      { slug: "computer-glasses", name: "Computer Glasses", description: "Anti-fatigue blue-light filtering lenses" },
    ];

    const categoryMap = new Map<string, string>();
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      const res = await pool.query(
        `INSERT INTO public.categories (slug, name, description, display_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id;`,
        [c.slug, c.name, c.description, i + 1]
      );
      categoryMap.set(c.slug, res.rows[0].id);
    }
    console.log(`  ✓ ${categories.length} Categories seeded.`);

    // 2. Seed Brands
    console.log("🌱 Seeding Brands...");
    const brands = [
      { slug: "gast", name: "GAST", origin: "Milan, Italy", tagline: "Contemporary Artisan Frames" },
      { slug: "lindberg", name: "Lindberg", origin: "Aarhus, Denmark", tagline: "Ultra-Lightweight Danish Titanium" },
      { slug: "cartier", name: "Cartier", origin: "Paris, France", tagline: "Prestige Haute Joaillerie Eyewear" },
      { slug: "maybach", name: "Maybach", origin: "Stuttgart, Germany", tagline: "Handcrafted Luxury Eyewear" },
      { slug: "ray-ban", name: "Ray-Ban", origin: "Milan, Italy", tagline: "Iconic Timeless Heritage" },
    ];

    const brandMap = new Map<string, string>();
    for (const b of brands) {
      const res = await pool.query(
        `INSERT INTO public.brands (slug, name, origin, tagline, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, origin = EXCLUDED.origin, tagline = EXCLUDED.tagline
         RETURNING id;`,
        [b.slug, b.name, b.origin, b.tagline]
      );
      brandMap.set(b.slug, res.rows[0].id);
    }
    console.log(`  ✓ ${brands.length} Brands seeded.`);

    // 3. Seed Lens Packages
    console.log("🌱 Seeding Lens Packages...");
    const lensPackages = [
      {
        lens_type: "frame-only",
        name: "Frame Only (Demo Lenses)",
        description: "Standard factory clear demonstration lenses with no optical correction.",
        price: 0.00,
        badge: "Basic",
        display_order: 1,
      },
      {
        lens_type: "zero-power-blue",
        name: "Zero Power Anti-Glare Blue Filter",
        description: "Digital eye strain protection with UV400 and hydrophobic coating.",
        price: 790.00,
        badge: "Screen Guard",
        display_order: 2,
      },
      {
        lens_type: "single-vision",
        name: "Single Vision Precision Prescription",
        description: "Tailored prescription lenses for either distance vision or close-up reading.",
        price: 1490.00,
        badge: "Most Popular",
        display_order: 3,
      },
      {
        lens_type: "progressive",
        name: "Digital HD Progressive Lenses",
        description: "Seamless corridor with smooth distance, computer, and near vision zones.",
        price: 3990.00,
        badge: "Premium HD",
        display_order: 4,
      },
    ];

    for (const lp of lensPackages) {
      await pool.query(
        `INSERT INTO public.lens_packages (lens_type, name, description, price, badge, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING;`,
        [lp.lens_type, lp.name, lp.description, lp.price, lp.badge, lp.display_order]
      );
    }
    console.log(`  ✓ ${lensPackages.length} Lens Packages seeded.`);

    // 4. Seed Products, Variants & Images
    console.log("🌱 Seeding Products, Variants & Images...");
    let imageCount = 0;
    let variantCount = 0;

    for (const p of PRODUCTS) {
      const shape = p.shape?.toLowerCase() || "rectangle";
      const validShapes = ["aviator", "cat-eye", "rectangle", "round", "square", "geometric", "oval", "wayfarer", "hexagon", "octagonal"];
      const finalShape = validShapes.includes(shape) ? shape : "rectangle";

      const brandSlug = (p.brand || "gast").toLowerCase();
      const brandId = brandMap.get(brandSlug) || brandMap.get("gast") || null;

      const categorySlug = (p.type || p.category || "eyeglasses").toLowerCase().replace(/\s+/g, "-");
      const categoryId = categoryMap.get(categorySlug) || categoryMap.get("eyeglasses") || null;

      const res = await pool.query(
        `INSERT INTO public.products (
           slug, name, brand_id, category_id, gender, shape, rim_type, material, color, color_hex,
           base_price, original_price, description, rating, review_count, is_active,
           try_on_enabled
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, true)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             brand_id = EXCLUDED.brand_id,
             category_id = EXCLUDED.category_id,
             base_price = EXCLUDED.base_price,
             original_price = EXCLUDED.original_price
         RETURNING id;`,
        [
          p.id,
          p.name,
          brandId,
          categoryId,
          p.gender || "unisex",
          finalShape,
          "full-rim",
          p.material || "Titanium & Stainless Steel",
          p.colors?.[0] || "Black",
          p.colors?.[0] || "#1A1816",
          p.price,
          p.originalPrice || p.price,
          p.description,
          p.rating || 4.9,
          18,
        ]
      );

      const productId = res.rows[0]?.id;
      if (!productId) continue;

      // Seed Variants
      if (p.colors && p.colors.length > 0) {
        for (let idx = 0; idx < p.colors.length; idx++) {
          const colHex = p.colors[idx];
          const sku = `${p.id.toUpperCase()}-CLR${idx + 1}`;
          await pool.query(
            `INSERT INTO public.product_variants (product_id, color_name, color_hex, sku, stock_quantity, is_default)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (sku) DO NOTHING;`,
            [productId, `Colorway ${idx + 1}`, colHex, sku, 15, idx === 0]
          );
          variantCount++;
        }
      }

      // Seed Images
      const imagesToSeed = (p.images && p.images.length > 0) ? p.images : (p.img ? [p.img] : []);
      // Clean up previous image records for idempotent re-seed
      await pool.query(`DELETE FROM public.product_images WHERE product_id = $1;`, [productId]);

      for (let imgIdx = 0; imgIdx < imagesToSeed.length; imgIdx++) {
        const imgUrl = imagesToSeed[imgIdx];
        await pool.query(
          `INSERT INTO public.product_images (product_id, url, alt_text, display_order, is_primary)
           VALUES ($1, $2, $3, $4, $5);`,
          [productId, imgUrl, `${p.name} view ${imgIdx + 1}`, imgIdx, imgIdx === 0]
        );
        imageCount++;
      }
    }
    console.log(`  ✓ ${PRODUCTS.length} Products, ${variantCount} Variants, and ${imageCount} Images seeded.`);

    // 5. Seed Coupons
    console.log("🌱 Seeding Coupons...");
    await pool.query(
      `INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, usage_limit, is_active)
       VALUES ('FLAT12', 'percentage', 12.00, 1999.00, 1000, true)
       ON CONFLICT (code) DO NOTHING;`
    );
    await pool.query(
      `INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, usage_limit, is_active)
       VALUES ('WELCOME200', 'fixed', 200.00, 1499.00, 500, true)
       ON CONFLICT (code) DO NOTHING;`
    );
    console.log("  ✓ Promo coupons FLAT12 and WELCOME200 seeded.");

    // 6. Seed Admin Settings
    console.log("🌱 Seeding Universal Admin Settings...");
    const generalSettings = {
      storeName: "Shivam Opticals Atelier",
      tagline: "Precision Eyecare & Haute Lunetterie",
      contactEmail: "info@shivamoptics.in",
      contactPhone: "097799 90207",
      address: "Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Phase 1 Extension, New Delhi - 110091",
      currency: "INR",
      freeShippingThreshold: 1999,
    };

    await pool.query(
      `INSERT INTO public.admin_settings (key, value)
       VALUES ('general', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
      [JSON.stringify(generalSettings)]
    );

    const paymentSettings = {
      razorpayUpi: {
        enabled: true,
        mode: "live",
        keyId: "rzp_live_Tn3v56njBS0cGX",
        acceptedMethods: ["UPI", "GPay", "PhonePe", "Paytm", "NetBanking", "RuPay", "Cards"],
      },
      stripe: {
        enabled: false,
        mode: "test",
      },
      cod: {
        enabled: true,
        minOrderValue: 500,
        maxOrderValue: 50000,
        requiresPhoneVerification: true,
      },
      netbanking: {
        enabled: true,
      },
    };

    await pool.query(
      `INSERT INTO public.admin_settings (key, value)
       VALUES ('payments', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
      [JSON.stringify(paymentSettings)]
    );
    console.log("  ✓ Admin settings (general, payments) seeded.");

    console.log("\n🎉 Database seeded successfully with authentic Shivam Opticals catalog!");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
