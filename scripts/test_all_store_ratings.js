const https = require('https');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

function fetchHtml(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function testAllDomains() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT DISTINCT ON (SPLIT_PART(source_url, '/', 3)) source_url, slug, name
      FROM public.products
      WHERE is_active = true AND source_url IS NOT NULL;
    `);

    console.log(`Found ${res.rows.length} unique domain samples:`);
    for (const r of res.rows) {
      console.log(`\nTesting ${r.source_url} ...`);
      const html = await fetchHtml(r.source_url);
      
      // Look for loox data
      const looxMatch = html.match(/data-loox-rating=['"]([^'"]+)['"]\s+data-loox-raters=['"]([^'"]+)['"]/i);
      const looxAlt = html.match(/data-rating=['"]([^'"]+)['"]/i);
      
      // Look for judge.me
      const jmMatch = html.match(/data-average-rating=['"]([^'"]+)['"]\s+data-number-of-reviews=['"]([^'"]+)['"]/i) ||
                      html.match(/data-score=['"]([^'"]+)['"]/i);

      // Look for JSON-LD aggregateRating
      const ldMatch = html.match(/"aggregateRating":\s*\{[^}]*"ratingValue":\s*"?([0-9.]+)"?[^}]*"reviewCount":\s*"?([0-9]+)"?/i) ||
                      html.match(/"ratingValue":\s*"?([0-9.]+)"?[^}]*"ratingCount":\s*"?([0-9]+)"?/i);

      // Look for star-rating style
      const starStyleMatch = html.match(/--star-rating:\s*([0-9.]+)/i);

      // Look for yotpo
      const yotpoMatch = html.match(/class="[^"]*yotpo-bottomline[^"]*"[^>]*data-rating="([^"]+)"/i);

      console.log('Result for', new URL(r.source_url).hostname, ':');
      console.log('  loox:', looxMatch ? { rating: looxMatch[1], count: looxMatch[2] } : null);
      console.log('  judge.me:', jmMatch ? jmMatch[0] : null);
      console.log('  jsonLd:', ldMatch ? { rating: ldMatch[1], count: ldMatch[2] } : null);
      console.log('  starStyle:', starStyleMatch ? starStyleMatch[1] : null);
      console.log('  yotpo:', yotpoMatch ? yotpoMatch[1] : null);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

testAllDomains().catch(console.error);
