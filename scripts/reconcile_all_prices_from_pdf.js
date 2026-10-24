const fs = require('fs');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Load raw PDF inventory items
const inventory = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));

// Helper to clean model numbers
function cleanModelStr(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function analyzeAll() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.base_price, p.original_price, p.source_url
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY b.name, p.name ASC;
    `);

    const products = res.rows;
    console.log(`Analyzing ${products.length} active database products against PDF inventory...`);

    const detailedAudit = [];

    for (const p of products) {
      const pBrand = (p.brand || '').toUpperCase();
      const pSlug = p.slug.toUpperCase();
      const pName = p.name.toUpperCase();
      const dbPrice = Number(p.base_price);

      // Find all PDF rows for this brand
      const brandRows = inventory.filter(item => {
        const iBrand = (item.brand || '').toUpperCase();
        const iRaw = (item.rawText || '').toUpperCase();
        if (pBrand.includes('RAY') && (iBrand.includes('RAY') || iRaw.includes('RB'))) return true;
        if (pBrand.includes('CARRERA') && (iBrand.includes('CARRERA') || iRaw.includes('CA'))) return true;
        if (pBrand.includes('BURBERRY') && (iBrand.includes('BURBERRY') || iRaw.includes('B-') || iRaw.includes('B1') || iRaw.includes('B2') || iRaw.includes('B3') || iRaw.includes('B4'))) return true;
        if (pBrand.includes('TOMMY') && (iBrand.includes('TOMMY') || iRaw.includes('TH'))) return true;
        if (pBrand.includes('VOGUE') && (iBrand.includes('VOGUE') || iRaw.includes('VO'))) return true;
        if (pBrand.includes('ARMANI EXCHANGE') && (iBrand.includes('EXCHANGE') || iRaw.includes('AX'))) return true;
        if (pBrand.includes('EMPORIO') && (iBrand.includes('EMPORIO') || iRaw.includes('EA'))) return true;
        if (pBrand.includes('BOSS') && (iBrand.includes('BOSS') || iRaw.includes('BOSS'))) return true;
        if (pBrand.includes('FRENCH') && (iBrand.includes('FRENCH') || iRaw.includes('FC'))) return true;
        return false;
      });

      // Look for matches
      const matches = [];
      for (const r of brandRows) {
        const raw = r.rawText.toUpperCase();
        const rModel = cleanModelStr(r.model);
        
        // Extract numbers from model / slug
        const pNums = (pSlug + ' ' + pName).match(/\d{3,5}/g) || [];
        for (const num of pNums) {
          if (raw.includes(num) || rModel.includes(num)) {
            matches.push(r);
            break;
          }
        }
      }

      detailedAudit.push({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        dbPrice,
        dbMrp: Number(p.original_price),
        matchesCount: matches.length,
        matches: matches.map(m => ({
          model: m.model,
          color: m.color,
          parsedPrice: m.price,
          rawText: m.rawText
        }))
      });
    }

    fs.writeFileSync('scripts/detailed_price_audit.json', JSON.stringify(detailedAudit, null, 2));
    console.log('Detailed price audit written to scripts/detailed_price_audit.json');

  } finally {
    client.release();
    await pool.end();
  }
}

analyzeAll().catch(console.error);
