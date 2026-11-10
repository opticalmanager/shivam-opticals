const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parse handling quotes if any
    const rawLine = lines[i];
    const parts = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    parts.push(cur.trim());
    
    if (parts.length >= 3) {
      records.push({
        brand: (parts[0] || '').replace(/^"|"$/g, '').trim(),
        itemCode: (parts[1] || '').replace(/^"|"$/g, '').trim(),
        itemDesc: (parts[2] || '').replace(/^"|"$/g, '').trim(),
        color: (parts[3] || '').replace(/^"|"$/g, '').trim(),
        price: (parts[4] || '').replace(/^"|"$/g, '').trim(),
        cp: (parts[5] || '').replace(/^"|"$/g, '').trim(),
        st: (parts[6] || '').replace(/^"|"$/g, '').trim(),
        dated: (parts[7] || '').replace(/^"|"$/g, '').trim(),
        rawLine: rawLine.trim()
      });
    }
  }
  return records;
}

async function run() {
  const file1Path = 'D:/Downloads/frames_stock_details_part1.csv';
  const file2Path = 'D:/Downloads/frames_stock_details_complete_640_items.csv';
  const file3Path = 'D:/Downloads/frames_sunglass_stock_details.csv';

  const f1 = parseCSV(file1Path);
  const f2 = parseCSV(file2Path);
  const f3 = parseCSV(file3Path);

  console.log('=== RAW ROW COUNTS ===');
  console.log(`File 1 (frames_part1):          ${f1.length} rows`);
  console.log(`File 2 (frames_complete_640):   ${f2.length} rows`);
  console.log(`File 3 (sunglasses):            ${f3.length} rows`);
  console.log(`Total Raw Rows across 3 files:  ${f1.length + f2.length + f3.length}`);

  // Check overlap between f1 and f2
  const f1Codes = new Set(f1.map(r => r.itemCode));
  const f2Codes = new Set(f2.map(r => r.itemCode));
  const f3Codes = new Set(f3.map(r => r.itemCode));

  let inF1NotF2 = f1.filter(r => !f2Codes.has(r.itemCode));
  let inF2NotF1 = f2.filter(r => !f1Codes.has(r.itemCode));
  let inF3AndF1 = f3.filter(r => f1Codes.has(r.itemCode));
  let inF3AndF2 = f3.filter(r => f2Codes.has(r.itemCode));

  console.log('\n=== CROSS-FILE ITEM CODE OVERLAPS ===');
  console.log(`Items in Part 1 but NOT in Complete 640: ${inF1NotF2.length}`);
  if (inF1NotF2.length > 0) {
    console.log('Sample in Part 1 not in 640:', inF1NotF2.slice(0, 5));
  }
  console.log(`Items in Complete 640 but NOT in Part 1: ${inF2NotF1.length}`);
  console.log(`Overlap between Sunglasses and Part 1:   ${inF3AndF1.length}`);
  console.log(`Overlap between Sunglasses and 640:      ${inF3AndF2.length}`);

  // Check duplicates by various composite keys
  // Key 1: itemCode
  // Key 2: brand + itemDesc + color
  // Let's test all three files combined
  const allRows = [
    ...f1.map(r => ({ ...r, sourceFile: 'frames_part1' })),
    ...f2.map(r => ({ ...r, sourceFile: 'frames_complete_640' })),
    ...f3.map(r => ({ ...r, sourceFile: 'sunglasses' }))
  ];

  // Internal duplicates within each file
  ['frames_part1', 'frames_complete_640', 'sunglasses'].forEach(sf => {
    const subset = allRows.filter(r => r.sourceFile === sf);
    const seen = new Map();
    let dupCount = 0;
    subset.forEach(r => {
      const k = r.itemCode || (r.brand + '|' + r.itemDesc + '|' + r.color);
      if (seen.has(k)) {
        dupCount++;
      } else {
        seen.set(k, true);
      }
    });
    console.log(`Internal duplicates in ${sf}: ${dupCount}`);
  });

  // Deduplication across all files
  // We identify unique physical products by itemCode if non-empty, else brand + itemDesc + color
  const uniqueCatalog = new Map();
  const duplicateEntries = [];

  for (const row of allRows) {
    const primaryKey = row.itemCode ? row.itemCode.toUpperCase() : `${row.brand.toUpperCase()}|${row.itemDesc.toUpperCase()}|${row.color.toUpperCase()}`;
    if (uniqueCatalog.has(primaryKey)) {
      duplicateEntries.push({
        key: primaryKey,
        original: uniqueCatalog.get(primaryKey),
        duplicate: row
      });
    } else {
      uniqueCatalog.set(primaryKey, row);
    }
  }

  console.log('\n=== DEDUPLICATION RESULTS ===');
  console.log(`Total Combined Raw Rows:        ${allRows.length}`);
  console.log(`Total Duplicate Entries Found:  ${duplicateEntries.length}`);
  console.log(`Total UNIQUE Stock Products:    ${uniqueCatalog.size}`);

  // Let's also check if there are duplicate model numbers with different itemCodes
  const modelKeyMap = new Map();
  let duplicateModelDescCount = 0;
  for (const [key, item] of uniqueCatalog.entries()) {
    const mk = `${item.brand.toUpperCase()}|${item.itemDesc.toUpperCase()}|${item.color.toUpperCase()}`;
    if (modelKeyMap.has(mk)) {
      duplicateModelDescCount++;
    } else {
      modelKeyMap.set(mk, item);
    }
  }
  console.log(`Unique by Brand + Desc + Color: ${modelKeyMap.size} (difference of ${uniqueCatalog.size - modelKeyMap.size} items with same desc/color but different itemCode)`);

  // Now query database to match uniqueCatalog
  const client = await pool.connect();
  const dbProductsRes = await client.query(`
    SELECT p.id, p.name, p.brand_id, b.name as brand_name, c.name as category_name, p.is_active, p.created_at
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
  `);
  const dbVariantsRes = await client.query(`
    SELECT pv.id, pv.product_id, pv.sku, pv.color_name, pv.color_code, pv.price_override
    FROM product_variants pv
  `);
  client.release();
  await pool.end();

  const dbProducts = dbProductsRes.rows;
  const dbVariants = dbVariantsRes.rows;

  console.log(`\nLive DB Products: ${dbProducts.length}`);
  console.log(`Live DB Variants: ${dbVariants.length}`);

  // Build match index from DB
  const dbSkus = new Set(dbVariants.map(v => (v.sku || '').toUpperCase().trim()).filter(Boolean));
  
  // Extract alphanumeric tokens from product names
  const dbNameTokens = dbProducts.map(p => {
    const nameUpper = (p.name || '').toUpperCase();
    const brandUpper = (p.brand_name || '').toUpperCase();
    return {
      product: p,
      nameUpper,
      brandUpper,
      tokens: nameUpper.split(/[\s\-_/,]+/).filter(t => t.length >= 2)
    };
  });

  function matchInDB(item) {
    const itemCodeUpper = (item.itemCode || '').toUpperCase().trim();
    if (itemCodeUpper && dbSkus.has(itemCodeUpper)) {
      return { matched: true, type: 'exact_sku', matchVal: itemCodeUpper };
    }

    const brandUpper = (item.brand || '').toUpperCase().trim();
    const descUpper = (item.itemDesc || '').toUpperCase().trim();

    // Check desc tokens in DB
    // e.g. desc: "AX 1070 BLACK" -> tokens: ["AX", "1070", "BLACK"]
    // "RB 3025 AVIATOR" -> ["RB", "3025", "AVIATOR"]
    const descParts = descUpper.split(/[\s\-_/,]+/).filter(t => t.length >= 3 && !['BLACK', 'GOLD', 'GUN', 'BROWN', 'BLUE', 'SILVER', 'MATTE', 'SHINY', 'FRAME', 'SUNGLASS'].includes(t));
    
    // Find candidate products with same brand
    const candidates = dbNameTokens.filter(d => {
      if (brandUpper === 'RAYBAN' && d.brandUpper.includes('RAY-BAN')) return true;
      if (brandUpper.includes('RAY') && d.brandUpper.includes('RAY')) return true;
      if (brandUpper === 'CARRERA' && d.brandUpper.includes('CARRERA')) return true;
      if (brandUpper.includes('BURBERRY') && d.brandUpper.includes('BURBERRY')) return true;
      if (brandUpper.includes('TOMMY') && d.brandUpper.includes('TOMMY')) return true;
      if (brandUpper.includes('FRENCH') && d.brandUpper.includes('FRENCH')) return true;
      if (brandUpper.includes('ARMANI') && d.brandUpper.includes('ARMANI')) return true;
      return d.brandUpper === brandUpper;
    });

    for (const cand of candidates) {
      // Look for model match like "3025", "1070", "2140", "CA1134", "3166"
      for (const part of descParts) {
        if (/^\d{3,5}[A-Z]?$/.test(part) || /^RB\d{4}/.test(part) || /^CA\d{3,4}/.test(part) || /^B\d{4}/.test(part) || /^AX\d{4}/.test(part)) {
          if (cand.nameUpper.includes(part)) {
            return { matched: true, type: 'model_match', matchVal: part, productName: cand.product.name };
          }
        }
      }
    }

    return { matched: false };
  }

  let matchedCount = 0;
  let missingCount = 0;
  const brandStats = {};

  for (const [key, item] of uniqueCatalog.entries()) {
    const b = item.brand.toUpperCase().trim() || 'UNKNOWN';
    if (!brandStats[b]) {
      brandStats[b] = { total: 0, matched: 0, missing: 0, sourceTypes: new Set() };
    }
    brandStats[b].total++;
    brandStats[b].sourceTypes.add(item.sourceFile.includes('sunglass') ? 'Sunglasses' : 'Frames');

    const res = matchInDB(item);
    if (res.matched) {
      matchedCount++;
      brandStats[b].matched++;
    } else {
      missingCount++;
      brandStats[b].missing++;
    }
  }

  console.log('\n=== FINAL RECONCILIATION FOR UNIQUE DEDUPLICATED CATALOG ===');
  console.log(`Total Unique Items Analyzed:     ${uniqueCatalog.size}`);
  console.log(`Already Present on Website:      ${matchedCount} (${((matchedCount / uniqueCatalog.size) * 100).toFixed(1)}%)`);
  console.log(`Left to Add to Website:          ${missingCount} (${((missingCount / uniqueCatalog.size) * 100).toFixed(1)}%)`);

  console.log('\nBrand Breakdown Table:');
  console.table(Object.entries(brandStats).map(([brand, s]) => ({
    brand,
    total: s.total,
    matched: s.matched,
    missing: s.missing,
    category: Array.from(s.sourceTypes).join(', ')
  })).sort((a, b) => b.total - a.total));

  // Save report data
  fs.writeFileSync('scripts/audit_deduplicated_all_three_results.json', JSON.stringify({
    rawTotals: {
      part1: f1.length,
      complete640: f2.length,
      sunglasses: f3.length,
      sumRaw: allRows.length
    },
    deduplicatedTotals: {
      uniqueCatalogSize: uniqueCatalog.size,
      duplicateCount: duplicateEntries.length,
      matchedCount,
      missingCount
    },
    brandStats
  }, null, 2));

}

run().catch(console.error);
