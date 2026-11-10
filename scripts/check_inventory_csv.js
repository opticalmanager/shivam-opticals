const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const varCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('Columns in public.product_variants:');
  console.table(varCols.rows.map(r => ({ column: r.column_name, type: r.data_type })));

  const varSample = await pool.query(`
    SELECT pv.id, pv.sku, pv.color_name, pv.price, pv.stock_quantity, p.name as product_name
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    LIMIT 10
  `);
  console.log('Sample 10 variants:');
  console.table(varSample.rows);

  const allDbProducts = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, p.base_price, p.specs
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
  `);
  console.log(`Total products in DB: ${allDbProducts.rows.length}`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
