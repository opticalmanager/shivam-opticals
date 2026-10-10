const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const statsRes = await pool.query(`
    SELECT 
      COUNT(pv.id) as total_skus,
      COALESCE(SUM(pv.stock_quantity), 0) as total_units,
      COUNT(CASE WHEN pv.stock_quantity <= 5 AND pv.stock_quantity > 0 THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN pv.stock_quantity = 0 THEN 1 END) as out_of_stock_count
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id;
  `);
  console.log('PostgreSQL Live Inventory Stats:', statsRes.rows[0]);

  const prodsCountRes = await pool.query(`SELECT COUNT(*) FROM public.products`);
  console.log('PostgreSQL Total Products:', prodsCountRes.rows[0].count);

  const sampleRes = await pool.query(`
    SELECT 
      pv.id as variant_id,
      pv.sku,
      pv.color_name,
      pv.stock_quantity,
      p.name as product_name,
      b.name as brand_name
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LIMIT 3;
  `);
  console.log('Sample Live Variant Rows:', sampleRes.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
