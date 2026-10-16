const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log("Connecting to PostgreSQL...");
  const res = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'general'");
  if (res.rows.length > 0) {
    const val = res.rows[0].value;
    val.contactEmail = 'info@shivamoptical.in';
    val.storeUrl = 'https://shivamoptical.in';
    await pool.query(
      "UPDATE public.admin_settings SET value = $1, updated_at = NOW() WHERE key = 'general'",
      [JSON.stringify(val)]
    );
    console.log("Successfully updated public.admin_settings 'general' storeUrl and contactEmail:");
    console.log(JSON.stringify(val, null, 2));
  } else {
    console.log("No 'general' key found in admin_settings");
  }
  await pool.end();
}

run().catch(err => {
  console.error("Error updating settings:", err);
  pool.end();
  process.exit(1);
});
