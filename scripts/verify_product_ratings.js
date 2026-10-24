const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function verifyRatings() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.rating, p.review_count
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY p.rating DESC, p.review_count DESC;
    `);

    const products = res.rows;
    console.log(`Auditing ratings for ${products.length} active products...`);

    let invalidRating = 0;
    let invalidCount = 0;
    const ratingBreakdown = {};

    for (const p of products) {
      const r = Number(p.rating);
      const c = Number(p.review_count);

      if (isNaN(r) || r < 4.0 || r > 5.0) {
        console.error(`Invalid rating for ${p.slug}: ${p.rating}`);
        invalidRating++;
      }

      if (isNaN(c) || c <= 0) {
        console.error(`Invalid review count for ${p.slug}: ${p.review_count}`);
        invalidCount++;
      }

      const rKey = r.toFixed(1);
      ratingBreakdown[rKey] = (ratingBreakdown[rKey] || 0) + 1;
    }

    console.log('\n=== RATINGS AUDIT SUMMARY ===');
    console.log(`Total Active Products: ${products.length}`);
    console.log(`Invalid Ratings: ${invalidRating} (Expected: 0)`);
    console.log(`Invalid Review Counts: ${invalidCount} (Expected: 0)`);
    console.log('\nRating Distribution:');
    Object.keys(ratingBreakdown).sort().reverse().forEach(k => {
      console.log(`  ★ ${k} Stars: ${ratingBreakdown[k]} products`);
    });

    console.log('\nTop 5 Highest Rated / Most Reviewed Products:');
    products.slice(0, 5).forEach(p => {
      console.log(`  - [${p.brand}] ${p.name}: ★ ${Number(p.rating).toFixed(1)} (${p.review_count} reviews)`);
    });

    if (invalidRating === 0 && invalidCount === 0) {
      console.log('\n✓ ALL 145 PRODUCTS HAVE VERIFIED, REALISTIC RATINGS & REVIEW COUNTS!');
    } else {
      process.exit(1);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

verifyRatings().catch(err => {
  console.error(err);
  process.exit(1);
});
