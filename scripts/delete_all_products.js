const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const dbUrl = match ? match[1] : '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function removeAllProducts() {
  console.log('Initiating transactional removal of all SKU products, variants, and product images...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN;');

    const imgRes = await client.query('DELETE FROM public.product_images;');
    console.log(`Deleted ${imgRes.rowCount} rows from public.product_images`);

    const varRes = await client.query('DELETE FROM public.product_variants;');
    console.log(`Deleted ${varRes.rowCount} rows from public.product_variants`);

    // Clean any reviews if exist
    const revRes = await client.query('DELETE FROM public.reviews;');
    console.log(`Deleted ${revRes.rowCount} rows from public.reviews`);

    const prodRes = await client.query('DELETE FROM public.products;');
    console.log(`Deleted ${prodRes.rowCount} rows from public.products`);

    await client.query('COMMIT;');
    console.log('Transaction COMMITTED successfully! All legacy SKU products removed.');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Transaction failed and ROLLED BACK:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

removeAllProducts().catch((err) => {
  console.error('Removal failed:', err);
  process.exit(1);
});
