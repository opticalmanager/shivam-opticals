const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const dbUrl = match ? match[1] : '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const tables = [
    'brands',
    'categories',
    'products',
    'product_variants',
    'product_images',
    'reviews',
    'wishlists',
    'orders',
    'order_items',
    'admin_settings'
  ];

  console.log('--- DATABASE ROW COUNTS ---');
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM public.${t}`);
      console.log(`${t}: ${res.rows[0].count}`);
    } catch (e) {
      console.log(`${t}: error (${e.message})`);
    }
  }

  await pool.end();
}

run();
