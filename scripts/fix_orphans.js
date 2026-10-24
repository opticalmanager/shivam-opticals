const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixOrphans() {
  const orphans = [
    { id: '149980b6-dbdd-4750-9950-92d2551f206f', sku: 'SO-RAYBAN-RB3025-DEF', color: 'W3277', price: 8390 },
    { id: '7ca13941-e939-41ec-b9b0-e5a59cc77681', sku: 'SO-RAYBAN-RB3785-DEF', color: '001/71', price: 8990 },
    { id: '8ec863a6-499c-4a63-8b1c-9d4474ff2c36', sku: 'SO-RAYBAN-RB3928-DEF', color: '001/82', price: 17490 }
  ];

  for (const o of orphans) {
    await pool.query(`
      INSERT INTO public.product_variants (product_id, sku, color_name, color_hex, stock_quantity, price_override)
      VALUES ($1, $2, $3, '#C5A059', 12, null)
      ON CONFLICT (sku) DO UPDATE SET stock_quantity = 12;
    `, [o.id, o.sku, o.color]);
    console.log('Fixed orphan variant:', o.sku);
  }
  await pool.end();
}

fixOrphans().catch(console.error);
