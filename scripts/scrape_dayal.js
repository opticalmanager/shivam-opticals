#!/usr/bin/env node

/**
 * Dayal Opticals Luxury Eyewear & Contact Lens Scraper & Importer
 * 
 * Features:
 * 1. Strict Target Brand Whitelisting & Fuzzy Alias Canonicalization (Ray-Ban, Carrera, Vogue, Emporio Armani, Alcon, B&L, CooperVision, J&J, etc.)
 * 2. Contact Lens Intelligence: Parses pack size, wearing schedule/disposability, base curve, and water content.
 * 3. Shiprocket Logistics Integration: Automatically calculates and stores package shipping dimensions (length, breadth, height in cm, weight in kg).
 * 4. Maximum-Resolution HD Photography Extraction (uncompressed master 2048x2048px WebP/JPG).
 * 5. Multi-Angle Colorway Variant Mapping.
 * 6. Storefront & Database Auto-Registration.
 * 
 * Usage:
 *   node scripts/scrape_dayal.js --report
 *   node scripts/scrape_dayal.js --limit=20 --sync-store
 *   node scripts/scrape_dayal.js --brand=Ray-Ban --limit=50 --sync-store
 *   node scripts/scrape_dayal.js --type=contact-lenses --sync-store
 *   node scripts/scrape_dayal.js --all --sync-store
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// CLI Arguments Parser
const args = process.argv.slice(2);
function getArg(name, defaultValue = null) {
  const prefix = `--${name}=`;
  const match = args.find(a => a.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const flagIndex = args.indexOf(`--${name}`);
  if (flagIndex !== -1 && args[flagIndex + 1] && !args[flagIndex + 1].startsWith('--')) {
    return args[flagIndex + 1];
  }
  return defaultValue;
}
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', hasFlag('all') ? '999999' : '50'), 10);
const BRAND_FILTER = (getArg('brand', '') || '').toLowerCase();
const TYPE_FILTER = (getArg('type', '') || '').toLowerCase();
const OUTPUT_FILE = getArg('output', path.join(process.cwd(), 'data', 'dayal_scraped_products.json'));
const EXPORT_CSV = hasFlag('csv');
const DOWNLOAD_IMAGES = hasFlag('download-images');
const SYNC_STORE = hasFlag('sync-store');
const REPORT_MODE = hasFlag('report');
const ALL_BRANDS_ALLOWED = hasFlag('all-brands');

const BASE_URL = 'https://dayalopticalsindia.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// -----------------------------------------------------------------------------
// TARGET BRAND WHITELIST & CANONICALIZATION DICTIONARY
// -----------------------------------------------------------------------------
const TARGET_BRANDS_CONFIG = [
  // Eyewear Brands (Frames & Sunglasses)
  {
    canonical: 'Calvin Klein',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'calvin-klein',
    aliases: ['calvin klein', 'calvien klein', 'calvin-klein', 'ck'],
  },
  {
    canonical: 'Calvin Klein Jeans',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'calvin-klein-jeans',
    aliases: ['calvin klein jeans', 'ck jeans'],
  },
  {
    canonical: 'Carrera',
    category: 'Sunglasses',
    isContactLens: false,
    collectionHandle: 'carrera',
    aliases: ['carrera', 'carrera eyewear'],
  },
  {
    canonical: 'David Jones',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'david-jones',
    aliases: ['david jones', 'david-jones'],
  },
  {
    canonical: 'Emporio Armani',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'emporio-armani',
    aliases: ['emporio armani', 'emporio-armani', 'ea armani'],
  },
  {
    canonical: 'Escape',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'escape',
    aliases: ['escape'],
  },
  {
    canonical: 'Fine Reading',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'fine-reading',
    aliases: ['fine reading', 'fine-reading'],
  },
  {
    canonical: 'Idee',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'idee',
    aliases: ['idee', 'idee eyewear'],
  },
  {
    canonical: 'Idee Young',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'idee-young',
    aliases: ['idee young', 'idee-young'],
  },
  {
    canonical: 'Irus',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'irus',
    aliases: ['irus', 'irus eyewear'],
  },
  {
    canonical: 'Jerry Rodgers',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'jerry-rodgers',
    aliases: ['jerry rodgers', 'jerry-rodgers'],
  },
  {
    canonical: 'Lacoste',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'lacoste',
    aliases: ['lacoste'],
  },
  {
    canonical: 'Lanzo Louis',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'lanzo-louis',
    aliases: ['lanzo louis', 'lanzo-louis', 'lanzo'],
  },
  {
    canonical: 'Ray-Ban',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'ray-ban',
    aliases: [
      'ray ban',
      'ray-ban',
      'ray ban rx',
      'ray ban meta',
      'ray ban meta gen i',
      'ray ban meta gen ii',
      'ray ban meta gen iii',
      'ray ban junior',
      'ray ban kids',
    ],
  },
  {
    canonical: 'Scott',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'scott',
    aliases: ['scott', 'scott eyewear'],
  },
  {
    canonical: 'Seventh Street',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: '7th-street',
    aliases: ['seventh street', '7th street', 'seventh-street', '7th-street'],
  },
  {
    canonical: 'Tommy Hilfiger',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'tommy-hilfiger',
    aliases: ['tommy hilfiger', 'tommy-hilfiger', 'tommy'],
  },
  {
    canonical: 'Vogue',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'vogue',
    aliases: ['vogue', 'vogue eyewear', 'vogue junior', 'vogue-eyewear'],
  },
  {
    canonical: 'Young Turks',
    category: 'Eyeglasses',
    isContactLens: false,
    collectionHandle: 'young-turks',
    aliases: ['young turks', 'young-turks'],
  },

  // Contact Lens Brands
  {
    canonical: 'Alcon',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'alcon',
    aliases: ['alcon', 'air optix', 'dailies', 'precision 1'],
  },
  {
    canonical: 'Aryan',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'aryan',
    aliases: ['aryan', 'aryan contact lenses'],
  },
  {
    canonical: 'Bausch & Lomb',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'bausch-lomb',
    aliases: ['bausch & lomb', 'bausch and lomb', 'bausch + lomb', 'b&l', 'lacelle', 'biotrue', 'purevision', 'soflens'],
  },
  {
    canonical: 'Celebration',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'celebration',
    aliases: ['celebration', 'celebration lenses'],
  },
  {
    canonical: 'Cooper Vision',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'cooper-vision',
    aliases: ['cooper vision', 'coopervision', 'cooper-vision', 'biofinity', 'clariti', 'aspire go', 'myday', 'avaira'],
  },
  {
    canonical: 'Johnson & Johnson',
    category: 'Contact Lenses',
    isContactLens: true,
    collectionHandle: 'johnson-johnson',
    aliases: ['johnson & johnson', 'johnson and johnson', 'j&j', 'acuvue', 'acuvue oasys', 'acuvue moist', '1-day acuvue'],
  },
];

// Color hex mappings
const COLOR_HEX_MAP = {
  black: '#1A1816',
  matte_black: '#121212',
  gold: '#C5A059',
  yellow_gold: '#D4AF37',
  rose_gold: '#B76E79',
  silver: '#C0C0C0',
  gunmetal: '#4A5568',
  grey: '#6B7280',
  tortoise: '#6B3E11',
  havana: '#5A381E',
  brown: '#78350F',
  crystal: '#F3F4F6',
  clear: '#F9FAFB',
  blue: '#1E3A8A',
  green: '#14532D',
  sage: '#84A98C',
  burgundy: '#5B1A24',
  red: '#991B1B',
  amber: '#D97706',
  pure_hazel: '#A67B5B',
  honey: '#D4A373',
  gemstone: '#2A9D8F',
  sterling_grey: '#708090',
  brilliant_blue: '#0077B6',
};

function detectColorHex(colorName) {
  if (!colorName) return '#1A1816';
  const c = colorName.toLowerCase().replace(/[\s\-_]+/g, '_');
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (c.includes(key) || c === key) {
      return hex;
    }
  }
  return '#1A1816';
}

function cleanHtmlText(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function matchBrandConfig(vendor, title, tags) {
  const normVendor = (vendor || '').toLowerCase().trim();
  const normTitle = (title || '').toLowerCase().trim();
  const normTags = Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : [];

  // Helper to test word boundary match
  const matchesWord = (text, alias) => {
    if (!text || !alias) return false;
    if (alias.length <= 3) {
      // Short acronyms like 'ck', 'ea', 'b&l', 'j&j' require strict word boundaries
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(?:^|[\\s/_-])${escaped}(?:$|[\\s/_-])`, 'i');
      return rx.test(text);
    }
    return text === alias || text.startsWith(alias + ' ') || text.endsWith(' ' + alias) || text.includes(' ' + alias + ' ') || text.includes(alias);
  };

  // 1. Match on Vendor
  for (const cfg of TARGET_BRANDS_CONFIG) {
    for (const alias of cfg.aliases) {
      if (matchesWord(normVendor, alias)) return cfg;
    }
  }

  // 2. Title match (must start with or match whole word)
  for (const cfg of TARGET_BRANDS_CONFIG) {
    for (const alias of cfg.aliases) {
      if (alias.length > 3) {
        if (normTitle.startsWith(alias + ' ') || normTitle.includes(' ' + alias + ' ')) {
          return cfg;
        }
      } else {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(`(?:^|[\\s/_-])${escaped}(?:$|[\\s/_-])`, 'i');
        if (rx.test(normTitle)) return cfg;
      }
    }
  }

  // 3. Tags match
  for (const cfg of TARGET_BRANDS_CONFIG) {
    for (const alias of cfg.aliases) {
      if (normTags.some(t => t === alias || t === `brand_${alias}` || t === `vendor_${alias}`)) {
        return cfg;
      }
    }
  }

  return null;
}

function extractContactLensSpecs(bodyHtml, tags, title) {
  const specs = {
    packSize: '30 Lenses / Box',
    wearingSchedule: 'Daily Disposable',
    baseCurve: '8.6 mm',
    waterContent: '33%',
    material: 'Silicone Hydrogel',
  };

  const text = (bodyHtml || '').replace(/<[^>]+>/g, ' ');

  // Qty per box / Pack Size
  const qtyMatch = text.match(/(?:Qty\s*per\s*box|Pack\s*Size|Quantity|Lenses\s*per\s*box)\s*[:\s]*([\d\w\s]+?)(?:<|\n|\r|Disposability|Material|Base Curve|Delivery|$)/i);
  if (qtyMatch) {
    specs.packSize = qtyMatch[1].trim();
  } else if (/(\d+)\s*(?:pack|lens pack|lenses|day pack)/i.test(title)) {
    const pm = title.match(/(\d+)\s*(?:pack|lens pack|lenses|day pack)/i);
    specs.packSize = `${pm[1]} Pack`;
  }

  // Disposability / Wearing Schedule
  const dispMatch = text.match(/(?:Disposability|Replacement|Wearing\s*Schedule|Usage)\s*[:\s]*([\d\w\s]+?)(?:<|\n|\r|Material|Base Curve|Water|$)/i);
  if (dispMatch) {
    specs.wearingSchedule = dispMatch[1].trim();
  } else if (/monthly/i.test(title) || /monthly/i.test(text)) {
    specs.wearingSchedule = 'Monthly Disposable';
  } else if (/daily/i.test(title) || /1\s*day/i.test(title) || /daily/i.test(text)) {
    specs.wearingSchedule = 'Daily Disposable';
  } else if (/bi-weekly|2\s*week/i.test(title) || /bi-weekly/i.test(text)) {
    specs.wearingSchedule = 'Bi-Weekly Disposable';
  }

  // Material
  const matMatch = text.match(/Material\s*[:\s]*([\d\w\s]+?)(?:<|\n|\r|Base Curve|Water|$)/i);
  if (matMatch) {
    specs.material = matMatch[1].trim();
  } else if (/silicone\s*hydrogel/i.test(text)) {
    specs.material = 'Silicone Hydrogel';
  } else if (/hydrogel/i.test(text)) {
    specs.material = 'Hydrogel';
  }

  // Base Curve
  const bcMatch = text.match(/Base\s*Curve\s*[:\s]*([\d\.]+\s*(?:mm)?)/i);
  if (bcMatch) {
    specs.baseCurve = bcMatch[1].trim();
  }

  // Water Content
  const wcMatch = text.match(/Water\s*(?:content)?\s*[:\s]*([\d\.]+\s*%)/i);
  if (wcMatch) {
    specs.waterContent = wcMatch[1].trim();
  }

  return specs;
}

function extractEyewearMeasurements(bodyHtml, tags) {
  const result = {
    lensWidth: 52,
    bridgeWidth: 19,
    templeLength: 145,
  };

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const match = tag.match(/size-(\d{2})/i);
      if (match) {
        result.lensWidth = parseInt(match[1], 10);
        break;
      }
    }
  }

  if (bodyHtml) {
    const rx = /(\d{2})\s*[-–—/]\s*(\d{2})\s*[-–—/]\s*(\d{2,3})/;
    const m = bodyHtml.match(rx);
    if (m) {
      result.lensWidth = parseInt(m[1], 10);
      result.bridgeWidth = parseInt(m[2], 10);
      result.templeLength = parseInt(m[3], 10);
    } else {
      const lensMatch = bodyHtml.match(/Lens\s*(?:Size|Width)?\s*[:\s]*(\d{2})/i);
      const bridgeMatch = bodyHtml.match(/(?:Nose\s*)?Bridge\s*(?:Length|Width)?\s*[:\s]*(\d{2})/i);
      const templeMatch = bodyHtml.match(/Temple\s*(?:Length)?\s*[:\s]*(\d{2,3})/i);
      if (lensMatch) result.lensWidth = parseInt(lensMatch[1], 10);
      if (bridgeMatch) result.bridgeWidth = parseInt(bridgeMatch[1], 10);
      if (templeMatch) result.templeLength = parseInt(templeMatch[1], 10);
    }
  }

  return result;
}

/**
 * Calculates standard e-commerce shipping package dimensions for Shiprocket logistics API integration
 */
function calculateShiprocketPackageDimensions(isContactLens, variantGrams) {
  if (isContactLens) {
    return {
      lengthCm: 15,
      breadthCm: 10,
      heightCm: 4,
      weightKg: 0.08, // 80g standard boxed contact lens pack
    };
  }

  const baseWeightKg = variantGrams && variantGrams > 0
    ? Math.max(0.25, Number((variantGrams / 1000).toFixed(2)))
    : 0.25;

  return {
    lengthCm: 18,
    breadthCm: 9,
    heightCm: 7,
    weightKg: baseWeightKg, // 250g standard luxury eyewear hardshell case + microfiber cloth
  };
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
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    client.get(urlStr, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
      },
    }, (res) => {
      if (res.statusCode === 429) {
        return reject(new Error('HTTP 429 Rate Limit Exceeded'));
      }
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${urlStr}`));
      }

      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(urlStr, destPath) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    client.get(urlStr, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${res.statusCode} downloading ${urlStr}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// -----------------------------------------------------------------------------
// REPORT MODE: AUDIT TARGET BRANDS AVAILABILITY
// -----------------------------------------------------------------------------
async function runBrandAuditReport() {
  console.log('\n========================================================================');
  console.log('   DAYAL OPTICALS LIVE CATALOG AUDIT — TARGET BRANDS VERIFICATION');
  console.log('========================================================================\n');

  console.log('Scanning all pages from Dayal Opticals API to audit target brand counts...\n');

  const countsByCanonical = new Map();
  TARGET_BRANDS_CONFIG.forEach(c => countsByCanonical.set(c.canonical, 0));

  for (let p = 1; p <= 27; p++) {
    process.stdout.write(`Fetching page ${p}/27...\r`);
    const data = await fetchJson(`${BASE_URL}/products.json?limit=250&page=${p}`);
    if (!data || !data.products || data.products.length === 0) break;

    data.products.forEach(prod => {
      const cfg = matchBrandConfig(prod.vendor, prod.title, prod.tags);
      if (cfg) {
        countsByCanonical.set(cfg.canonical, (countsByCanonical.get(cfg.canonical) || 0) + 1);
      }
    });
  }

  console.log('\n\nCatalog Audit Summary:');
  console.log('------------------------------------------------------------------------');
  console.log(
    'Brand Name'.padEnd(25) +
    'Type'.padEnd(18) +
    'Live Items'.padEnd(14) +
    'Status'
  );
  console.log('------------------------------------------------------------------------');

  let totalLive = 0;
  for (const cfg of TARGET_BRANDS_CONFIG) {
    const count = countsByCanonical.get(cfg.canonical) || 0;
    totalLive += count;
    const typeLabel = cfg.isContactLens ? 'Contact Lenses' : 'Eyewear';
    const statusLabel = count > 0 ? `ACTIVE (${count} items)` : 'UNPUBLISHED (0 in stock)';
    console.log(
      cfg.canonical.padEnd(25) +
      typeLabel.padEnd(18) +
      count.toString().padEnd(14) +
      statusLabel
    );
  }
  console.log('------------------------------------------------------------------------');
  console.log(`TOTAL TARGET PRODUCTS ACTIVE IN LIVE STORE: ${totalLive}\n`);
}

// -----------------------------------------------------------------------------
// SCRAPER MAIN PIPELINE
// -----------------------------------------------------------------------------
async function scrapeDayalOpticals() {
  if (REPORT_MODE) {
    await runBrandAuditReport();
    return;
  }

  console.log('\n======================================================');
  console.log('   DAYAL OPTICALS TARGET BRANDS SCRAPER & SYNC');
  console.log('======================================================');
  console.log(` Target Origin    : ${BASE_URL}`);
  console.log(` Target Max Items : ${LIMIT === 999999 ? 'ALL MATCHING' : LIMIT}`);
  if (BRAND_FILTER) console.log(` Brand Filter     : ${BRAND_FILTER}`);
  if (TYPE_FILTER) console.log(` Type Filter      : ${TYPE_FILTER}`);
  console.log(` Whitelist Policy : ${ALL_BRANDS_ALLOWED ? 'ALL BRANDS' : 'STRICT TARGET WHITELIST (25 Brands)'}`);
  console.log(` Download Images  : ${DOWNLOAD_IMAGES ? 'YES (Local HD files)' : 'NO (Shopify Master CDN)'}`);
  console.log(` Output JSON Path : ${OUTPUT_FILE}`);
  console.log('------------------------------------------------------\n');

  let page = 1;
  let gatheredRaw = [];
  let reachedEnd = false;

  // Check if a specific single brand was requested and has a dedicated collection handle
  let endpointPrefix = `${BASE_URL}/products.json`;
  if (BRAND_FILTER) {
    const targetCfg = TARGET_BRANDS_CONFIG.find(c =>
      c.canonical.toLowerCase() === BRAND_FILTER ||
      c.aliases.some(a => a.toLowerCase() === BRAND_FILTER)
    );
    if (targetCfg && targetCfg.collectionHandle) {
      try {
        const testColl = await fetchJson(`${BASE_URL}/collections/${targetCfg.collectionHandle}/products.json?limit=1`);
        if (testColl && Array.isArray(testColl.products) && testColl.products.length > 0) {
          endpointPrefix = `${BASE_URL}/collections/${targetCfg.collectionHandle}/products.json`;
          console.log(`[Fast Path Activated] Dedicated collection detected: /collections/${targetCfg.collectionHandle}/products.json\n`);
        }
      } catch {
        // Fallback to global catalog pagination
      }
    }
  }

  while (!reachedEnd && gatheredRaw.length < LIMIT) {
    const pageUrl = `${endpointPrefix}${endpointPrefix.includes('?') ? '&' : '?'}limit=250&page=${page}`;
    process.stdout.write(`Fetching Page ${page} (${pageUrl})...\r`);

    let data;
    try {
      data = await fetchJson(pageUrl);
    } catch (err) {
      console.error(`\nFailed to fetch page ${page}:`, err.message);
      break;
    }

    if (!data || !Array.isArray(data.products) || data.products.length === 0) {
      reachedEnd = true;
      break;
    }

    for (const prod of data.products) {
      const cfg = matchBrandConfig(prod.vendor, prod.title, prod.tags);

      // Check if product belongs to whitelist
      if (!ALL_BRANDS_ALLOWED && !cfg) {
        continue;
      }

      // Check brand filter if provided
      if (BRAND_FILTER) {
        const matchesBrand = cfg && (
          cfg.canonical.toLowerCase() === BRAND_FILTER ||
          cfg.aliases.some(a => a.toLowerCase() === BRAND_FILTER)
        );
        if (!matchesBrand) continue;
      }

      // Check type filter if provided
      if (TYPE_FILTER) {
        const isCL = cfg ? cfg.isContactLens : (prod.product_type || '').toLowerCase().includes('lens');
        if (TYPE_FILTER === 'contact-lenses' && !isCL) continue;
        if (TYPE_FILTER === 'eyeglasses' && (isCL || (prod.product_type || '').toLowerCase().includes('sunglass'))) continue;
        if (TYPE_FILTER === 'sunglasses' && !((prod.product_type || '').toLowerCase().includes('sunglass'))) continue;
      }

      gatheredRaw.push({ raw: prod, config: cfg });
      if (gatheredRaw.length >= LIMIT) break;
    }

    console.log(`Page ${page}: matched ${gatheredRaw.length} cumulative products.`);

    if (data.products.length < 250) {
      reachedEnd = true;
    } else {
      page++;
      await sleep(500);
    }
  }

  console.log(`\nFound ${gatheredRaw.length} products matching criteria. Normalizing to E-Commerce Atelier Schema...\n`);

  const processedProducts = [];
  const processedVariants = [];

  for (let idx = 0; idx < gatheredRaw.length; idx++) {
    const { raw, config: cfg } = gatheredRaw[idx];
    const isContactLens = cfg ? cfg.isContactLens : (raw.product_type || '').toLowerCase().includes('lens');
    const slug = (raw.handle || raw.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const id = `do-${raw.id || slug}`;

    // Canonical Brand Name (e.g. "Ray-Ban", "Carrera", "Alcon")
    const brand = cfg ? cfg.canonical : (raw.vendor || 'Dayal Opticals');
    const title = raw.title || 'Luxury Eyewear';
    const bodyText = cleanHtmlText(raw.body_html || '');
    const tags = Array.isArray(raw.tags) ? raw.tags : [];

    // Category & Type Determination
    let category = 'Eyeglasses';
    let type = 'eyeglasses';

    if (isContactLens) {
      category = 'Contact Lenses';
      type = 'contact-lenses';
    } else {
      const isSunglasses = (raw.product_type || '').toLowerCase().includes('sunglass') ||
                           tags.some(t => t.toLowerCase().includes('sunglass'));
      category = isSunglasses ? 'Sunglasses' : 'Eyeglasses';
      type = isSunglasses ? 'sunglasses' : 'eyeglasses';
    }

    // Determine Gender
    let gender = 'unisex';
    if (tags.some(t => t.toLowerCase() === 'gender_men' || t.toLowerCase() === 'men')) gender = 'men';
    else if (tags.some(t => t.toLowerCase() === 'gender_women' || t.toLowerCase() === 'women')) gender = 'women';

    // Shape / Geometry
    let shape = isContactLens ? 'Spherical' : 'Rectangle';
    if (!isContactLens) {
      for (const t of tags) {
        if (t.toLowerCase().startsWith('shape_')) {
          shape = t.replace(/^shape_/i, '').replace(/[-_]/g, ' ');
          shape = shape.charAt(0).toUpperCase() + shape.slice(1);
          break;
        }
      }
    } else {
      if (/toric|astigmatism/i.test(title)) shape = 'Toric (Astigmatism)';
      else if (/multifocal|presbyopia/i.test(title)) shape = 'Multifocal (Presbyopia)';
      else if (/color|colours|define|lacelle/i.test(title)) shape = 'Cosmetic Colored';
    }

    // Material
    let material = isContactLens ? 'Silicone Hydrogel' : 'Beta Titanium & Italian Acetate';
    if (!isContactLens) {
      for (const t of tags) {
        if (t.toLowerCase().startsWith('material_')) {
          material = t.replace(/^material_/i, '').replace(/[-_]/g, ' ');
          material = material.charAt(0).toUpperCase() + material.slice(1);
          break;
        }
      }
    }

    // Pricing & Discounts
    const firstVariant = raw.variants && raw.variants[0] ? raw.variants[0] : null;
    const price = firstVariant ? Math.round(parseFloat(firstVariant.price) || 0) : 1990;
    const comparePrice = firstVariant && firstVariant.compare_at_price
      ? Math.round(parseFloat(firstVariant.compare_at_price) || 0)
      : price;
    const discountPct = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

    // Contact Lens Specs or Eyewear Measurements
    const contactLensSpecs = isContactLens ? extractContactLensSpecs(raw.body_html, tags, title) : undefined;
    const measurements = !isContactLens ? extractEyewearMeasurements(raw.body_html, tags) : undefined;

    // Shiprocket Logistics Package Dimensions
    const packageDimensions = calculateShiprocketPackageDimensions(
      isContactLens,
      firstVariant ? firstVariant.grams : 0
    );

    // Tags & Badging (including Ray-Ban Smart Glasses)
    let tag = discountPct > 0 ? 'ON SALE' : 'LUXURY ATELIER';
    let tagType = discountPct > 0 ? 'sale' : 'new';

    if (brand === 'Ray-Ban') {
      if (/meta/i.test(raw.vendor) || /meta/i.test(title)) {
        tag = 'SMART GLASSES';
        tagType = 'featured';
      } else if (/junior|kids/i.test(raw.vendor) || /junior|kids/i.test(title)) {
        tag = 'JUNIOR COLLECTION';
        tagType = 'new';
      } else if (/polar/i.test(title) || tags.some(t => /polarized/i.test(t))) {
        tag = 'POLARIZED CLASSIC';
        tagType = 'featured';
      }
    } else if (isContactLens) {
      tag = contactLensSpecs ? contactLensSpecs.wearingSchedule.toUpperCase() : 'CONTACT LENS';
      tagType = 'new';
    }

    // Collect Master HD Images
    const rawImages = Array.isArray(raw.images) ? raw.images : [];
    const images = rawImages.map(img => cleanHdImageUrl(img.src)).filter(Boolean);
    const primaryImg = images[0] || (isContactLens ? '/images/clean_frame_1.png' : '/images/clean_frame_1.png');

    // Build Colorway Variants
    const colorVariants = [];
    const colorHexList = [];

    if (Array.isArray(raw.variants)) {
      raw.variants.forEach((v, vIdx) => {
        let colorName = v.option1 || v.title || (isContactLens ? 'Standard Pack' : `Colorway ${vIdx + 1}`);
        if (colorName.toLowerCase() === 'default title') {
          colorName = isContactLens ? 'Standard Box' : 'Signature Finish';
        }

        const colorHex = detectColorHex(colorName);
        if (!colorHexList.includes(colorHex)) colorHexList.push(colorHex);

        const vPrice = Math.round(parseFloat(v.price) || price);
        const vImgSrc = v.featured_image ? cleanHdImageUrl(v.featured_image.src) : primaryImg;

        const variantGallery = rawImages
          .filter(img => img.variant_ids && img.variant_ids.includes(v.id))
          .map(img => cleanHdImageUrl(img.src));

        const varId = `var-${id}-${vIdx}`;
        const sku = v.sku || `SKU-${brand.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${slug.toUpperCase().slice(0, 8)}-${vIdx + 1}`;

        colorVariants.push({
          id: varId,
          variantId: v.id,
          sku,
          colorName,
          colorHex,
          price: vPrice,
          compareAtPrice: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price)) : null,
          available: v.available ?? true,
          featuredImage: vImgSrc,
          gallery: variantGallery.length > 0 ? variantGallery : [vImgSrc],
        });

        processedVariants.push({
          id: varId,
          product_id: id,
          product_name: title,
          sku,
          color_name: colorName,
          color_hex: colorHex,
          stock_quantity: v.available ? 12 : 0,
          price: vPrice,
          category,
          image: vImgSrc,
        });
      });
    }

    if (colorHexList.length === 0) colorHexList.push('#1A1816');

    // Build Product Entity
    const productEntity = {
      id,
      brand,
      name: title,
      category,
      type,
      shape,
      gender,
      size: isContactLens ? 'M' : (measurements && measurements.lensWidth <= 49 ? 'S' : measurements && measurements.lensWidth <= 53 ? 'M' : 'L'),
      rating: 4.9,
      price,
      originalPrice: comparePrice,
      discountPct,
      tag,
      tagType,
      img: primaryImg,
      images,
      colors: colorHexList,
      description: bodyText || `${brand} ${type} with high-precision optics and premium design.`,
      material,
      measurements,
      colorVariants,
      sourceUrl: `${BASE_URL}/products/${raw.handle}`,
      packageDimensions,
      contactLensSpecs,
    };

    processedProducts.push(productEntity);
  }

  // Optional: Download images locally
  if (DOWNLOAD_IMAGES) {
    console.log(`Downloading HD images locally for ${processedProducts.length} products...`);
    const imgDir = path.join(process.cwd(), 'public', 'images', 'dayal');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    for (let pIdx = 0; pIdx < processedProducts.length; pIdx++) {
      const p = processedProducts[pIdx];
      const localImages = [];

      for (let iIdx = 0; iIdx < p.images.length; iIdx++) {
        const cdnUrl = p.images[iIdx];
        const ext = path.extname(new URL(cdnUrl).pathname) || '.webp';
        const filename = `${p.id}-img${iIdx + 1}${ext}`;
        const localPath = path.join(imgDir, filename);

        try {
          await downloadFile(cdnUrl, localPath);
          localImages.push(`/images/dayal/${filename}`);
        } catch {
          localImages.push(cdnUrl);
        }
      }

      if (localImages.length > 0) {
        p.img = localImages[0];
        p.images = localImages;
      }
    }
  }

  // Save to JSON
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedProducts, null, 2), 'utf8');
  console.log(`\n[OK] Saved ${processedProducts.length} structured products to: ${OUTPUT_FILE}`);

  // Save to CSV if requested
  if (EXPORT_CSV) {
    const csvPath = OUTPUT_FILE.replace(/\.json$/i, '.csv');
    const headers = [
      'id', 'brand', 'name', 'category', 'type', 'shape', 'gender',
      'price', 'originalPrice', 'discountPct', 'tag', 'primaryImage',
      'colorsCount', 'variantsCount', 'sourceUrl',
      'shiprocket_length_cm', 'shiprocket_breadth_cm', 'shiprocket_height_cm', 'shiprocket_weight_kg'
    ];

    const lines = [headers.join(',')];
    processedProducts.forEach(p => {
      const row = [
        `"${p.id}"`,
        `"${p.brand}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.type}"`,
        `"${p.shape}"`,
        `"${p.gender}"`,
        p.price,
        p.originalPrice,
        p.discountPct,
        `"${p.tag}"`,
        `"${p.img}"`,
        p.colors.length,
        p.colorVariants ? p.colorVariants.length : 0,
        `"${p.sourceUrl || ''}"`,
        p.packageDimensions?.lengthCm || 18,
        p.packageDimensions?.breadthCm || 9,
        p.packageDimensions?.heightCm || 7,
        p.packageDimensions?.weightKg || 0.25,
      ];
      lines.push(row.join(','));
    });

    fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
    console.log(`[OK] Saved CSV export to: ${csvPath}`);
  }

  // Synchronize with local store if requested
  if (SYNC_STORE) {
    const storePath = path.join(process.cwd(), '.data', 'shivam_store.json');
    if (fs.existsSync(storePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        if (!store.products) store.products = [];
        if (!store.variants) store.variants = [];
        if (!store.brands) store.brands = [];
        if (!store.categories) store.categories = [];

        const existingIds = new Set(store.products.map(p => p.id));
        const existingUrls = new Set(store.products.map(p => p.sourceUrl).filter(Boolean));
        const existingBrandNames = new Set(store.brands.map(b => b.name.toLowerCase()));
        const existingCatNames = new Set(store.categories.map(c => c.name.toLowerCase()));

        let newProds = 0;
        let newVars = 0;
        let newBrands = 0;
        let newCats = 0;

        processedProducts.forEach(p => {
          // Auto-register Brand
          if (p.brand && !existingBrandNames.has(p.brand.toLowerCase())) {
            const bSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            store.brands.push({
              id: `brd-${bSlug}`,
              slug: bSlug,
              name: p.brand,
              origin: 'Haute Lunetterie',
              tagline: 'Independent Optical & Vision Care',
              is_active: true,
              created_at: new Date().toISOString(),
            });
            existingBrandNames.add(p.brand.toLowerCase());
            newBrands++;
          }

          // Auto-register Category
          if (p.category && !existingCatNames.has(p.category.toLowerCase())) {
            const cSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            store.categories.push({
              id: `cat-${cSlug}`,
              slug: cSlug,
              name: p.category,
              description: `Bespoke optical collection for ${p.category}`,
              display_order: store.categories.length + 1,
              is_active: true,
              created_at: new Date().toISOString(),
            });
            existingCatNames.add(p.category.toLowerCase());
            newCats++;
          }

          // Deduplicate product
          const isDup = existingIds.has(p.id) || (p.sourceUrl && existingUrls.has(p.sourceUrl));
          if (!isDup) {
            store.products.unshift(p);
            existingIds.add(p.id);
            if (p.sourceUrl) existingUrls.add(p.sourceUrl);
            newProds++;

            // Push variants
            if (p.colorVariants && p.colorVariants.length > 0) {
              p.colorVariants.forEach(cv => {
                store.variants.push({
                  id: cv.id,
                  product_id: p.id,
                  product_name: p.name,
                  sku: cv.sku,
                  color_name: cv.colorName,
                  color_hex: cv.colorHex,
                  stock_quantity: cv.available ? 12 : 0,
                  price: cv.price,
                  category: p.category,
                  image: cv.featuredImage,
                });
                newVars++;
              });
            }
          }
        });

        fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
        console.log(`[SYNC] Integrated ${newProds} new frames, ${newVars} variants, ${newBrands} new brands, and ${newCats} new categories into store: ${storePath}`);
      } catch (err) {
        console.error('Failed to sync store:', err.message);
      }
    }
  }

  console.log('\n======================================================');
  console.log('   SCRAPING & CATALOG COMPILATION COMPLETED');
  console.log('======================================================\n');
}

scrapeDayalOpticals().catch(err => {
  console.error('\nFatal Scraping Error:', err);
  process.exit(1);
});
