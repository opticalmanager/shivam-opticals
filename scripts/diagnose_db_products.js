const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.base_price, p.original_price, p.source_url, p.created_at
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY b.name, p.name ASC;
    `);

    const products = res.rows;
    console.log(`Total active products in DB: ${products.length}`);

    const titles = {};
    products.forEach(p => {
      titles[p.name] = titles[p.name] || [];
      titles[p.name].push(p);
    });

    console.log('\n--- IDENTICAL TITLE COLLAPSE CHECK ---');
    for (const [title, prods] of Object.entries(titles)) {
      if (prods.length > 1) {
        console.log(`\nTitle: "${title}" (${prods.length} products):`);
        prods.forEach(p => console.log(`   slug: ${p.slug} | brand: ${p.brand} | price: ₹${p.base_price} | src: ${p.source_url}`));
      }
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
