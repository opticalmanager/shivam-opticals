#!/usr/bin/env node

/**
 * Shivam Optics - Multi-Source Catalog Scraper & Ingester
 * Sources:
 * 1. Dayal Opticals (https://dayalopticalsindia.com)
 * 2. Gem Opticians (https://gemopticians.com)
 * 3. Optorium Luxury (https://optorium.in)
 * 4. Himalaya Optical (https://himalayaoptical.com)
 * 5. Nayan Sukh Exclusive (https://nayansukhexclusive.com)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { Pool } = require('pg');

// 1. Connect to Supabase Database
const envPath = path.join(process.cwd(), '.env.local');
let dbUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
  if (match) dbUrl = match[1];
}

if (!dbUrl) {
  console.error('DATABASE_URL missing from .env.local!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const TARGET_SOURCES = [
  { name: 'Optorium', origin: 'https://optorium.in' },
  { name: 'Himalaya Optical', origin: 'https://himalayaoptical.com' },
  { name: 'Ramavision', origin: 'https://ramavision.in' },
  { name: 'Prism Eye Care', origin: 'https://prismeyecare.in' },
  { name: 'S.R. Gopal Rao', origin: 'https://shop-srgopalrao.co' },
  { name: 'Dayal Opticals', origin: 'https://dayalopticalsindia.com' },
  { name: 'Gem Opticians', origin: 'https://gemopticians.com' },
  { name: 'Nayan Sukh', origin: 'https://nayansukhexclusive.com' },
];

// Color Hex Dictionary
const COLOR_HEX_MAP = {
  black: '#1A1816',
  gold: '#C5A059',
  champagne: '#E5D3B3',
  silver: '#C0C0C0',
  gunmetal: '#4A4A4A',
  grey: '#6B7280',
  gray: '#6B7280',
  tortoise: '#5A381E',
  havana: '#5A381E',
  brown: '#4A2C11',
  blue: '#1E3A8A',
  navy: '#0F172A',
  green: '#0A251C',
  rose: '#B76E79',
  crystal: '#F9FAFB',
  clear: '#F9FAFB',
  red: '#B91C1C',
  burgundy: '#581C87',
};

function resolveColorHex(colorName) {
  if (!colorName) return '#1A1816';
  const clean = colorName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#1A1816';
}

function cleanHdImageUrl(url) {
  if (!url) return '';
  let clean = url.startsWith('//') ? 'https:' + url : url;
  clean = clean.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|1024x1024|2048x2048|800x800w)\./gi, '.');
  clean = clean.replace(/-\d+x\d+w\./gi, '.');
  try {
    const parsed = new URL(clean);
    parsed.searchParams.delete('width');
    parsed.searchParams.delete('height');
    parsed.searchParams.delete('crop');
    return parsed.toString();
  } catch {
    return clean;
  }
}

function fetchJson(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;

      client.get(
        urlStr,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json, text/plain, */*',
          },
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(fetchJson(res.headers.location));
          }
          if (res.statusCode !== 200) {
            return resolve(null);
          }

          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw));
            } catch {
              resolve(null);
            }
          });
        }
      ).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

function extractMeasurements(bodyHtml, tags) {
  const result = { lensWidth: 53, bridgeWidth: 18, templeLength: 145, frameWidth: 140, weight: '22g' };
  const tagsArr = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : [];

  for (const tag of tagsArr) {
    const match = tag.match(/size-(\d{2})/i);
    if (match) {
      result.lensWidth = parseInt(match[1], 10);
      break;
    }
  }

  if (bodyHtml) {
    const rx = /(\d{2})\s*[-–—/]\s*(\d{2})\s*[-–—/]\s*(\d{2,3})/;
    const m = bodyHtml.match(rx);
    if (m) {
      result.lensWidth = parseInt(m[1], 10);
      result.bridgeWidth = parseInt(m[2], 10);
      result.templeLength = parseInt(m[3], 10);
      result.frameWidth = result.lensWidth * 2 + result.bridgeWidth + 16;
    }
  }

  return result;
}

function extractShape(title, bodyHtml, tags) {
  const text = `${title} ${bodyHtml || ''} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`.toLowerCase();
  if (text.includes('aviator') || text.includes('pilot')) return 'aviator';
  if (text.includes('round') || text.includes('circle')) return 'round';
  if (text.includes('rectangle') || text.includes('rectangular')) return 'rectangle';
  if (text.includes('square')) return 'square';
  if (text.includes('cat eye') || text.includes('cateye')) return 'cat-eye';
  if (text.includes('geometric') || text.includes('hexagonal') || text.includes('octagonal')) return 'geometric';
  if (text.includes('wayfarer')) return 'wayfarer';
  return 'rectangle';
}

function extractRimType(title, bodyHtml, tags) {
  const text = `${title} ${bodyHtml || ''} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`.toLowerCase();
  if (text.includes('rimless') || text.includes('frameless')) return 'rimless';
  if (text.includes('semi-rimless') || text.includes('half rim') || text.includes('half-rim')) return 'semi-rimless';
  return 'full-rim';
}

function extractMaterial(title, bodyHtml, tags) {
  const text = `${title} ${bodyHtml || ''} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`.toLowerCase();
  if (text.includes('titanium')) return 'Titanium';
  if (text.includes('acetate')) return 'Acetate';
  if (text.includes('metal') || text.includes('stainless steel')) return 'Metal';
  if (text.includes('tr90') || text.includes('tr-90')) return 'TR90';
  return 'Acetate';
}

function extractGender(title, bodyHtml, tags) {
  const text = `${title} ${bodyHtml || ''} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`.toLowerCase();
  if (text.includes('kids') || text.includes('junior') || text.includes('children')) return 'kids';
  if (text.includes('women') || text.includes('female') || text.includes('ladies')) return 'women';
  if (text.includes('men') || text.includes('male') || text.includes('gents')) return 'men';
  return 'unisex';
}

const norm = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const BRAND_ALIASES = {
  'Ray-Ban': ['RAYBAN', 'RAY', 'RB', '0RB', 'RAY-BAN', 'RAY BAN', 'RJ', 'RX', '0RX'],
  'Carrera': ['CARRERA', 'CA', '0CA', 'CAPR'],
  'Burberry': ['BURBERRY', 'BE', '0BE', 'BURB', 'B'],
  'Tommy Hilfiger': ['TOMMYHILFIGER', 'TOMMY', 'TH'],
  'Vogue': ['VOGUE', 'VO', '0VO'],
  'Armani Exchange': ['ARMANIEXCHANGE', 'AX', 'ARMANI'],
  'Emporio Armani': ['EMPORIOARMANI', 'EA', 'ARMANI'],
  'Boss': ['BOSS', 'HUGOBOSS'],
  'French Connection': ['FRENCHCONNECTION', 'FCUK', 'FC'],
  'Bebe': ['BEBE', 'BB'],
  'Scott': ['SCOTT'],
  'Stepper': ['STEPPER', 'SI']
};

async function searchCandidates(origin, query, brand, cleanDigits) {
  const url = `${origin}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8`;
  const res = await fetchJson(url);
  const products = res?.resources?.results?.products || [];

  const aliases = BRAND_ALIASES[brand] || [norm(brand)];
  const matched = [];
  for (const p of products) {
    const titleNorm = norm(p.title);
    const handleNorm = norm(p.handle);
    const vendorNorm = norm(p.vendor);

    // Check brand match
    const brandMatches = !brand ||
      aliases.some((a) => vendorNorm.includes(a) || titleNorm.includes(a) || handleNorm.includes(a.toLowerCase()));

    // Strict model match
    let modelMatches = false;
    if (cleanDigits && cleanDigits.length >= 3) {
      modelMatches = titleNorm.includes(cleanDigits) || handleNorm.includes(cleanDigits);
    } else {
      const qNorm = norm(query);
      if (qNorm && qNorm.length >= 3) {
        modelMatches = titleNorm.includes(qNorm) || handleNorm.includes(qNorm.toLowerCase());
      }
    }

    if (brandMatches && modelMatches) {
      matched.push(p);
    }
  }

  return matched;
}

async function evaluateAndFetchProduct(origin, handle, targetColors, sourceName) {
  const fullJsonUrl = `${origin}/products/${handle}.json`;
  const data = await fetchJson(fullJsonUrl);
  if (!data || !data.product) return null;

  const p = data.product;
  const images = (p.images || []).map((img) => cleanHdImageUrl(img.src)).filter(Boolean);
  const variants = p.variants || [];

  let score = 0;
  score += Math.min(50, images.length * 10);

  const tagsArr = Array.isArray(p.tags) ? p.tags : typeof p.tags === 'string' ? p.tags.split(',') : [];

  for (const c of targetColors) {
    const cClean = c.toLowerCase().trim();
    if (cClean === 'mix' || !cClean) continue;
    const hasColor = variants.some((v) => {
      const vText = `${v.title || ''} ${v.option1 || ''} ${v.sku || ''}`.toLowerCase();
      return vText.includes(cClean);
    }) || tagsArr.some((t) => typeof t === 'string' && t.toLowerCase().includes(cClean));

    if (hasColor) {
      score += 25;
    }
  }

  const hasSpecs = p.body_html && (p.body_html.includes('Lens') || p.body_html.includes('Size') || p.body_html.includes('-'));
  if (hasSpecs) score += 20;

  return {
    source: sourceName,
    origin,
    handle,
    score,
    product: p,
    images,
  };
}

async function insertIntoSupabase(client, frame) {
  // 1. Resolve or Create Brand
  let brandId = null;
  const brandSlug = frame.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const bRes = await client.query('SELECT id FROM public.brands WHERE slug = $1 OR name ILIKE $1 LIMIT 1;', [frame.brand]);
  if (bRes.rows.length > 0) {
    brandId = bRes.rows[0].id;
  } else {
    const newB = await client.query(
      `INSERT INTO public.brands (name, slug, origin, is_featured, is_active)
       VALUES ($1, $2, 'Designer Eyewear', true, true)
       RETURNING id;`,
      [frame.brand, brandSlug]
    );
    brandId = newB.rows[0].id;
  }

  // 2. Resolve Category
  let categoryId = null;
  const cRes = await client.query('SELECT id FROM public.categories WHERE slug = $1 LIMIT 1;', [frame.category]);
  if (cRes.rows.length > 0) {
    categoryId = cRes.rows[0].id;
  } else {
    const cDefault = await client.query('SELECT id FROM public.categories LIMIT 1;');
    if (cDefault.rows.length > 0) categoryId = cDefault.rows[0].id;
  }

  const cleanShape = (frame.shape || 'rectangle').toLowerCase();
  const cleanRimType = (frame.rimType || 'full-rim').toLowerCase();
  const cleanGender = (frame.gender || 'unisex').toLowerCase();
  const cleanOriginalPrice = frame.originalPrice && frame.originalPrice >= frame.basePrice ? frame.originalPrice : null;

  // 3. Upsert Product
  const pRes = await client.query(
    `INSERT INTO public.products (
      slug, name, subtitle, brand_id, category_id, gender, shape, rim_type, material, color, color_hex,
      base_price, original_price, description, specs, package_dimensions, is_active, is_new_arrival, is_best_seller,
      source_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, true, false, $17)
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name, base_price = EXCLUDED.base_price, original_price = EXCLUDED.original_price,
        description = EXCLUDED.description, specs = EXCLUDED.specs, package_dimensions = EXCLUDED.package_dimensions,
        is_active = true, updated_at = NOW()
    RETURNING id;`,
    [
      frame.slug,
      frame.name,
      frame.subtitle,
      brandId,
      categoryId,
      cleanGender,
      cleanShape,
      cleanRimType,
      frame.material,
      frame.color,
      frame.colorHex,
      frame.basePrice,
      cleanOriginalPrice,
      frame.description,
      JSON.stringify(frame.specs),
      JSON.stringify(frame.packageDimensions),
      frame.sourceUrl,
    ]
  );
  const productId = pRes.rows[0].id;

  // 4. Insert Variants
  for (const v of frame.variants) {
    await client.query(
      `INSERT INTO public.product_variants (product_id, color_name, color_hex, sku, stock_quantity, price_override)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (sku) DO UPDATE
       SET stock_quantity = EXCLUDED.stock_quantity, price_override = EXCLUDED.price_override, updated_at = NOW();`,
      [productId, v.colorName, v.colorHex, v.sku, v.stockQuantity, v.price !== frame.basePrice ? v.price : null]
    );
  }

  // 5. Insert Images
  await client.query('DELETE FROM public.product_images WHERE product_id = $1;', [productId]);
  for (let i = 0; i < frame.images.length; i++) {
    await client.query(
      `INSERT INTO public.product_images (product_id, url, display_order, is_primary)
       VALUES ($1, $2, $3, $4);`,
      [productId, frame.images[i], i, i === 0]
    );
  }

  return productId;
}

async function main() {
  console.log('========================================================');
  console.log('   SHIVAM OPTICS - 8-NETWORK LUXURY SCRAPER & INGESTER');
  console.log('   Sources: Optorium, Himalaya, Ramavision, Prism, SR Gopal Rao, Dayal, Gem, Nayan Sukh');
  console.log('========================================================\n');

  const pendingFile = path.join(process.cwd(), 'data', 'unmatched_designer_pending.json');
  if (!fs.existsSync(pendingFile)) {
    console.error('Pending unmatched file not found!');
    process.exit(1);
  }

  const pendingModels = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  console.log(`Loaded ${pendingModels.length} pending luxury models to search across all 8 networks.\n`);

  const newlyIngested = [];
  const stillPending = [];

  for (let idx = 0; idx < pendingModels.length; idx++) {
    const frame = pendingModels[idx];
    console.log(`[${idx + 1}/${pendingModels.length}] Searching: ${frame.brand} ${frame.model} (${frame.category})`);

    let cleanModel = frame.model.toUpperCase().trim();
    let cleanDigits = '';
    let extractedColor = null;

    // Vogue special normalizer: VO57192966 -> Model VO5719, Color 2966
    if (frame.brand === 'Vogue') {
      const vMatch = cleanModel.match(/^VO(?:5|C|O)?(\d{3,4})([A-Z0-9]+)?/i);
      if (vMatch) {
        cleanDigits = vMatch[1].length === 3 ? '5' + vMatch[1] : vMatch[1];
        cleanModel = 'VO' + cleanDigits;
        if (vMatch[2] && vMatch[2].length >= 2) {
          extractedColor = vMatch[2];
        }
      } else {
        cleanDigits = cleanModel.replace(/^[A-Z\-_]+/i, '').replace(/[^\d]/g, '').slice(0, 4);
      }
    } else if (frame.brand === 'Carrera') {
      if (cleanModel.startsWith('CAI')) {
        cleanModel = cleanModel.replace(/^CAI/, 'CA1');
      } else if (cleanModel.startsWith('CA8X')) {
        cleanModel = cleanModel.replace(/^CA8X/, 'CA88');
      } else if (cleanModel.startsWith('CA-')) {
        cleanModel = cleanModel.replace(/^CA-/, 'CA');
      } else if (cleanModel.includes('204')) {
        cleanDigits = '204';
      }
      if (!cleanDigits) {
        cleanDigits = cleanModel.replace(/^[A-Z\-_]+/i, '').replace(/[^\d]/g, '');
      }
    } else if (frame.brand === 'Ray-Ban') {
      cleanDigits = cleanModel.replace(/^[A-Z\-_]+/i, '').replace(/[^\d]/g, '');
    } else {
      cleanDigits = cleanModel.replace(/^[A-Z\-_]+/i, '').replace(/[^\d]/g, '');
    }

    if (extractedColor && frame.colors && !frame.colors.includes(extractedColor)) {
      frame.colors.push(extractedColor);
    }

    const cleanAlpha = cleanModel.replace(/[^A-Z]/gi, '');

    const querySet = new Set([
      cleanModel,
      frame.model,
      `${frame.brand} ${cleanModel}`,
    ]);

    if (cleanDigits && cleanDigits.length >= 3) {
      querySet.add(cleanDigits);
      querySet.add(`${frame.brand} ${cleanDigits}`);
      querySet.add(`${cleanAlpha} ${cleanDigits}`);
      querySet.add(`${frame.brand} 0${cleanAlpha} ${cleanDigits}`);

      if (frame.brand === 'Burberry') {
        querySet.add(`0BE ${cleanDigits}`);
        querySet.add(`BE ${cleanDigits}`);
        querySet.add(`B ${cleanDigits}`);
        querySet.add(`Burberry ${cleanDigits}`);
      } else if (frame.brand === 'Ray-Ban') {
        querySet.add(`RB ${cleanDigits}`);
        querySet.add(`0RB ${cleanDigits}`);
        querySet.add(`RX ${cleanDigits}`);
        querySet.add(`0RX ${cleanDigits}`);
        querySet.add(`RJ ${cleanDigits}`);
        querySet.add(`Ray-Ban ${cleanDigits}`);
        querySet.add(`Ray Ban ${cleanDigits}`);
      } else if (frame.brand === 'Carrera') {
        querySet.add(`CA ${cleanDigits}`);
        querySet.add(`0CA ${cleanDigits}`);
        querySet.add(`Carrera ${cleanDigits}`);
        querySet.add(`CARRERA ${cleanDigits}`);
      } else if (frame.brand === 'Tommy Hilfiger') {
        querySet.add(`TH ${cleanDigits}`);
        querySet.add(`Tommy Hilfiger ${cleanDigits}`);
      } else if (frame.brand === 'Vogue') {
        querySet.add(`VO ${cleanDigits}`);
        querySet.add(`0VO ${cleanDigits}`);
        querySet.add(`Vogue ${cleanDigits}`);
      } else if (frame.brand === 'Armani Exchange') {
        querySet.add(`AX ${cleanDigits}`);
        querySet.add(`Armani Exchange ${cleanDigits}`);
      } else if (frame.brand === 'French Connection') {
        querySet.add(`FC ${cleanDigits}`);
        querySet.add(`French Connection ${cleanDigits}`);
      }
    }

    const queries = Array.from(querySet).filter((q) => q && q.trim().length >= 2);

    let bestEvaluation = null;

    // Search across all 5 sources concurrently
    for (const source of TARGET_SOURCES) {
      let candidates = [];
      for (const q of queries) {
        candidates = await searchCandidates(source.origin, q, frame.brand, cleanDigits);
        if (candidates.length > 0) break;
      }

      for (const c of candidates.slice(0, 3)) {
        const evalRes = await evaluateAndFetchProduct(source.origin, c.handle, frame.colors || [], source.name);
        if (evalRes && (!bestEvaluation || evalRes.score > bestEvaluation.score)) {
          bestEvaluation = evalRes;
        }
      }

      // If we found a high score match (score >= 60), stop searching other sources
      if (bestEvaluation && bestEvaluation.score >= 60) break;
    }

    if (!bestEvaluation || !bestEvaluation.images || bestEvaluation.images.length === 0) {
      console.log(`  ✗ Not found with verified HD imagery on any of the 8 optical networks.`);
      stillPending.push(frame);
      continue;
    }

    console.log(`  ✓ Matched via ${bestEvaluation.source}: "${bestEvaluation.product.title}" (Score: ${bestEvaluation.score})`);

    // Prepare Master Product
    const p = bestEvaluation.product;
    const measurements = extractMeasurements(p.body_html, p.tags);
    const shape = extractShape(p.title, p.body_html, p.tags);
    const rimType = extractRimType(p.title, p.body_html, p.tags);
    const material = extractMaterial(p.title, p.body_html, p.tags);
    const gender = extractGender(p.title, p.body_html, p.tags);

    const sheetPrice = frame.prices && frame.prices.length > 0 ? Math.min(...frame.prices) : Math.round(Number(p.variants?.[0]?.price || 1990));
    // Logical MRP calculation based on 10% discount on MRP: MRP = Selling Price / (1 - 0.10)
    const originalPrice = Math.round(sheetPrice / 0.90);

    const cleanDescription = (p.body_html || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Map Variants
    const distinctColors = Array.from(new Set((frame.colors || []).filter((c) => c && c !== 'MIX')));
    const variants = [];

    if (distinctColors.length > 0) {
      distinctColors.forEach((colorCode, cIdx) => {
        const sku = `SO-${frame.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${frame.model.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${cIdx + 1}`;
        variants.push({
          sku,
          colorName: colorCode,
          colorHex: resolveColorHex(colorCode),
          price: sheetPrice,
          stockQuantity: 12,
        });
      });
    } else {
      (p.variants || []).forEach((v, vIdx) => {
        const colorName = v.option1 || v.title || 'Standard';
        const sku = `SO-${frame.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${frame.model.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${vIdx + 1}`;
        variants.push({
          sku,
          colorName,
          colorHex: resolveColorHex(colorName),
          price: sheetPrice,
          stockQuantity: 12,
        });
      });
    }

    if (variants.length === 0) {
      variants.push({
        sku: `SO-${frame.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${frame.model.toUpperCase().replace(/[^A-Z0-9]/g, '')}-1`,
        colorName: 'Standard',
        colorHex: '#1A1816',
        price: sheetPrice,
        stockQuantity: 12,
      });
    }

    const masterFrame = {
      sourceUrl: `${bestEvaluation.origin}/products/${bestEvaluation.handle}`,
      slug: `so-${frame.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${frame.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: p.title.trim(),
      subtitle: `${frame.brand} ${shape} ${rimType}`,
      brand: frame.brand,
      category: frame.category,
      gender,
      shape,
      rimType,
      material,
      color: variants[0].colorName,
      colorHex: variants[0].colorHex,
      basePrice: sheetPrice,
      originalPrice,
      description: cleanDescription,
      specs: measurements,
      packageDimensions: { lengthCm: 18, breadthCm: 9, heightCm: 7, weightKg: 0.25 },
      images: bestEvaluation.images.length > 0 ? bestEvaluation.images : ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'],
      variants,
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      const pId = await insertIntoSupabase(client, masterFrame);
      await client.query('COMMIT;');
      console.log(`  ✓ INGESTED INTO SUPABASE (Product ID: ${pId}) | Variants: ${variants.length} | Images: ${masterFrame.images.length}\n`);
      newlyIngested.push(masterFrame);
    } catch (dbErr) {
      await client.query('ROLLBACK;');
      console.error(`  ✗ DB Error for ${masterFrame.name}:`, dbErr.message);
    } finally {
      client.release();
    }
  }

  // Update unmatched file with remaining items
  fs.writeFileSync(pendingFile, JSON.stringify(stillPending, null, 2), 'utf8');

  console.log('\n========================================================');
  console.log(`Multi-Source Scraping Complete!`);
  console.log(`- Newly Ingested Products: ${newlyIngested.length}`);
  console.log(`- Remaining Unmatched Models: ${stillPending.length}`);
  console.log(`- Updated Pending List: ${pendingFile}`);
  console.log('========================================================\n');

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
