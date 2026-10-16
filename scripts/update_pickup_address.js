const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('Connecting to PostgreSQL...');
  
  // 1. Update shipping in admin_settings
  const shipRes = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'shipping'");
  if (shipRes.rows.length > 0) {
    const sVal = shipRes.rows[0].value;
    sVal.shiprocketPickupLocation = 'Mayur Vihar Atelier';
    sVal.shiprocketPickupAddress = 'Shop No-1, Kanishka Complex, SAMACHAR market, Mayur Vihar Phase I, extention, Mayur Vihar';
    sVal.shiprocketPickupCity = 'Delhi';
    sVal.shiprocketPickupState = 'Delhi';
    sVal.shiprocketPickupPincode = '110091';
    await pool.query(
      "UPDATE public.admin_settings SET value = $1, updated_at = NOW() WHERE key = 'shipping'",
      [JSON.stringify(sVal)]
    );
    console.log('Successfully updated shipping in admin_settings:', sVal);
  }

  // 2. Update general in admin_settings
  const genRes = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'general'");
  if (genRes.rows.length > 0) {
    const gVal = genRes.rows[0].value;
    gVal.address = 'Shop No-1, Kanishka Complex, SAMACHAR market, Mayur Vihar Phase I, extention, Mayur Vihar, Delhi, 110091';
    await pool.query(
      "UPDATE public.admin_settings SET value = $1, updated_at = NOW() WHERE key = 'general'",
      [JSON.stringify(gVal)]
    );
    console.log('Successfully updated general in admin_settings:', gVal);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Error updating pickup address:', err);
  pool.end();
  process.exit(1);
});
