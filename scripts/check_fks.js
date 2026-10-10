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

async function checkForeignKeys() {
  const q = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name IN ('brands', 'categories', 'products', 'product_variants')
    ORDER BY tc.table_name, kcu.column_name;
  `;
  const res = await sPool.query(q);
  console.log('Foreign keys pointing to catalog tables:');
  res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`));
  await sPool.end();
}

checkForeignKeys().catch(console.error);
