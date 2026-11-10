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

// Extract model number from description (e.g. "AX 1070 BLACK" -> "1070", "RB 3025I" -> "3025", "B 3163" -> "3163")
function extractModelNumbers(desc) {
  if (!desc) return [];
  const s = desc.toUpperCase();
  const results = [];
  
  // Standard models like RB3025, B3163, CA311, AX1070
  const modelRegex = /(?:RB|AX|CA|TH|VO|B|FC|BE|BOSS|HUGO)?\s*([0-9]{3,5}[A-Z]{0,2})/gi;
  let m;
  while ((m = modelRegex.exec(s)) !== null) {
    if (m[1] && m[1].length >= 3) {
      results.push(m[1].toLowerCase());
    }
  }

  // Also extract any 4-digit numbers
  const digits = s.match(/\b\d{4}\b/g) || [];
  digits.forEach(d => results.push(d.toLowerCase()));

  return [...new Set(results)];
}

async function run() {
  const frames = parseCsv('D:\\Downloads\\frames_stock_details_part1.csv');
  const sunglasses = parseCsv('D:\\Downloads\\frames_sunglass_stock_details.csv');

  const res = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, c.name as category_name, p.base_price, p.specs
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
  `);
  const dbProducts = res.rows;

  console.log('=== DETAILED MATCHING AUDIT ===\n');

  function analyzeDataset(dataset, typeLabel) {
    let exactOrModelMatches = 0;
    let brandPresentButModelMissing = 0;
    let brandMissingEntirely = 0;

    const matchedList = [];
    const brandPresentMissingList = [];
    const brandMissingList = [];

    const statsByBrand = {};

    dataset.forEach(row => {
      const brand = (row.BRAND || 'UNKNOWN').trim().toUpperCase();
      const code = (row['ITEM CODE'] || '').trim();
      const desc = (row['ITEM DESC.'] || '').trim();
      const color = (row.COLOR || '').trim();
      const price = parseFloat(row.PRICE) || 0;

      if (!statsByBrand[brand]) {
        statsByBrand[brand] = { total: 0, matched: 0, missing: 0 };
      }
      statsByBrand[brand].total++;

      // Check if this brand exists in our DB
      const dbBrandProducts = dbProducts.filter(p => {
        const dbB = (p.brand_name || '').toUpperCase();
        if (brand === 'RAYBAN' && dbB.includes('RAY-BAN')) return true;
        if (brand === 'ARMANI EXCHANGE' && dbB.includes('ARMANI EXCHANGE')) return true;
        if (brand === 'BURBERRY' && dbB.includes('BURBERRY')) return true;
        if (brand === 'CARRERA' && dbB.includes('CARRERA')) return true;
        if (brand === 'TOMMY HILFIGER' && dbB.includes('TOMMY HILFIGER')) return true;
        if (brand === 'FRENCH CONNECTION' && dbB.includes('FRENCH CONNECTION')) return true;
        if (brand === 'BOSS' && dbB.includes('BOSS')) return true;
        return dbB === brand;
      });

      if (dbBrandProducts.length === 0) {
        brandMissingEntirely++;
        statsByBrand[brand].missing++;
        brandMissingList.push({ brand, code, desc, color, price });
        return;
      }

      // Brand exists in DB, now check if model/item exists
      const descNorm = normalize(desc);
      const codeNorm = normalize(code);
      const modelNums = extractModelNumbers(desc);

      let found = dbBrandProducts.find(p => {
        const pNameNorm = normalize(p.name);
        const pSlugNorm = normalize(p.slug);
        const pModelNorm = normalize(p.specs?.model_number || '');

        // Match by item code if slug or name has it
        if (codeNorm && (pSlugNorm.includes(codeNorm) || pNameNorm.includes(codeNorm))) {
          return true;
        }

        // Match by description
        if (descNorm && (pNameNorm.includes(descNorm) || descNorm.includes(pNameNorm) || pSlugNorm.includes(descNorm))) {
          return true;
        }

        // Match by model numbers (e.g. 3025, 2140, 5389, 7091)
        for (const num of modelNums) {
          if (pNameNorm.includes(num) || pSlugNorm.includes(num) || pModelNorm.includes(num)) {
            return true;
          }
        }

        return false;
      });

      if (found) {
        exactOrModelMatches++;
        statsByBrand[brand].matched++;
        matchedList.push({
          csvItem: { brand, code, desc, color, price },
          dbMatch: { id: found.id, name: found.name, slug: found.slug, price: found.base_price }
        });
      } else {
        brandPresentButModelMissing++;
        statsByBrand[brand].missing++;
        brandPresentMissingList.push({ brand, code, desc, color, price });
      }
    });

    return {
      total: dataset.length,
      exactOrModelMatches,
      brandPresentButModelMissing,
      brandMissingEntirely,
      totalMissing: brandPresentButModelMissing + brandMissingEntirely,
      statsByBrand,
      matchedList,
      brandPresentMissingList,
      brandMissingList
    };
  }

  const framesAudit = analyzeDataset(frames, 'Frames');
  const sunglassesAudit = analyzeDataset(sunglasses, 'Sunglasses');

  console.log('---------------------------------------------------------');
  console.log('1. OPTICAL FRAMES STOCK (frames_stock_details_part1.csv)');
  console.log('---------------------------------------------------------');
  console.log(`Total items in CSV:                   ${framesAudit.total}`);
  console.log(`Already Present in Website Inventory: ${framesAudit.exactOrModelMatches}`);
  console.log(`Left to Add (Missing):                ${framesAudit.totalMissing}`);
  console.log(`  - Existing Brands with new models:  ${framesAudit.brandPresentButModelMissing}`);
  console.log(`  - Completely New Brands to add:     ${framesAudit.brandMissingEntirely}`);

  console.log('\nFrames Breakdown by Brand:');
  console.table(framesAudit.statsByBrand);

  console.log('---------------------------------------------------------');
  console.log('2. SUNGLASSES STOCK (frames_sunglass_stock_details.csv)');
  console.log('---------------------------------------------------------');
  console.log(`Total items in CSV:                   ${sunglassesAudit.total}`);
  console.log(`Already Present in Website Inventory: ${sunglassesAudit.exactOrModelMatches}`);
  console.log(`Left to Add (Missing):                ${sunglassesAudit.totalMissing}`);
  console.log(`  - Existing Brands with new models:  ${sunglassesAudit.brandPresentButModelMissing}`);
  console.log(`  - Completely New Brands to add:     ${sunglassesAudit.brandMissingEntirely}`);

  console.log('\nSunglasses Breakdown by Brand:');
  console.table(sunglassesAudit.statsByBrand);

  console.log('---------------------------------------------------------');
  console.log('3. OVERALL COMBINED INVENTORY COMPARISON');
  console.log('---------------------------------------------------------');
  const combinedTotal = framesAudit.total + sunglassesAudit.total;
  const combinedMatched = framesAudit.exactOrModelMatches + sunglassesAudit.exactOrModelMatches;
  const combinedMissing = framesAudit.totalMissing + sunglassesAudit.totalMissing;
  const combinedNewBrands = framesAudit.brandMissingEntirely + sunglassesAudit.brandMissingEntirely;
  const combinedExistingBrandsMissing = framesAudit.brandPresentButModelMissing + sunglassesAudit.brandPresentButModelMissing;

  console.log(`Total CSV Items Analyzed:              ${combinedTotal}`);
  console.log(`Total Already Present on Website:      ${combinedMatched} (${((combinedMatched / combinedTotal) * 100).toFixed(1)}%)`);
  console.log(`Total Left to Add:                     ${combinedMissing} (${((combinedMissing / combinedTotal) * 100).toFixed(1)}%)`);
  console.log(`  - Items from Brands already in DB:   ${combinedExistingBrandsMissing}`);
  console.log(`  - Items from New Brands:             ${combinedNewBrands}`);

  fs.writeFileSync('scripts/audit_breakdown_full.json', JSON.stringify({
    framesAudit,
    sunglassesAudit,
    combined: {
      total: combinedTotal,
      matched: combinedMatched,
      missing: combinedMissing,
      newBrandsItems: combinedNewBrands,
      existingBrandsMissingItems: combinedExistingBrandsMissing
    }
  }, null, 2));

  console.log('\nFull breakdown written to scripts/audit_breakdown_full.json');

  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
});
