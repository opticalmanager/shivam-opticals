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
  const file1Path = 'D:\\Downloads\\frames_stock_details_part1.csv';
  const file2Path = 'D:\\Downloads\\frames_stock_details_complete_640_items.csv';
  const file3Path = 'D:\\Downloads\\frames_sunglass_stock_details.csv';

  const f1 = parseCsv(file1Path);
  const f2 = parseCsv(file2Path);
  const f3 = parseCsv(file3Path);

  console.log('================ RAW FILE COUNTS ================');
  console.log(`File 1: frames_stock_details_part1.csv          -> ${f1.length} items`);
  console.log(`File 2: frames_stock_details_complete_640_items.csv -> ${f2.length} items`);
  console.log(`File 3: frames_sunglass_stock_details.csv       -> ${f3.length} items`);
  const rawSum = f1.length + f2.length + f3.length;
  console.log(`Total Raw Records across all 3 files:           -> ${rawSum} rows`);

  // Track raw sources
  const allRawItems = [
    ...f1.map((r, i) => ({ ...r, _source: 'File 1 (frames_part1)', _idx: i + 1 })),
    ...f2.map((r, i) => ({ ...r, _source: 'File 2 (frames_complete_640)', _idx: i + 1 })),
    ...f3.map((r, i) => ({ ...r, _source: 'File 3 (sunglasses)', _idx: i + 1 })),
  ];

  // Check overlap between File 1 and File 2
  const f2Codes = new Set(f2.map(r => (r['ITEM CODE'] || '').trim().toUpperCase()));
  const f1Only = f1.filter(r => !f2Codes.has((r['ITEM CODE'] || '').trim().toUpperCase()));
  console.log(`\nItems in File 1 that are NOT in File 2: ${f1Only.length}`);

  // Deduplication logic:
  // An item is duplicate if it shares the same ITEM CODE (or same BRAND + MODEL DESC + COLOR)
  const uniqueItemsMap = new Map();
  const duplicateRecords = [];

  allRawItems.forEach(item => {
    const code = (item['ITEM CODE'] || '').trim().toUpperCase();
    const brand = (item.BRAND || '').trim().toUpperCase();
    const desc = (item['ITEM DESC.'] || '').trim().toUpperCase();
    const color = (item.COLOR || '').trim().toUpperCase();

    // Primary unique identifier: ITEM CODE. If code is absent, brand + desc + color.
    const key = code ? `CODE:${code}` : `DESC:${brand}|${desc}|${color}`;

    if (uniqueItemsMap.has(key)) {
      const existing = uniqueItemsMap.get(key);
      duplicateRecords.push({
        key,
        code,
        brand,
        desc,
        color,
        firstSeenIn: existing._source,
        duplicateIn: item._source,
      });
    } else {
      uniqueItemsMap.set(key, item);
    }
  });

  const deduplicatedItems = Array.from(uniqueItemsMap.values());
  console.log('\n================ DEDUPLICATION AUDIT ================');
  console.log(`Total Raw Entries:             ${allRawItems.length}`);
  console.log(`Total Duplicate Entries Cut:   ${duplicateRecords.length}`);
  console.log(`Total Unique Physical Products:${deduplicatedItems.length}`);

  // Breakdown of where duplicates came from:
  const dupBySources = {};
  duplicateRecords.forEach(d => {
    const route = `${d.firstSeenIn} == duplicate in ==> ${d.duplicateIn}`;
    dupBySources[route] = (dupBySources[route] || 0) + 1;
  });
  console.log('\nDuplicate occurrences by file comparison:');
  console.table(dupBySources);

  // Check if any internal duplicates exist in File 2 or File 3 individually
  const f2InternalDups = [];
  const f2Seen = new Set();
  f2.forEach(r => {
    const code = (r['ITEM CODE'] || '').trim().toUpperCase();
    if (f2Seen.has(code)) f2InternalDups.push(code);
    else f2Seen.add(code);
  });
  console.log(`Internal duplicates within File 2 alone: ${f2InternalDups.length}`);

  const f3InternalDups = [];
  const f3Seen = new Set();
  f3.forEach(r => {
    const code = (r['ITEM CODE'] || '').trim().toUpperCase();
    if (f3Seen.has(code)) f3InternalDups.push(code);
    else f3Seen.add(code);
  });
  console.log(`Internal duplicates within File 3 alone: ${f3InternalDups.length}`);

  // Cross-overlap between File 2 and File 3
  const f2AndF3Overlap = f3.filter(r => f2Seen.has((r['ITEM CODE'] || '').trim().toUpperCase()));
  console.log(`Overlap between Frames (File 2) and Sunglasses (File 3): ${f2AndF3Overlap.length}`);

  // Now cross-reference the UNIQUE deduplicated items against the PostgreSQL database
  const res = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, c.name as category_name, p.base_price, p.specs
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
  `);
  const dbProducts = res.rows;

  let exactOrModelMatches = 0;
  let brandPresentButModelMissing = 0;
  let brandMissingEntirely = 0;

  const statsByBrand = {};
  const matchedList = [];
  const missingList = [];

  deduplicatedItems.forEach(row => {
    const brand = (row.BRAND || 'UNKNOWN').trim().toUpperCase();
    const code = (row['ITEM CODE'] || '').trim();
    const desc = (row['ITEM DESC.'] || '').trim();
    const color = (row.COLOR || '').trim();
    const price = parseFloat(row.PRICE) || 0;
    const isSunglasses = row._source.includes('sunglasses');

    if (!statsByBrand[brand]) {
      statsByBrand[brand] = {
        total: 0,
        matched: 0,
        missing: 0,
        frames: 0,
        sunglasses: 0
      };
    }
    statsByBrand[brand].total++;
    if (isSunglasses) statsByBrand[brand].sunglasses++;
    else statsByBrand[brand].frames++;

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

  await pool.end();

  console.log('\n================ FINAL DEDUPLICATED WEBSITE RECONCILIATION ================');
  console.log(`Total Unique Products Across All 3 Files:  ${deduplicatedItems.length}`);
  console.log(`Already Present in Website Inventory:      ${exactOrModelMatches} (${((exactOrModelMatches / deduplicatedItems.length) * 100).toFixed(1)}%)`);
  console.log(`Left to Add to Website:                   ${brandPresentButModelMissing + brandMissingEntirely} (${(((brandPresentButModelMissing + brandMissingEntirely) / deduplicatedItems.length) * 100).toFixed(1)}%)`);
  console.log(`  - New Models in Existing DB Brands:     ${brandPresentButModelMissing}`);
  console.log(`  - Completely New Brands to Ingest:      ${brandMissingEntirely}`);

  console.log('\n================ COMPLETE BRAND SUMMARY ================');
  const summaryTable = Object.entries(statsByBrand).map(([brand, s]) => ({
    brand,
    total: s.total,
    frames: s.frames,
    sunglasses: s.sunglasses,
    matched: s.matched,
    missing: s.missing,
    status: s.matched > 0 ? (s.missing === 0 ? 'Fully Matched' : 'Active (New Models to Add)') : (s.sunglasses > 0 && ['TOMMY HILFIGER', 'ARMANI EXCHANGE', 'FRENCH CONNECTION', 'BOSS'].includes(brand) ? 'Active DB Brand' : (['ARMANI EXCHANGE', 'BURBERRY', 'BOSS', 'FRENCH CONNECTION', 'TOMMY HILFIGER'].includes(brand) ? 'Active DB Brand' : 'New Brand'))
  })).sort((a, b) => b.total - a.total);

  console.table(summaryTable);

  fs.writeFileSync('scripts/audit_deduplicated_final.json', JSON.stringify({
    rawSum,
    file1Count: f1.length,
    file2Count: f2.length,
    file3Count: f3.length,
    duplicatesCut: duplicateRecords.length,
    totalUnique: deduplicatedItems.length,
    matchedCount: exactOrModelMatches,
    missingCount: brandPresentButModelMissing + brandMissingEntirely,
    existingBrandsMissing: brandPresentButModelMissing,
    newBrandsMissing: brandMissingEntirely,
    summaryTable
  }, null, 2));
}

run().catch(console.error);
