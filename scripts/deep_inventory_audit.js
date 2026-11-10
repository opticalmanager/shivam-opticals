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
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function cleanStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runAudit() {
  const framesPath = 'D:\\Downloads\\frames_stock_details_part1.csv';
  const sunglassesPath = 'D:\\Downloads\\frames_sunglass_stock_details.csv';

  const framesCsv = parseCsv(framesPath);
  const sunglassesCsv = parseCsv(sunglassesPath);

  // Read DB products
  const dbProductsRes = await pool.query(`
    SELECT p.id, p.name, p.slug, b.name as brand_name, p.base_price, p.original_price, 
           c.name as category_name, p.specs, p.color, p.color_variants, p.is_active
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.categories c ON c.id = p.category_id
  `);
  const dbProducts = dbProductsRes.rows;

  const dbVariantsRes = await pool.query(`
    SELECT pv.id, pv.product_id, pv.color_name, pv.sku, pv.stock_quantity, pv.price_override,
           p.name as product_name, p.slug as product_slug, b.name as brand_name
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
  `);
  const dbVariants = dbVariantsRes.rows;

  console.log(`Loaded ${dbProducts.length} DB products and ${dbVariants.length} DB variants.`);

  // Examine brands in DB
  const dbBrandsCount = {};
  dbProducts.forEach(p => {
    const b = (p.brand_name || 'UNKNOWN').toUpperCase();
    dbBrandsCount[b] = (dbBrandsCount[b] || 0) + 1;
  });
  console.log('\n--- Brands in DB Products ---');
  console.table(dbBrandsCount);

  // Let's also check data/products.ts by evaluating it or parsing it
  // In data/products.ts, let's see how many products are defined
  let staticProducts = [];
  try {
    const rawTs = fs.readFileSync('data/products.ts', 'utf8');
    // Extract objects from PRODUCTS array
    const idRegex = /id:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["'],\s*brand:\s*["']([^"']+)["']/g;
    let m;
    while ((m = idRegex.exec(rawTs)) !== null) {
      staticProducts.push({ id: m[1], name: m[2], brand: m[3] });
    }
    console.log(`Found ${staticProducts.length} static products in data/products.ts.`);
  } catch (err) {
    console.log('Error parsing data/products.ts:', err.message);
  }

  // Cross-matching function
  // We want to check each item in the CSV against the website inventory:
  // 1. By Item Code (e.g. FR00724A)
  // 2. By Item Description / Model (e.g. AX 1070, RB 3025, B 3163, etc.)
  // 3. By Brand + Model
  
  function matchItem(csvItem, isSunglass) {
    const brand = (csvItem.BRAND || '').trim();
    const itemCode = (csvItem['ITEM CODE'] || '').trim();
    const itemDesc = (csvItem['ITEM DESC.'] || '').trim();
    const color = (csvItem.COLOR || '').trim();
    const price = parseFloat(csvItem.PRICE) || 0;

    const brandClean = cleanStr(brand);
    const codeClean = cleanStr(itemCode);
    const descClean = cleanStr(itemDesc);

    // Check in DB Variants (SKU match)
    const varSkuMatch = dbVariants.find(v => {
      const vSku = cleanStr(v.sku);
      return vSku && (vSku === codeClean || vSku.includes(codeClean) || codeClean.includes(vSku));
    });
    if (varSkuMatch) {
      return { matchType: 'EXACT_SKU_MATCH', matchedItem: varSkuMatch, source: 'DB_VARIANT' };
    }

    // Check in DB Products (name or slug or specs)
    const dbMatch = dbProducts.find(p => {
      const pBrand = cleanStr(p.brand_name);
      const pName = cleanStr(p.name);
      const pSlug = cleanStr(p.slug);
      const pModel = cleanStr(p.specs?.model_number || '');

      // Does brand match?
      const brandMatches = !brandClean || pBrand === brandClean || (brandClean === 'RAYBAN' && pBrand === 'RAYBAN') || pBrand.includes(brandClean);

      // Model or Code match
      if (codeClean && (pSlug.includes(codeClean) || pName.includes(codeClean))) {
        return true;
      }

      if (brandMatches && descClean) {
        // e.g. "AX 1070" vs "AX 1070 BLACK"
        if (pName && (pName.includes(descClean) || descClean.includes(pName))) {
          return true;
        }
        if (pModel && (descClean.includes(pModel) || pModel.includes(descClean))) {
          return true;
        }
      }

      return false;
    });

    if (dbMatch) {
      return { matchType: 'DB_PRODUCT_MATCH', matchedItem: dbMatch, source: 'DB_PRODUCT' };
    }

    // Check in Static Products (data/products.ts)
    const staticMatch = staticProducts.find(sp => {
      const spBrand = cleanStr(sp.brand);
      const spName = cleanStr(sp.name);
      const spId = cleanStr(sp.id);

      if (codeClean && (spId.includes(codeClean) || spName.includes(codeClean))) {
        return true;
      }
      if (brandClean && spBrand === brandClean && descClean && (spName.includes(descClean) || descClean.includes(spName))) {
        return true;
      }
      return false;
    });

    if (staticMatch) {
      return { matchType: 'STATIC_PRODUCT_MATCH', matchedItem: staticMatch, source: 'STATIC_FILE' };
    }

    return null;
  }

  // Audit Frames
  let framesPresent = 0;
  let framesMissing = 0;
  const framesPresentList = [];
  const framesMissingList = [];
  const framesMissingByBrand = {};
  const framesPresentByBrand = {};

  framesCsv.forEach(item => {
    const brand = item.BRAND?.trim().toUpperCase() || 'UNKNOWN';
    const matchRes = matchItem(item, false);
    if (matchRes) {
      framesPresent++;
      framesPresentList.push({ item, match: matchRes });
      framesPresentByBrand[brand] = (framesPresentByBrand[brand] || 0) + 1;
    } else {
      framesMissing++;
      framesMissingList.push(item);
      framesMissingByBrand[brand] = (framesMissingByBrand[brand] || 0) + 1;
    }
  });

  // Audit Sunglasses
  let sunglassesPresent = 0;
  let sunglassesMissing = 0;
  const sunglassesPresentList = [];
  const sunglassesMissingList = [];
  const sunglassesMissingByBrand = {};
  const sunglassesPresentByBrand = {};

  sunglassesCsv.forEach(item => {
    const brand = item.BRAND?.trim().toUpperCase() || 'UNKNOWN';
    const matchRes = matchItem(item, true);
    if (matchRes) {
      sunglassesPresent++;
      sunglassesPresentList.push({ item, match: matchRes });
      sunglassesPresentByBrand[brand] = (sunglassesPresentByBrand[brand] || 0) + 1;
    } else {
      sunglassesMissing++;
      sunglassesMissingList.push(item);
      sunglassesMissingByBrand[brand] = (sunglassesMissingByBrand[brand] || 0) + 1;
    }
  });

  console.log('\n=============================================');
  console.log('              AUDIT RESULTS                  ');
  console.log('=============================================');
  console.log(`\n1. OPTICAL FRAMES (frames_stock_details_part1.csv):`);
  console.log(`   Total items in CSV:    ${framesCsv.length}`);
  console.log(`   Already present in DB: ${framesPresent}`);
  console.log(`   Left to add (Missing): ${framesMissing}`);

  console.log(`\n2. SUNGLASSES (frames_sunglass_stock_details.csv):`);
  console.log(`   Total items in CSV:    ${sunglassesCsv.length}`);
  console.log(`   Already present in DB: ${sunglassesPresent}`);
  console.log(`   Left to add (Missing): ${sunglassesMissing}`);

  console.log(`\n3. COMBINED TOTALS:`);
  console.log(`   Total inventory items across both files: ${framesCsv.length + sunglassesCsv.length}`);
  console.log(`   Total already present on website:        ${framesPresent + sunglassesPresent}`);
  console.log(`   Total left to add:                       ${framesMissing + sunglassesMissing}`);

  console.log('\n--- Frames Missing by Brand ---');
  console.table(framesMissingByBrand);

  console.log('\n--- Frames Present by Brand ---');
  console.table(framesPresentByBrand);

  console.log('\n--- Sunglasses Missing by Brand ---');
  console.table(sunglassesMissingByBrand);

  console.log('\n--- Sunglasses Present by Brand ---');
  console.table(sunglassesPresentByBrand);

  // Let's print sample matched items to inspect quality of matching
  console.log('\nSample 5 Matched Frames:');
  console.log(JSON.stringify(framesPresentList.slice(0, 5), null, 2));

  console.log('\nSample 5 Matched Sunglasses:');
  console.log(JSON.stringify(sunglassesPresentList.slice(0, 5), null, 2));

  // Let's write the full results to a JSON file so we can deeply review everything
  fs.writeFileSync('scripts/inventory_audit_report.json', JSON.stringify({
    summary: {
      frames: { total: framesCsv.length, present: framesPresent, missing: framesMissing, presentByBrand: framesPresentByBrand, missingByBrand: framesMissingByBrand },
      sunglasses: { total: sunglassesCsv.length, present: sunglassesPresent, missing: sunglassesMissing, presentByBrand: sunglassesPresentByBrand, missingByBrand: sunglassesMissingByBrand },
      total: { total: framesCsv.length + sunglassesCsv.length, present: framesPresent + sunglassesPresent, missing: framesMissing + sunglassesMissing }
    },
    sampleFramesMissing: framesMissingList.slice(0, 20),
    sampleSunglassesMissing: sunglassesMissingList.slice(0, 20),
    sampleFramesPresent: framesPresentList.slice(0, 20),
    sampleSunglassesPresent: sunglassesPresentList.slice(0, 20)
  }, null, 2));

  console.log('\nFull audit report saved to scripts/inventory_audit_report.json');

  await pool.end();
}

runAudit().catch(err => {
  console.error(err);
  pool.end();
});
