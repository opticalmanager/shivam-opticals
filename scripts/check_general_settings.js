const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'general'");
  console.log('General settings:', res.rows[0]?.value);
  await pool.end();
}
run();
