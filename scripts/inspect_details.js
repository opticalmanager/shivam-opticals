const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else current += char;
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
  }
  return rows;
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function analyzeDetails() {
  const framesPath = 'D:\\Downloads\\frames_stock_details_part1.csv';
  const sunglassesPath = 'D:\\Downloads\\frames_sunglass_stock_details.csv';

  const frames = parseCsv(framesPath);
  const sunglasses = parseCsv(sunglassesPath);

  const res = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, c.name as category_name, p.base_price, p.specs
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    ORDER BY b.name, p.name
  `);
  const dbProducts = res.rows;
  fs.writeFileSync('scripts/all_db_products.json', JSON.stringify(dbProducts, null, 2));

  console.log(`Saved ${dbProducts.length} DB products to scripts/all_db_products.json.`);

  // Let's inspect Carrera in DB vs Carrera in frames CSV
  const dbCarrera = dbProducts.filter(p => (p.brand_name || '').toLowerCase().includes('carrera'));
  console.log(`DB Carrera products count: ${dbCarrera.length}`);
  console.log('Sample DB Carrera names:', dbCarrera.slice(0, 5).map(p => ({ name: p.name, slug: p.slug })));

  const csvCarreraFrames = frames.filter(f => (f.BRAND || '').toLowerCase().includes('carrera'));
  console.log(`CSV Carrera frames count: ${csvCarreraFrames.length}`);
  console.log('Sample CSV Carrera frame descriptions:', csvCarreraFrames.slice(0, 5).map(f => ({ code: f['ITEM CODE'], desc: f['ITEM DESC.'], color: f.COLOR, price: f.PRICE })));

  // Let's inspect Rayban in DB vs Rayban in frames CSV
  const dbRayban = dbProducts.filter(p => (p.brand_name || '').toLowerCase().includes('ray'));
  console.log(`\nDB Ray-Ban products count: ${dbRayban.length}`);
  console.log('Sample DB Ray-Ban names:', dbRayban.slice(0, 5).map(p => ({ name: p.name, slug: p.slug })));

  const csvRaybanFrames = frames.filter(f => (f.BRAND || '').toLowerCase().includes('ray'));
  console.log(`CSV Ray-Ban frames count: ${csvRaybanFrames.length}`);
  console.log('Sample CSV Ray-Ban frame descriptions:', csvRaybanFrames.slice(0, 5).map(f => ({ code: f['ITEM CODE'], desc: f['ITEM DESC.'], color: f.COLOR, price: f.PRICE })));

  await pool.end();
}

analyzeDetails().catch(err => {
  console.error(err);
  pool.end();
});
