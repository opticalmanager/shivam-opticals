const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function verify() {
  const client = await pool.connect();
  try {
    // 1. Check pricing settings in public.admin_settings
    const sRes = await client.query("SELECT key, value FROM public.admin_settings WHERE key = 'pricing';");
    console.log('--- ADMIN PRICING SETTING ---');
    console.log('Key:', sRes.rows[0]?.key);
    console.log('Value:', sRes.rows[0]?.value);

    // 2. Audit all products
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_active,
        COUNT(CASE WHEN original_price IS NOT NULL AND original_price > base_price THEN 1 END) as has_mrp_discount,
        ROUND(AVG(((original_price - base_price) / original_price) * 100), 2) as avg_discount_pct,
        MIN(ROUND(((original_price - base_price) / original_price) * 100)) as min_discount_pct,
        MAX(ROUND(((original_price - base_price) / original_price) * 100)) as max_discount_pct
      FROM public.products
      WHERE is_active = true AND base_price IS NOT NULL AND base_price > 0;
    `);

    console.log('\n--- CATALOG PRICING AUDIT ---');
    console.log('Total Active Products:', stats.rows[0].total_active);
    console.log('Products with MRP Discount:', stats.rows[0].has_mrp_discount);
    console.log('Average Discount on MRP:', stats.rows[0].avg_discount_pct + '%');
    console.log('Min Discount %:', stats.rows[0].min_discount_pct + '%');
    console.log('Max Discount %:', stats.rows[0].max_discount_pct + '%');

    // 3. Inspect sample 10 products
    const sample = await client.query(`
      SELECT p.name, b.name as brand, p.base_price, p.original_price,
             ROUND(((p.original_price - p.base_price) / p.original_price) * 100) as display_discount
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY p.id ASC
      LIMIT 10;
    `);

    console.log('\n--- SAMPLE 10 LIVE PRODUCTS ---');
    sample.rows.forEach(r => {
      console.log(`[${r.brand}] ${r.name}`);
      console.log(`   -> Selling Price (from PDF): ₹${Number(r.base_price).toLocaleString('en-IN')}`);
      console.log(`   -> MRP (Calculated): ₹${Number(r.original_price).toLocaleString('en-IN')}`);
      console.log(`   -> Display Discount: ${r.display_discount}% OFF\n`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(console.error);
