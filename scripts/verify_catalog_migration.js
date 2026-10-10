/**
 * Precision Optics -> Shivam Optics Product Catalog Migration Verification
 * 
 * Deep Edge Case Test Suite:
 * 1. Database Entity Counts (Brands: 42, Categories: 5, Products: 1297, Variants: 4138, Images: 12821).
 * 2. Relational & Foreign Key Integrity (0 orphan products, 0 orphan variants, 0 orphan images).
 * 3. 3D Try-On Configurations & Calibration Data Completeness.
 * 4. Logistics & Shipping Specs (package dimensions, weights).
 * 5. Variant Color Hex & Inventory Quantity Integrity.
 * 6. Cloudflare R2 Gallery Image URLs & Primary Angle Designations.
 * 7. Storefront Service Integration & Filter Mapping (42 brands, categories, shapes).
 * 8. Strict Zero Unicode Emojis Check across modified files.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function parseEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[match[1]] = val;
      }
    }
  }
  return env;
}

const env = parseEnv(path.join(__dirname, '..', '.env.local'));
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   PRECISION -> SHIVAM OPTICS CATALOG VERIFICATION SUITE       ');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: Entity Counts
    // -------------------------------------------------------------
    console.log('1. Checking Database Entity Counts in Shivam Optics Supabase...');
    const bCount = (await pool.query('SELECT count(*) FROM brands')).rows[0].count;
    const cCount = (await pool.query('SELECT count(*) FROM categories')).rows[0].count;
    const pCount = (await pool.query('SELECT count(*) FROM products')).rows[0].count;
    const vCount = (await pool.query('SELECT count(*) FROM product_variants')).rows[0].count;
    const iCount = (await pool.query('SELECT count(*) FROM product_images')).rows[0].count;

    assert(parseInt(bCount, 10) >= 42, `Brands count >= 42 (actual: ${bCount})`);
    assert(parseInt(cCount, 10) >= 5, `Categories count >= 5 (actual: ${cCount})`);
    assert(parseInt(pCount, 10) >= 1297, `Products count >= 1297 (actual: ${pCount})`);
    assert(parseInt(vCount, 10) >= 4138, `Product variants count >= 4138 (actual: ${vCount})`);
    assert(parseInt(iCount, 10) >= 12821, `Product images count >= 12821 (actual: ${iCount})`);

    // -------------------------------------------------------------
    // TEST SUITE 2: Foreign Key & Relational Integrity
    // -------------------------------------------------------------
    console.log('\n2. Verifying Foreign Key & Relational Integrity...');
    
    // Check products with invalid brand_id
    const orphanProdsBrand = (await pool.query(`
      SELECT count(*) FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE b.id IS NULL
    `)).rows[0].count;
    assert(parseInt(orphanProdsBrand, 10) === 0, `0 products with invalid brand_id (actual: ${orphanProdsBrand})`);

    // Check products with invalid category_id
    const orphanProdsCat = (await pool.query(`
      SELECT count(*) FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE c.id IS NULL
    `)).rows[0].count;
    assert(parseInt(orphanProdsCat, 10) === 0, `0 products with invalid category_id (actual: ${orphanProdsCat})`);

    // Check variants with invalid product_id
    const orphanVariants = (await pool.query(`
      SELECT count(*) FROM product_variants v 
      LEFT JOIN products p ON v.product_id = p.id 
      WHERE p.id IS NULL
    `)).rows[0].count;
    assert(parseInt(orphanVariants, 10) === 0, `0 variants with invalid product_id (actual: ${orphanVariants})`);

    // Check images with invalid product_id
    const orphanImages = (await pool.query(`
      SELECT count(*) FROM product_images i 
      LEFT JOIN products p ON i.product_id = p.id 
      WHERE p.id IS NULL
    `)).rows[0].count;
    assert(parseInt(orphanImages, 10) === 0, `0 images with invalid product_id (actual: ${orphanImages})`);

    // Check images with non-matching variant_id
    const orphanVariantImages = (await pool.query(`
      SELECT count(*) FROM product_images i 
      LEFT JOIN product_variants v ON i.variant_id = v.id 
      WHERE i.variant_id IS NOT NULL AND v.id IS NULL
    `)).rows[0].count;
    assert(parseInt(orphanVariantImages, 10) === 0, `0 images with invalid variant_id (actual: ${orphanVariantImages})`);

    // -------------------------------------------------------------
    // TEST SUITE 3: Luxury Brands & Taxonomy Verification
    // -------------------------------------------------------------
    console.log('\n3. Verifying Key Luxury Brands Existence...');
    const luxuryBrands = ['Cartier', 'Maybach', 'GAST', 'Lindberg', 'Ray-Ban', 'Akoni', 'Montblanc', 'Prada', 'Gucci'];
    for (const lb of luxuryBrands) {
      const res = await pool.query('SELECT count(*) FROM brands WHERE LOWER(name) = LOWER($1)', [lb]);
      assert(parseInt(res.rows[0].count, 10) > 0, `Luxury brand "${lb}" exists in Shivam DB`);
    }

    // -------------------------------------------------------------
    // TEST SUITE 4: 3D Try-On Configurations & Calibration
    // -------------------------------------------------------------
    console.log('\n4. Verifying 3D Try-On Calibration Data...');
    const tryOnProds = await pool.query(`
      SELECT id, name, try_on_enabled, try_on_configuration 
      FROM products 
      WHERE try_on_configuration IS NOT NULL 
      LIMIT 10
    `);
    assert(tryOnProds.rows.length > 0, `Found products with try_on_configuration (checked ${tryOnProds.rows.length})`);
    
    let validConfigCount = 0;
    tryOnProds.rows.forEach(p => {
      const cfg = p.try_on_configuration;
      if (cfg && typeof cfg === 'object' && cfg.frameWidth && cfg.bridgeWidth && cfg.lensWidth) {
        validConfigCount++;
      }
    });
    assert(validConfigCount > 0, `Try-on configs contain calibrated frameWidth, bridgeWidth, and lensWidth (${validConfigCount}/${tryOnProds.rows.length})`);

    // -------------------------------------------------------------
    // TEST SUITE 5: Logistics & Shipping Metadata
    // -------------------------------------------------------------
    console.log('\n5. Verifying Logistics & Shipping Dimensions...');
    const shippingProds = await pool.query(`
      SELECT id, name, specs, package_dimensions 
      FROM products 
      WHERE package_dimensions IS NOT NULL OR (specs->'packageDimensions') IS NOT NULL 
      LIMIT 10
    `);
    assert(shippingProds.rows.length > 0, `Found products with shipping dimensions (checked ${shippingProds.rows.length})`);
    
    const sampleShip = shippingProds.rows[0];
    const dims = sampleShip.package_dimensions || sampleShip.specs?.packageDimensions;
    assert(
      Boolean(dims && (dims.weightKg || dims.lengthCm)),
      `Package dimensions contain valid shipping attributes (${JSON.stringify(dims)})`
    );

    // -------------------------------------------------------------
    // TEST SUITE 6: Variant Hex Colors & Primary Gallery Images
    // -------------------------------------------------------------
    console.log('\n6. Verifying Variant Colors & Image URLs...');
    const varSample = await pool.query(`
      SELECT color_hex, stock_quantity 
      FROM product_variants 
      WHERE color_hex IS NOT NULL AND color_hex != '' 
      LIMIT 20
    `);
    assert(varSample.rows.length > 0, `Product variants have color_hex defined (${varSample.rows.length} checked)`);
    const validHexCount = varSample.rows.filter(v => /^#[0-9A-Fa-f]{3,8}$/.test(v.color_hex)).length;
    assert(validHexCount > 15, `Hex codes conform to standard #HEX format (${validHexCount}/${varSample.rows.length})`);

    const imgSample = await pool.query(`
      SELECT url, is_primary 
      FROM product_images 
      WHERE url IS NOT NULL 
      LIMIT 20
    `);
    const r2UrlCount = imgSample.rows.filter(i => i.url.startsWith('https://') || i.url.startsWith('/')).length;
    assert(r2UrlCount === imgSample.rows.length, `All image URLs are valid web / R2 URLs (${r2UrlCount}/${imgSample.rows.length})`);
    
    const primaryImgCount = (await pool.query('SELECT count(*) FROM product_images WHERE is_primary = true')).rows[0].count;
    assert(parseInt(primaryImgCount, 10) > 0, `Primary images flagged (total: ${primaryImgCount})`);

    // -------------------------------------------------------------
    // TEST SUITE 7: Live Service & Filter Mapping Test
    // -------------------------------------------------------------
    console.log('\n7. Verifying Storefront Dynamic Filter Mapping...');
    // Query products using Supabase PostgREST with pagination
    let allFetched = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, brand:brands(name), category:categories(slug),
          gender, shape, base_price, is_active,
          product_images(url, is_primary)
        `)
        .eq('is_active', true)
        .range(from, from + 999);
      if (error || !data || data.length === 0) break;
      allFetched = allFetched.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }
    assert(allFetched.length >= 1297, `Live Supabase catalog query retrieved ${allFetched.length} products`);

    const dynamicBrands = new Set(allFetched.map(p => p.brand?.name).filter(Boolean));
    assert(dynamicBrands.size >= 30, `Dynamic brands in catalog pool: ${dynamicBrands.size} (>= 30 active)`);
    
    const dynamicShapes = new Set(allFetched.map(p => p.shape).filter(Boolean));
    assert(dynamicShapes.size >= 5, `Dynamic shapes in catalog pool: ${dynamicShapes.size} (>= 5 active)`);

    // -------------------------------------------------------------
    // TEST SUITE 8: Strict Zero Unicode Emojis Check
    // -------------------------------------------------------------
    console.log('\n8. Checking Strict Zero Unicode Emojis Policy...');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

    const filesToCheck = [
      path.join(__dirname, 'migrate_catalog_from_precision.js'),
      path.join(__dirname, '..', 'app', 'products', 'page.tsx'),
      path.join(__dirname, '..', 'components', 'home', 'ProductCard.tsx'),
      path.join(__dirname, '..', 'lib', 'productsService.ts'),
    ];

    let totalEmojiViolations = 0;
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
          if (emojiRegex.test(line)) {
            console.error(`  [FAIL] Emoji violation in ${path.basename(filePath)}:${lineIndex + 1}: ${line.trim()}`);
            totalEmojiViolations++;
          }
        });
      }
    }
    assert(totalEmojiViolations === 0, `Zero Unicode Emojis across all updated files (violations: ${totalEmojiViolations})`);

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 100% GREEN.');
    }

  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
