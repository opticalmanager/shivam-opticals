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
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
      }
    }
  }
  return env;
}

const envPrecision = parseEnv('c:/Users/Gaurav/Desktop/Precision-Opticals/.env.local');
const envShivam = parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local');

async function compareSchemas() {
  const precisionPool = new Pool({ connectionString: envPrecision.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const shivamPool = new Pool({ connectionString: envShivam.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  const tables = ['brands', 'categories', 'products', 'product_variants', 'product_images'];

  for (const table of tables) {
    console.log(`\n=================== TABLE: ${table} ===================`);
    const q = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    const precCols = (await precisionPool.query(q, [table])).rows;
    const shivCols = (await shivamPool.query(q, [table])).rows;

    const precMap = new Map(precCols.map(c => [c.column_name, c]));
    const shivMap = new Map(shivCols.map(c => [c.column_name, c]));

    console.log('Precision cols count:', precCols.length);
    console.log('Shivam cols count:', shivCols.length);

    const missingInShivam = precCols.filter(c => !shivMap.has(c.column_name)).map(c => c.column_name);
    const extraInShivam = shivCols.filter(c => !precMap.has(c.column_name)).map(c => c.column_name);

    if (missingInShivam.length > 0) {
      console.log('Missing in Shivam:', missingInShivam);
    } else {
      console.log('All Precision columns exist in Shivam!');
    }
    if (extraInShivam.length > 0) {
      console.log('Extra in Shivam (not in Precision):', extraInShivam);
    }

    // Check data type differences
    for (const c of precCols) {
      if (shivMap.has(c.column_name)) {
        const sc = shivMap.get(c.column_name);
        if (sc.data_type !== c.data_type) {
          console.log(`Type mismatch for ${c.column_name}: Precision=${c.data_type}, Shivam=${sc.data_type}`);
        }
      }
    }
  }

  await precisionPool.end();
  await shivamPool.end();
}

compareSchemas().catch(console.error);
