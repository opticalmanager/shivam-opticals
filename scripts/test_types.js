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

const pPool = new Pool({
  connectionString: parseEnv('c:/Users/Gaurav/Desktop/Precision-Opticals/.env.local').DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sPool = new Pool({
  connectionString: parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local').DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSerialization() {
  const brand = (await pPool.query('SELECT * FROM brands LIMIT 1')).rows[0];
  const cat = (await pPool.query('SELECT * FROM categories LIMIT 1')).rows[0];
  const prod = (await pPool.query('SELECT * FROM products LIMIT 1')).rows[0];

  console.log('Sample brand:', brand.name);
  console.log('Sample cat:', cat.name);
  console.log('Sample prod:', prod.name);
  console.log('prod lens_properties type:', typeof prod.lens_properties, Array.isArray(prod.lens_properties), prod.lens_properties);
  console.log('prod specs type:', typeof prod.specs, prod.specs);
  console.log('prod try_on_config type:', typeof prod.try_on_configuration, prod.try_on_configuration);

  // Check column data_types in information_schema for products
  const cols = await sPool.query(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'products'
  `);
  console.log('\nShivam products column types:');
  cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`));

  await pPool.end();
  await sPool.end();
}

testSerialization().catch(console.error);
