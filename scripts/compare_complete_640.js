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

function extractModelNumbers(desc) {
  if (!desc) return [];
  const s = desc.toUpperCase();
  const results = [];
  const modelRegex = /(?:RB|AX|CA|TH|VO|B|FC|BE|BOSS|HUGO)?\s*([0-9]{3,5}[A-Z]{0,2})/gi;
  let m;
  while ((m = modelRegex.exec(s)) !== null) {
    if (m[1] && m[1].length >= 3) {
      results.push(m[1].toLowerCase());
    }
  }
  const digits = s.match(/\b\d{4}\b/g) || [];
  digits.forEach(d => results.push(d.toLowerCase()));
  return [...new Set(results)];
}

async function run() {
  const part1Path = 'D:\\Downloads\\frames_stock_details_part1.csv';
  const complete640Path = 'D:\\Downloads\\frames_stock_details_complete_640_items.csv';
  const sunglassesPath = 'D:\\Downloads\\frames_sunglass_stock_details.csv';

  const part1 = parseCsv(part1Path);
  const frames640 = parseCsv(complete640Path);
  const sunglasses = parseCsv(sunglassesPath);

  console.log(`Part 1 items: ${part1.length}`);
  console.log(`Complete 640 items: ${frames640.length}`);
  console.log(`Difference: ${frames640.length - part1.length} new items in complete file.`);

  // Find the 74 extra items
  const part1Codes = new Set(part1.map(r => r['ITEM CODE']?.trim()));
  const extraItems = frames640.filter(r => !part1Codes.has(r['ITEM CODE']?.trim()));
  console.log(`Found ${extraItems.length} items present in complete 640 but not in part 1:`);

  const extraBrandsCount = {};
  extraItems.forEach(r => {
    const b = (r.BRAND || 'UNKNOWN').trim().toUpperCase();
    extraBrandsCount[b] = (extraBrandsCount[b] || 0) + 1;
  });
  console.table(extraBrandsCount);

  // Fetch DB products & variants
  const res = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, c.name as category_name, p.base_price, p.specs
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
  `);
  const dbProducts = res.rows;

  function analyzeDataset(dataset) {
    let exactOrModelMatches = 0;
    let brandPresentButModelMissing = 0;
    let brandMissingEntirely = 0;

    const matchedList = [];
    const missingList = [];
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
        missingList.push({ brand, code, desc, color, price, reason: 'NEW_BRAND' });
        return;
      }

      const descNorm = normalize(desc);
      const codeNorm = normalize(code);
      const modelNums = extractModelNumbers(desc);

      let found = dbBrandProducts.find(p => {
        const pNameNorm = normalize(p.name);
        const pSlugNorm = normalize(p.slug);
        const pModelNorm = normalize(p.specs?.model_number || '');

        if (codeNorm && (pSlugNorm.includes(codeNorm) || pNameNorm.includes(codeNorm))) {
          return true;
        }
        if (descNorm && (pNameNorm.includes(descNorm) || descNorm.includes(pNameNorm) || pSlugNorm.includes(descNorm))) {
          return true;
        }
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
        missingList.push({ brand, code, desc, color, price, reason: 'MODEL_NOT_FOUND_IN_BRAND' });
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
      missingList
    };
  }

  console.log('\n=== AUDITING COMPLETE 640 FRAMES FILE ===');
  const framesAudit = analyzeDataset(frames640);

  console.log(`Total Frames in complete 640:           ${framesAudit.total}`);
  console.log(`Already Present in Website Inventory:   ${framesAudit.exactOrModelMatches}`);
  console.log(`Left to Add (Missing):                  ${framesAudit.totalMissing}`);
  console.log(`  - In Existing DB Brands:              ${framesAudit.brandPresentButModelMissing}`);
  console.log(`  - In Completely New Brands:           ${framesAudit.brandMissingEntirely}`);

  console.log('\n--- Frames 640 Breakdown by Brand ---');
  console.table(framesAudit.statsByBrand);

  console.log('\n=== AUDITING SUNGLASSES (287 ITEMS) ===');
  const sunglassesAudit = analyzeDataset(sunglasses);
  console.log(`Total Sunglasses:                       ${sunglassesAudit.total}`);
  console.log(`Already Present in Website Inventory:   ${sunglassesAudit.exactOrModelMatches}`);
  console.log(`Left to Add (Missing):                  ${sunglassesAudit.totalMissing}`);
  console.table(sunglassesAudit.statsByBrand);

  console.log('\n=== FINAL COMBINED TOTALS (COMPLETE 640 FRAMES + 287 SUNGLASSES) ===');
  const grandTotal = framesAudit.total + sunglassesAudit.total;
  const grandMatched = framesAudit.exactOrModelMatches + sunglassesAudit.exactOrModelMatches;
  const grandMissing = framesAudit.totalMissing + sunglassesAudit.totalMissing;
  const grandNewBrands = framesAudit.brandMissingEntirely + sunglassesAudit.brandMissingEntirely;
  const grandExistingMissing = framesAudit.brandPresentButModelMissing + sunglassesAudit.brandPresentButModelMissing;

  console.log(`Grand Total Inventory Items:            ${grandTotal}`);
  console.log(`Already Present on Website:             ${grandMatched} (${((grandMatched / grandTotal) * 100).toFixed(1)}%)`);
  console.log(`Left to Add to Website:                 ${grandMissing} (${((grandMissing / grandTotal) * 100).toFixed(1)}%)`);
  console.log(`  - Items from Brands already in DB:    ${grandExistingMissing}`);
  console.log(`  - Items from New Brands:              ${grandNewBrands}`);

  fs.writeFileSync('scripts/audit_complete_640_results.json', JSON.stringify({
    framesAudit,
    sunglassesAudit,
    grandSummary: {
      grandTotal,
      grandMatched,
      grandMissing,
      grandNewBrands,
      grandExistingMissing
    },
    extra74Items: extraItems
  }, null, 2));

  console.log('\nResults saved to scripts/audit_complete_640_results.json');
  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
});
