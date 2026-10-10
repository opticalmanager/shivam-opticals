const fs = require('fs');
const { Pool } = require('pg');

function parseEnv(f) {
  const env = {};
  if (fs.existsSync(f)) {
    fs.readFileSync(f, 'utf-8').split(/\r?\n/).forEach(l => {
      const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    });
  }
  return env;
}

const sPool = new Pool({
  connectionString: parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local').DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const pPool = new Pool({
  connectionString: parseEnv('c:/Users/Gaurav/Desktop/Precision-Opticals/.env.local').DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const sProds = await sPool.query('SELECT id, slug, name FROM products LIMIT 15');
  console.log('Shivam existing products:', sProds.rows);

  const pBrands = await pPool.query('SELECT id, name, slug FROM brands ORDER BY name');
  console.log('Precision brands count:', pBrands.rows.length);
  console.log('Precision sample brands:', pBrands.rows.slice(0, 10));

  const pCats = await pPool.query('SELECT id, name, slug FROM categories ORDER BY name');
  console.log('Precision categories:', pCats.rows);

  await sPool.end();
  await pPool.end();
}
run().catch(console.error);
