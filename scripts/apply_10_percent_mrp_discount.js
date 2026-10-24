const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function applyPricing() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Save pricing setting to public.admin_settings
    const pricingConfig = {
      defaultDiscountPercent: 10,
      roundingRule: 'nearest_integer',
      autoApplyOnCreate: true,
      updatedAt: new Date().toISOString()
    };

    await client.query(`
      INSERT INTO public.admin_settings (key, value, updated_at)
      VALUES ('pricing', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `, [JSON.stringify(pricingConfig)]);
    console.log('✓ Stored pricing configuration in public.admin_settings (10% discount on MRP)');

    // 2. Also update general settings if present
    const genRes = await client.query("SELECT value FROM public.admin_settings WHERE key = 'general' LIMIT 1;");
    if (genRes.rows.length > 0) {
      const genVal = typeof genRes.rows[0].value === 'string' ? JSON.parse(genRes.rows[0].value) : genRes.rows[0].value;
      genVal.defaultDiscountPercent = 10;
      await client.query(`
        UPDATE public.admin_settings SET value = $1::jsonb, updated_at = NOW() WHERE key = 'general';
      `, [JSON.stringify(genVal)]);
      console.log('✓ Updated general settings with defaultDiscountPercent: 10');
    }

    // 3. Atomically recalculate original_price = ROUND(base_price / 0.90) for all active products
    // Selling price (base_price) remains EXACTLY preserved from the physical inventory PDF sheets!
    const updateRes = await client.query(`
      UPDATE public.products
      SET original_price = ROUND(base_price / 0.90),
          updated_at = NOW()
      WHERE is_active = true AND base_price IS NOT NULL AND base_price > 0;
    `);
    console.log(`✓ Recalculated MRP for ${updateRes.rowCount} active products!`);

    await client.query('COMMIT');

    // 4. Verify sample products
    const sample = await client.query(`
      SELECT slug, name, base_price, original_price,
             ROUND(((original_price - base_price) / original_price) * 100) as discount_pct
      FROM public.products
      WHERE is_active = true
      ORDER BY base_price ASC
      LIMIT 8;
    `);

    console.log('\n--- SAMPLE RECALCULATED PRODUCTS (10% DISCOUNT ON MRP) ---');
    sample.rows.forEach(r => {
      console.log(`- ${r.name}: Selling Price ₹${r.base_price} | MRP ₹${r.original_price} | Discount: ${r.discount_pct}% OFF`);
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying pricing:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyPricing();
