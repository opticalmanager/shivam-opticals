const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedShipping() {
  try {
    const shippingConfig = {
      freeShippingThreshold: 1999,
      standardShippingFee: 150,
      expressShippingFee: 350,
      defaultCarrier: "Blue Dart Air",
      supportedCarriers: ["Blue Dart Air", "DTDC Surface", "DTDC Air 500gm", "Delhivery Air", "Shadowfax"],
      enableWhiteGloveHomeTrial: true,
      trialDepositAmount: 3000,
      shiprocketEmail: "service.viralnest@gmail.com",
      shiprocketPassword: "ou6wb4ob*JiuAl6zW5^KM7DWX*Ln#wpx",
      shiprocketPickupLocation: "work",
      shiprocketPickupAddress: "GF-45D, Spectrum metro mall, Phase-1, Sector 75",
      shiprocketPickupCity: "Noida",
      shiprocketPickupState: "Uttar Pradesh",
      shiprocketPickupPincode: "201316",
      shiprocketWebhookSecret: "#$#%OMw956hgchpCZLULEGW3B573on0g",
      fulfillmentMode: "manual_1click",
      defaultWeightKg: 0.35,
      packageDimensions: {
        length: 18,
        breadth: 12,
        height: 8
      }
    };

    const res = await pool.query(
      `INSERT INTO public.admin_settings (key, value, updated_at)
       VALUES ('shipping', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()
       RETURNING key, updated_at;`,
      [JSON.stringify(shippingConfig)]
    );

    console.log('Successfully saved shipping settings into public.admin_settings:', res.rows[0]);
  } catch (err) {
    console.error('Error saving shipping settings:', err);
  } finally {
    await pool.end();
  }
}

seedShipping();
