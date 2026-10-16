const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const res = await pool.query("SELECT * FROM public.admin_settings WHERE key = 'shipping'");
    console.log('Row count:', res.rows.length);
    if (res.rows.length > 0) {
      console.log('Value:', JSON.stringify(res.rows[0].value, null, 2));
    } else {
      console.log('No shipping row in public.admin_settings');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
