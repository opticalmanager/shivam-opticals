const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Extract all viable price tokens from raw line
function extractAllPossiblePrices(rawText, parsedPrice) {
  const prices = new Set();
  if (parsedPrice && parsedPrice >= 1500 && parsedPrice <= 40000) {
    prices.add(parsedPrice);
  }

  // Look for 4 to 5 digit numbers in raw text
  // e.g. "6090", "12290", "9500", "8700", "13490"
  const tokens = rawText.match(/\b\d{4,5}\b/g) || [];
  for (const t of tokens) {
    const num = Number(t);
    // Optical frame prices generally fall between 2,500 and 35,000
    if (num >= 2500 && num <= 35000) {
      prices.add(num);
    }
  }

  // Also check for numbers like 13.390 or 9.500 where decimal was OCR-inserted
  const decimalTokens = rawText.match(/\b\d{1,2}\.\d{3}\b/g) || [];
  for (const dt of decimalTokens) {
    const num = Number(dt.replace('.', ''));
    if (num >= 2500 && num <= 35000) {
      prices.add(num);
    }
  }

  return [...prices];
}

async function auditPrices() {
  const inventory = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));
  console.log(`Loaded ${inventory.length} raw PDF inventory rows.`);

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand_name, p.base_price, p.original_price
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY b.name ASC, p.name ASC;
    `);

    const products = res.rows;
    console.log(`Auditing ${products.length} active database products against raw PDF inventory text...`);

    const matches = [];
    const mismatches = [];
    const notFoundInPdf = [];

    for (const prod of products) {
      const pSlug = prod.slug.toLowerCase();
      const pName = prod.name.toLowerCase();
      const pBrand = (prod.brand_name || '').toLowerCase();
      const dbPrice = Number(prod.base_price);
      const dbMrp = Number(prod.original_price);

      // Extract model digits
      const digitsList = (pSlug + ' ' + pName).match(/\d{3,5}/g) || [];

      // Find candidates in extracted inventory
      const candidates = inventory.filter(item => {
        const iBrand = (item.brand || '').toLowerCase();
        const iModel = (item.model || '').toLowerCase();
        const iRaw = (item.rawText || '').toLowerCase();

        // Brand matching
        const brandMatch = 
          (pBrand.includes('ray') && (iBrand.includes('ray') || iRaw.includes('rb'))) ||
          (pBrand.includes('carrera') && (iBrand.includes('carrera') || iRaw.includes('ca'))) ||
          (pBrand.includes('burberry') && (iBrand.includes('burberry') || iRaw.includes('b-') || iRaw.includes('b1') || iRaw.includes('b2') || iRaw.includes('b3') || iRaw.includes('b4'))) ||
          (pBrand.includes('vogue') && (iBrand.includes('vogue') || iRaw.includes('vo'))) ||
          (pBrand.includes('tommy') && (iBrand.includes('tommy') || iRaw.includes('th'))) ||
          (pBrand.includes('french') && (iBrand.includes('french') || iRaw.includes('fc'))) ||
          (pBrand.includes('armani exchange') && (iBrand.includes('exchange') || iRaw.includes('ax'))) ||
          (pBrand.includes('emporio') && (iBrand.includes('emporio') || iRaw.includes('ea'))) ||
          (pBrand.includes('boss') && (iBrand.includes('boss') || iRaw.includes('boss')));

        if (!brandMatch) return false;

        // Model matching
        for (const d of digitsList) {
          if (iModel.includes(d) || iRaw.includes(d)) return true;
        }

        return pSlug.includes(normalize(iModel)) || pName.includes(normalize(iModel));
      });

      if (candidates.length > 0) {
        // Collect candidate prices across all matched raw rows
        const candidatePrices = [];
        candidates.forEach(c => {
          const cp = extractAllPossiblePrices(c.rawText, Number(c.price));
          candidatePrices.push(...cp);
        });

        const uniquePrices = [...new Set(candidatePrices)];
        const exactMatch = uniquePrices.find(pr => Math.abs(pr - dbPrice) < 1.0);

        if (exactMatch !== undefined) {
          matches.push({
            product: prod.name,
            brand: prod.brand_name,
            slug: prod.slug,
            dbPrice,
            pdfPrice: exactMatch,
            rawText: candidates[0].rawText
          });
        } else {
          mismatches.push({
            product: prod.name,
            brand: prod.brand_name,
            slug: prod.slug,
            dbPrice,
            candidatePdfPrices: uniquePrices,
            rawTexts: candidates.map(c => c.rawText)
          });
        }
      } else {
        notFoundInPdf.push({
          product: prod.name,
          brand: prod.brand_name,
          slug: prod.slug,
          dbPrice
        });
      }
    }

    console.log('\n======================================================');
    console.log(`PRICE AUDIT RESULTS (${products.length} Products):`);
    console.log(`✓ Exact Price Matches with PDF Raw Sheets: ${matches.length}`);
    console.log(`! Price Discrepancies to Inspect: ${mismatches.length}`);
    console.log(`- Not directly mapped by model digits: ${notFoundInPdf.length}`);
    console.log('======================================================');

    if (mismatches.length > 0) {
      console.log('\n--- PRICE DISCREPANCIES DETAILED ---');
      mismatches.forEach(m => {
        console.log(`[${m.brand}] ${m.product} (${m.slug})`);
        console.log(`   -> DB Price: ₹${m.dbPrice}`);
        console.log(`   -> PDF Candidate Prices: ₹${m.candidatePdfPrices.join(', ₹')}`);
        console.log(`   -> PDF Raw Text: ${m.rawTexts.slice(0, 3).join(' | ')}\n`);
      });
    }

    if (notFoundInPdf.length > 0) {
      console.log('\n--- NOT DIRECTLY FOUND BY DIGITS ---');
      notFoundInPdf.forEach(n => {
        console.log(`[${n.brand}] ${n.product} (${n.slug}) -> DB Price: ₹${n.dbPrice}`);
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

auditPrices().catch(console.error);
