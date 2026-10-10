const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Testing Admin Database Queries...');

  // 1. Inventory query
  const invRes = await pool.query(`
    SELECT 
      pv.id as variant_id,
      pv.sku,
      pv.color_name,
      pv.color_hex,
      pv.stock_quantity,
      pv.updated_at,
      p.id as product_id,
      p.name as product_name,
      p.slug as product_slug,
      p.base_price,
      p.specs,
      b.name as brand_name,
      c.name as category_name
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    LIMIT 5;
  `);
  console.log('Inventory query success! Rows returned:', invRes.rows.length);

  // 2. Inventory stats
  const statsRes = await pool.query(`
    SELECT 
      COUNT(pv.id) as total_skus,
      COALESCE(SUM(pv.stock_quantity), 0) as total_units,
      COUNT(CASE WHEN pv.stock_quantity <= 5 AND pv.stock_quantity > 0 THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN pv.stock_quantity = 0 THEN 1 END) as out_of_stock_count
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id;
  `);
  console.log('Inventory stats success! Total SKUs:', statsRes.rows[0].total_skus, 'Total Units:', statsRes.rows[0].total_units);

  // 3. Products query
  const prodsRes = await pool.query(`
    SELECT 
      p.id,
      p.name,
      b.name as brand_name,
      c.name as category_name,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', pv.id,
          'sku', pv.sku,
          'color_name', pv.color_name,
          'stock_quantity', pv.stock_quantity
        ))
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
      ), '[]'::json) as variants
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    LIMIT 5;
  `);
  console.log('Products query success! Rows returned:', prodsRes.rows.length);

  // 4. Brands with product count
  const brandsRes = await pool.query(`
    SELECT b.name, COUNT(p.id) as product_count
    FROM public.brands b
    LEFT JOIN public.products p ON p.brand_id = b.id
    GROUP BY b.id
    ORDER BY product_count DESC
    LIMIT 5;
  `);
  console.log('Top Brands by Product Count:', brandsRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
