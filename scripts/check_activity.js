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

async function checkShivamActivity() {
  const tables = ['orders', 'order_items', 'cart_items', 'wishlist_items', 'reviews'];
  for (const t of tables) {
    try {
      const res = await sPool.query(`SELECT count(*) FROM ${t}`);
      console.log(`Shivam ${t}: ${res.rows[0].count}`);
    } catch (e) {
      console.log(`Shivam ${t}: ${e.message}`);
    }
  }
  await sPool.end();
}

checkShivamActivity().catch(console.error);
