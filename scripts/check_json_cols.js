const fs = require('fs');
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

const sPool = new Pool({
  connectionString: parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local').DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkJsonCols() {
  const cols = await sPool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('brands', 'categories', 'products', 'product_variants', 'product_images')
      AND data_type IN ('json', 'jsonb')
  `);
  console.log('JSON / JSONB columns across all 5 tables:');
  cols.rows.forEach(c => console.log(`  ${c.table_name}.${c.column_name}: ${c.data_type}`));
  await sPool.end();
}

checkJsonCols().catch(console.error);
