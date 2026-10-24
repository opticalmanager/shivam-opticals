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
  const pCount = await pool.query('SELECT count(*) FROM public.products');
  const vCount = await pool.query('SELECT count(*) FROM public.product_variants');
  const oCount = await pool.query('SELECT count(*) FROM public.orders');
  const oiCount = await pool.query('SELECT count(*) FROM public.order_items');

  console.log('Products count:', pCount.rows[0].count);
  console.log('Variants count:', vCount.rows[0].count);
  console.log('Orders count:', oCount.rows[0].count);
  console.log('Order Items count:', oiCount.rows[0].count);

  const fks = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE ccu.table_name IN ('products', 'product_variants');
  `);
  console.log('\nForeign keys pointing to products/variants:');
  console.table(fks.rows);

  const pCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
  console.log('\nProducts columns:', pCols.rows.map(r => r.column_name).join(', '));

  const vCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_variants'");
  console.log('\nVariants columns:', vCols.rows.map(r => r.column_name).join(', '));

  // Check sample product
  const sampleProducts = await pool.query('SELECT id, name, category, created_at FROM public.products LIMIT 5');
  console.log('\nSample Products:');
  console.table(sampleProducts.rows);

  const sampleVariants = await pool.query('SELECT id, product_id, sku, color_name, price, stock_quantity FROM public.product_variants LIMIT 5');
  console.log('\nSample Variants:');
  console.table(sampleVariants.rows);

  await pool.end();
}

run().catch(e => {
  console.error(e);
  pool.end();
  process.exit(1);
});
