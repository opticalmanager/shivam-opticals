const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);

const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const bad = await pool.query(`
    SELECT id, slug, name FROM public.products
    WHERE slug LIKE 'so-tommy-hilfiger-fr%' OR slug LIKE 'so-tommy-hilfiger-ctn%' OR slug LIKE '%-fr00%'
  `);
  console.log('Bad products count:', bad.rows.length);
  for (const b of bad.rows) {
    console.log(` - Deleting: ${b.slug} (${b.name})`);
    await pool.query('DELETE FROM public.products WHERE id = $1', [b.id]);
  }
  
  const p = await pool.query('SELECT count(*) FROM public.products');
  const v = await pool.query('SELECT count(*) FROM public.product_variants');
  const img = await pool.query('SELECT count(*) FROM public.product_images');
  console.log('Current valid counts:', { products: p.rows[0].count, variants: v.rows[0].count, images: img.rows[0].count });
  
  await pool.end();
}

run();
