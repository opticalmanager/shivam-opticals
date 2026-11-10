const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function auditAllProducts() {
  const res = await pool.query(`
    SELECT p.id, p.name, p.slug, 
      (SELECT url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) as primary_img,
      (SELECT count(*) FROM public.product_images pi WHERE pi.product_id = p.id) as total_imgs
    FROM public.products p
    ORDER BY p.name ASC
  `);

  console.log(`Auditing ${res.rows.length} products...`);
  const suspicious = [];
  for (const r of res.rows) {
    if (!r.primary_img || r.primary_img.includes('clean_frame') || r.primary_img.includes('banner') || r.primary_img.includes('placeholder')) {
      suspicious.push({ id: r.id, name: r.name, slug: r.slug, primary_img: r.primary_img, total_imgs: r.total_imgs });
    }
  }

  console.log(`\nSuspicious products count: ${suspicious.length}`);
  console.table(suspicious);

  // Also check if any product has ANY image containing banner/hero/clean_frame
  const badImages = await pool.query(`
    SELECT pi.id, pi.product_id, p.name, pi.url, pi.is_primary, pi.display_order
    FROM public.product_images pi
    JOIN public.products p ON p.id = pi.product_id
    WHERE pi.url ILIKE '%banner%' 
       OR pi.url ILIKE '%clean_frame%' 
       OR pi.url ILIKE '%crop%' 
       OR pi.url ILIKE '%inspect%'
       OR pi.url ILIKE '%placeholder%'
  `);
  console.log(`\nTotal bad/suspicious images in product_images: ${badImages.rows.length}`);
  console.table(badImages.rows);

  pool.end();
}

auditAllProducts().catch(err => {
  console.error(err);
  pool.end();
});
