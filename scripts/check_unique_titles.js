const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.base_price, p.original_price
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY p.name ASC;
    `);

    console.log(`Total active products: ${res.rows.length}`);
    const titles = {};
    res.rows.forEach(r => {
      titles[r.name] = titles[r.name] || [];
      titles[r.name].push(r);
    });

    let dupCount = 0;
    for (const [title, prods] of Object.entries(titles)) {
      if (prods.length > 1) {
        dupCount++;
        console.log(`Duplicate title: "${title}" (${prods.length} products):`);
        prods.forEach(p => console.log(`   slug: ${p.slug} | price: ₹${p.base_price}`));
      }
    }
    if (dupCount === 0) {
      console.log('✓ ZERO DUPLICATE TITLES! Every product is completely unique.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

check();
