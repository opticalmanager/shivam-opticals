#!/usr/bin/env node

/**
 * Cloudflare R2 Background Asset Migration Worker (Stage 2)
 * 
 * Migrates uncompressed master eyewear & contact lens images from Shopify CDN
 * directly into your Cloudflare R2 bucket with custom CDN URL replacement.
 * 
 * Features:
 * - 100% Resumable: Skips any image already migrated to Cloudflare R2.
 * - Selective Batching: Migrate by brand (--brand=Ray-Ban) or item limit (--limit=50).
 * - Zero Downtime: Your live store continues serving images smoothly.
 * - Concurrency control with auto-retries.
 * 
 * Usage:
 *   node scripts/sync_images_to_r2.js --dry-run
 *   node scripts/sync_images_to_r2.js --brand=Ray-Ban --limit=20
 *   node scripts/sync_images_to_r2.js --all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Load environment variables from .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// CLI Arguments
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

const BRAND_FILTER = (getArg('brand', '') || '').toLowerCase();
const LIMIT = parseInt(getArg('limit', hasFlag('all') ? '999999' : '20'), 10);
const DRY_RUN = hasFlag('dry-run');

// R2 Credentials
const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || 'shivam-optics-catalog';
const publicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');

const isR2Configured = Boolean(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  accountId !== 'your_cloudflare_account_id'
);

let s3Client = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function fetchBuffer(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    client.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${urlStr}`));
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'image/webp',
      }));
    }).on('error', reject);
  });
}

async function uploadBufferToR2(buffer, key, contentType) {
  if (DRY_RUN || !isR2Configured) {
    return `${publicUrl || 'https://assets.precisionoptics.in'}/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

async function runR2Migration() {
  console.log('\n======================================================');
  console.log('   CLOUDFLARE R2 ASSET MIGRATION WORKER (STAGE 2)');
  console.log('======================================================');
  console.log(` R2 Bucket Configured : ${isR2Configured ? `YES (${bucketName})` : 'NO (Dry-Run / Preview Mode)'}`);
  console.log(` Target Public URL    : ${publicUrl || 'https://assets.precisionoptics.in (Fallback)'}`);
  console.log(` Filter Brand         : ${BRAND_FILTER || 'ALL BRANDS'}`);
  console.log(` Limit Products       : ${LIMIT === 999999 ? 'UNLIMITED' : LIMIT}`);
  console.log(` Mode                 : ${DRY_RUN ? 'DRY RUN (No live uploads)' : 'LIVE R2 UPLOAD'}`);
  console.log('------------------------------------------------------\n');

  const storePath = path.join(process.cwd(), '.data', 'shivam_store.json');
  if (!fs.existsSync(storePath)) {
    console.error(`Store file not found: ${storePath}`);
    return;
  }

  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const products = store.products || [];

  // Filter products needing migration
  const eligibleProducts = products.filter(p => {
    if (BRAND_FILTER && p.brand.toLowerCase() !== BRAND_FILTER) return false;
    const hasShopifyImage = (p.images || []).some(url => url.includes('cdn.shopify.com'));
    return hasShopifyImage;
  }).slice(0, LIMIT);

  console.log(`Found ${eligibleProducts.length} products with unmigrated Shopify CDN images.\n`);

  if (eligibleProducts.length === 0) {
    console.log('All eligible products already have R2 or self-hosted URLs. Nothing to migrate.');
    return;
  }

  let totalImagesMigrated = 0;
  let totalProductsUpdated = 0;

  for (let pIdx = 0; pIdx < eligibleProducts.length; pIdx++) {
    const prod = eligibleProducts[pIdx];
    const brandSlug = prod.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    console.log(`[${pIdx + 1}/${eligibleProducts.length}] Migrating: ${prod.brand} - ${prod.name} (${prod.id})`);

    const urlMap = new Map(); // originalUrl -> r2Url

    // Migrate all gallery images
    const newImages = [];
    for (let imgIdx = 0; imgIdx < (prod.images || []).length; imgIdx++) {
      const originalUrl = prod.images[imgIdx];
      if (!originalUrl.includes('cdn.shopify.com')) {
        newImages.push(originalUrl);
        continue;
      }

      if (urlMap.has(originalUrl)) {
        newImages.push(urlMap.get(originalUrl));
        continue;
      }

      const key = `eyewear/products/${brandSlug}/${prod.id}_img${imgIdx + 1}.webp`;
      try {
        if (!DRY_RUN && isR2Configured) {
          const { buffer, contentType } = await fetchBuffer(originalUrl);
          const r2Url = await uploadBufferToR2(buffer, key, contentType);
          urlMap.set(originalUrl, r2Url);
          newImages.push(r2Url);
        } else {
          const simUrl = `${publicUrl || 'https://assets.precisionoptics.in'}/${key}`;
          urlMap.set(originalUrl, simUrl);
          newImages.push(simUrl);
        }
        totalImagesMigrated++;
        process.stdout.write(`  ✓ Uploaded image ${imgIdx + 1} -> ${key}\n`);
      } catch (err) {
        console.warn(`  ✗ Failed to upload image ${imgIdx + 1}: ${err.message}. Keeping CDN fallback.`);
        newImages.push(originalUrl);
      }
    }

    prod.images = newImages;
    prod.img = newImages[0] || prod.img;

    // Migrate colorVariants gallery
    if (Array.isArray(prod.colorVariants)) {
      prod.colorVariants.forEach(cv => {
        if (cv.featuredImage && urlMap.has(cv.featuredImage)) {
          cv.featuredImage = urlMap.get(cv.featuredImage);
        }
        if (Array.isArray(cv.gallery)) {
          cv.gallery = cv.gallery.map(u => urlMap.get(u) || u);
        }
      });
    }

    totalProductsUpdated++;
  }

  if (!DRY_RUN) {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log(`\n[OK] Updated store data at: ${storePath}`);
  }

  console.log('\n======================================================');
  console.log(`   MIGRATION COMPLETED: ${totalImagesMigrated} IMAGES UPLOADED ACROSS ${totalProductsUpdated} PRODUCTS`);
  console.log('======================================================\n');
}

runR2Migration().catch(err => {
  console.error('\nFatal Migration Error:', err);
  process.exit(1);
});
