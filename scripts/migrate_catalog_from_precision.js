/**
 * Precision Optics -> Shivam Optical Product Catalog Migration
 * 
 * Migrates pure-format catalog data:
 * - 42 Brands
 * - 5 Categories
 * - 1,297 Products (including try_on_configuration, dimensions, logistics info, specs)
 * - 4,138 Product Variants (colors, hex, sizes, stock)
 * - 12,821 Product Images (primary angles, gallery, Cloudflare R2 URLs)
 * 
 * Zero scraping: Direct pure database-to-database synchronization.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function parseEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[match[1]] = val;
      }
    }
  }
  return env;
}

const precisionEnv = parseEnv('c:/Users/Gaurav/Desktop/Precision-Opticals/.env.local');
const shivamEnv = parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local');

if (!precisionEnv.DATABASE_URL || !shivamEnv.DATABASE_URL) {
  console.error('DATABASE_URL missing from one of the .env.local files!');
  process.exit(1);
}

const precisionPool = new Pool({
  connectionString: precisionEnv.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const shivamPool = new Pool({
  connectionString: shivamEnv.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JSON_COLUMNS = new Set([
  'specs',
  'try_on_configuration',
  'color_variants',
  'package_dimensions'
]);

async function batchInsert(client, tableName, columns, rows, batchSize = 200) {
  if (rows.length === 0) return 0;
  
  let totalInserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((row, rowIndex) => {
      const rowPlaceholders = [];
      columns.forEach((col, colIndex) => {
        let val = row[col];
        if (JSON_COLUMNS.has(col) && val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        values.push(val);
        rowPlaceholders.push(`$${rowIndex * columns.length + colIndex + 1}`);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const colNames = columns.map(c => `"${c}"`).join(', ');
    const query = `INSERT INTO "${tableName}" (${colNames}) VALUES ${valuePlaceholders.join(', ')}`;
    
    await client.query(query, values);
    totalInserted += chunk.length;
    process.stdout.write(`  [${tableName}] Inserted ${totalInserted} / ${rows.length}\r`);
  }
  console.log(`  [${tableName}] Completed ${totalInserted} / ${rows.length} rows.`);
  return totalInserted;
}

async function migrate() {
  console.log('=== Starting Pure Catalog Migration from Precision to Shivam ===\n');
  const startTime = Date.now();

  const shivamClient = await shivamPool.connect();

  try {
    // 1. Fetch all data from Precision Optics
    console.log('1. Reading catalog tables from Precision Optics Supabase...');
    
    const brandsRes = await precisionPool.query('SELECT * FROM brands ORDER BY name');
    console.log(`- Fetched ${brandsRes.rows.length} brands`);

    const catsRes = await precisionPool.query('SELECT * FROM categories ORDER BY name');
    console.log(`- Fetched ${catsRes.rows.length} categories`);

    const prodsRes = await precisionPool.query('SELECT * FROM products ORDER BY created_at ASC');
    console.log(`- Fetched ${prodsRes.rows.length} products`);

    const variantsRes = await precisionPool.query('SELECT * FROM product_variants ORDER BY created_at ASC');
    console.log(`- Fetched ${variantsRes.rows.length} product variants`);

    const imagesRes = await precisionPool.query('SELECT * FROM product_images ORDER BY created_at ASC');
    console.log(`- Fetched ${imagesRes.rows.length} product images`);

    // 2. Begin Transaction in Shivam Optical DB
    console.log('\n2. Preparing Shivam Optical database tables...');
    await shivamClient.query('BEGIN');

    // Clean existing dummy catalog tables in reverse topological order
    await shivamClient.query('DELETE FROM product_images');
    await shivamClient.query('DELETE FROM product_variants');
    await shivamClient.query('DELETE FROM products');
    await shivamClient.query('DELETE FROM brands');
    await shivamClient.query('DELETE FROM categories');
    console.log('Cleaned dummy records from Shivam catalog tables.');

    // 3. Batch Insert into Shivam
    console.log('\n3. Inserting pure catalog data into Shivam Optical Supabase...');

    // A. Brands
    const brandCols = Object.keys(brandsRes.rows[0]);
    await batchInsert(shivamClient, 'brands', brandCols, brandsRes.rows, 42);

    // B. Categories
    const catCols = Object.keys(catsRes.rows[0]);
    await batchInsert(shivamClient, 'categories', catCols, catsRes.rows, 5);

    // C. Products (32 cols, batch size 200 => 6,400 params)
    const prodCols = Object.keys(prodsRes.rows[0]);
    await batchInsert(shivamClient, 'products', prodCols, prodsRes.rows, 200);

    // D. Product Variants (10 cols, batch size 500 => 5,000 params)
    const varCols = Object.keys(variantsRes.rows[0]);
    await batchInsert(shivamClient, 'product_variants', varCols, variantsRes.rows, 500);

    // E. Product Images (8 cols, batch size 1000 => 8,000 params)
    const imgCols = Object.keys(imagesRes.rows[0]);
    await batchInsert(shivamClient, 'product_images', imgCols, imagesRes.rows, 1000);

    await shivamClient.query('COMMIT');
    console.log('\nTransaction committed successfully!');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n=== Migration Finished in ${duration}s ===`);

    // 4. Verification Check
    console.log('\n=== Verifying Record Counts in Shivam Optical ===');
    for (const tbl of ['brands', 'categories', 'products', 'product_variants', 'product_images']) {
      const res = await shivamPool.query(`SELECT count(*) FROM "${tbl}"`);
      console.log(`- ${tbl}: ${res.rows[0].count}`);
    }

  } catch (err) {
    await shivamClient.query('ROLLBACK');
    console.error('\nMigration failed, transaction rolled back:', err);
    process.exit(1);
  } finally {
    shivamClient.release();
    await precisionPool.end();
    await shivamPool.end();
  }
}

migrate();
