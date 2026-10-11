const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'payments' LIMIT 1;");
  console.log('Payment Settings:', JSON.stringify(res.rows[0]?.value, null, 2));
  await pool.end();
}
check().catch(console.error);
