const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testCalc() {
  const res = await pool.query(`
    SELECT name, base_price, original_price, 
           ROUND(base_price / 0.9) as new_mrp,
           ROUND(((ROUND(base_price / 0.9) - base_price) / ROUND(base_price / 0.9)) * 100) as verified_discount_pct
    FROM public.products
    WHERE is_active = true
    LIMIT 6;
  `);
  console.log(res.rows);
  await pool.end();
}
testCalc();
