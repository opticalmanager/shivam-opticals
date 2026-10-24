const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const poolMatch = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const connStr = poolMatch[1];

async function verify() {
  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const pCount = await pool.query('SELECT count(*) FROM public.products WHERE is_active = true');
    const vCount = await pool.query('SELECT count(*) FROM public.product_variants');
    const imgCount = await pool.query('SELECT count(*) FROM public.product_images');
    
    const bCounts = await pool.query(`
      SELECT b.name, count(p.id) as count
      FROM public.brands b
      JOIN public.products p ON p.brand_id = b.id
      GROUP BY b.name
      ORDER BY count DESC;
    `);
    
    const catCounts = await pool.query(`
      SELECT c.name, count(p.id) as count
      FROM public.categories c
      JOIN public.products p ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY count DESC;
    `);

    const stockCheck = await pool.query(`
      SELECT min(stock_quantity) as min_stock, max(stock_quantity) as max_stock, count(*) as count
      FROM public.product_variants;
    `);
    
    console.log('=== DATABASE VERIFICATION SUMMARY ===');
    console.log('Total Active Products:', pCount.rows[0].count);
    console.log('Total Product Variants:', vCount.rows[0].count);
    console.log('Total HD Product Images:', imgCount.rows[0].count);
    console.log('Variant Stock Range:', stockCheck.rows[0]);
    
    console.log('\nBreakdown by Brand:');
    bCounts.rows.forEach(r => console.log(`  - ${r.name}: ${r.count} models`));
    
    console.log('\nBreakdown by Category:');
    catCounts.rows.forEach(r => console.log(`  - ${r.name}: ${r.count} models`));
  } finally {
    await pool.end();
  }
}

verify().catch(console.error);
