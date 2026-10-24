const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const dbUrl = match ? match[1] : '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function backup() {
  console.log('Initiating full catalog safety backup...');
  
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `catalog_backup_pre_wipe_${timestamp}.json`);

  // Fetch all products, variants, images
  const productsRes = await pool.query('SELECT * FROM public.products ORDER BY created_at ASC');
  const variantsRes = await pool.query('SELECT * FROM public.product_variants ORDER BY created_at ASC');
  const imagesRes = await pool.query('SELECT * FROM public.product_images ORDER BY id ASC');

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      productsCount: productsRes.rows.length,
      variantsCount: variantsRes.rows.length,
      imagesCount: imagesRes.rows.length,
      description: 'Pre-wipe safety backup of all legacy SKU products, variants, and image records.'
    },
    products: productsRes.rows,
    variants: variantsRes.rows,
    images: imagesRes.rows
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Backup completed successfully!`);
  console.log(`- Products backed up: ${backupData.metadata.productsCount}`);
  console.log(`- Variants backed up: ${backupData.metadata.variantsCount}`);
  console.log(`- Images backed up: ${backupData.metadata.imagesCount}`);
  console.log(`- Saved to: ${backupFilePath}`);

  await pool.end();
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
