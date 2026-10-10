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

async function checkConflicts() {
  const sBrands = await sPool.query('SELECT id, slug, name FROM brands');
  const pBrands = await pPool.query('SELECT id, slug, name FROM brands');

  console.log('Shivam brands:', sBrands.rows);
  const sSlugs = new Set(sBrands.rows.map(b => b.slug));
  const sIds = new Set(sBrands.rows.map(b => b.id));

  const conflicts = pBrands.rows.filter(b => sSlugs.has(b.slug) && !sIds.has(b.id));
  console.log('Brand slug conflicts with different ID:', conflicts);

  const sCats = await sPool.query('SELECT id, slug, name FROM categories');
  const pCats = await pPool.query('SELECT id, slug, name FROM categories');
  console.log('Shivam categories:', sCats.rows);
  const sCatSlugs = new Set(sCats.rows.map(c => c.slug));
  const sCatIds = new Set(sCats.rows.map(c => c.id));
  const catConflicts = pCats.rows.filter(c => sCatSlugs.has(c.slug) && !sCatIds.has(c.id));
  console.log('Category slug conflicts with different ID:', catConflicts);

  await sPool.end();
  await pPool.end();
}

checkConflicts().catch(console.error);
