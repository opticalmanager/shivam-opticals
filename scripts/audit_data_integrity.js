const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const poolMatch = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const connStr = poolMatch[1];

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

async function audit() {
  const nullImages = await pool.query("SELECT count(*) FROM public.product_images WHERE url IS NULL OR url = ''");
  const nullPrices = await pool.query("SELECT count(*) FROM public.products WHERE base_price IS NULL OR base_price <= 0");
  const nullSlugs = await pool.query("SELECT count(*) FROM public.products WHERE slug IS NULL OR slug = ''");
  const nullBrands = await pool.query("SELECT count(*) FROM public.products WHERE brand_id IS NULL");
  const nullCategories = await pool.query("SELECT count(*) FROM public.products WHERE category_id IS NULL");
  const nullVariants = await pool.query("SELECT count(*) FROM public.products p LEFT JOIN public.product_variants v ON v.product_id = p.id WHERE v.id IS NULL");
  const badStock = await pool.query("SELECT count(*) FROM public.product_variants WHERE stock_quantity != 12");
  const totalProducts = await pool.query("SELECT count(*) FROM public.products WHERE is_active = true");
  const totalVariants = await pool.query("SELECT count(*) FROM public.product_variants");
  const totalImages = await pool.query("SELECT count(*) FROM public.product_images");

  console.log('=== DATA INTEGRITY AUDIT RESULTS ===');
  console.log('Total Active Products:', totalProducts.rows[0].count);
  console.log('Total Product Variants:', totalVariants.rows[0].count);
  console.log('Total HD Product Images:', totalImages.rows[0].count);
  console.log('------------------------------------');
  console.log('Null or Empty Images:', nullImages.rows[0].count, '(Expected: 0)');
  console.log('Null or Non-Positive Prices:', nullPrices.rows[0].count, '(Expected: 0)');
  console.log('Null or Empty Slugs:', nullSlugs.rows[0].count, '(Expected: 0)');
  console.log('Products without Brand ID:', nullBrands.rows[0].count, '(Expected: 0)');
  console.log('Products without Category ID:', nullCategories.rows[0].count, '(Expected: 0)');
  console.log('Products without Variants (Orphans):', nullVariants.rows[0].count, '(Expected: 0)');
  console.log('Variants with stock != 12:', badStock.rows[0].count, '(Expected: 0)');
  console.log('====================================');

  await pool.end();
}

audit().catch(console.error);
