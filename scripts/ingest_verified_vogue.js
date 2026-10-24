const https = require('https');
const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

function fetchProductJson(domain, handle) {
  return new Promise(resolve => {
    const url = 'https://' + domain + '/products/' + handle + '.json';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.product || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function cleanHdImageUrl(url) {
  if (!url) return null;
  const noQuery = url.split('?')[0];
  const withProtocol = noQuery.startsWith('//') ? `https:${noQuery}` : noQuery;
  return withProtocol.replace(/_(small|medium|compact|large|grande|1024x1024|2048x2048|master)\./i, '.');
}

function resolveColorHex(colorName) {
  if (!colorName) return '#1A1816';
  const c = colorName.toLowerCase();
  if (c.includes('gold') || c.includes('arista')) return '#C5A059';
  if (c.includes('black') || c.includes('w44')) return '#1A1816';
  if (c.includes('silver') || c.includes('gunmetal') || c.includes('grey') || c.includes('gray')) return '#716B64';
  if (c.includes('havana') || c.includes('tortoise') || c.includes('w656') || c.includes('brown')) return '#5C4033';
  if (c.includes('blue')) return '#1E3A8A';
  if (c.includes('red') || c.includes('burgundy') || c.includes('cherry')) return '#881337';
  if (c.includes('pink') || c.includes('3290')) return '#E8B4B8';
  return '#2D2926';
}

async function insertIntoSupabase(client, frame) {
  let brandId = null;
  const brandSlug = frame.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const bRes = await client.query('SELECT id FROM public.brands WHERE slug = $1 LIMIT 1;', [brandSlug]);
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

  let categoryId = null;
  const cRes = await client.query('SELECT id FROM public.categories WHERE slug = $1 LIMIT 1;', [frame.category]);
  if (cRes.rows.length > 0) {
    categoryId = cRes.rows[0].id;
  } else {
    const cDefault = await client.query('SELECT id FROM public.categories LIMIT 1;');
    if (cDefault.rows.length > 0) categoryId = cDefault.rows[0].id;
  }

  const cleanShape = (frame.shape || 'cat-eye').toLowerCase();
  const cleanRimType = (frame.rimType || 'full-rim').toLowerCase();
  const cleanGender = (frame.gender || 'women').toLowerCase();
  const cleanOriginalPrice = frame.originalPrice && frame.originalPrice >= frame.basePrice ? frame.originalPrice : Math.round(frame.basePrice * 1.35);

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

  for (const v of frame.variants) {
    await client.query(
      `INSERT INTO public.product_variants (product_id, color_name, color_hex, sku, stock_quantity, price_override)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (sku) DO UPDATE
       SET stock_quantity = EXCLUDED.stock_quantity, price_override = EXCLUDED.price_override, updated_at = NOW();`,
      [productId, v.colorName, v.colorHex, v.sku, v.stockQuantity, v.price !== frame.basePrice ? v.price : null]
    );
  }

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

const ITEMS_TO_INGEST = [
  {
    domain: 'prismeyecare.in',
    handle: 'vogue-vo-5701u-3290-51',
    model: 'VO5701',
    basePrice: 1990,
    shape: 'cat-eye',
    material: 'Acetate',
    gender: 'women',
    colorsToRemove: ['VO57013290', 'VO57013289']
  },
  {
    domain: 'prismeyecare.in',
    handle: 'vogue-ovo-5719i-w656-52',
    model: 'VO5719',
    basePrice: 1990,
    shape: 'cat-eye',
    material: 'Acetate',
    gender: 'women',
    colorsToRemove: ['VO57192966']
  },
  {
    domain: 'prismeyecare.in',
    handle: 'vogue-vo-51201-2288-52',
    model: 'VO5120',
    basePrice: 1990,
    shape: 'rectangular',
    material: 'Acetate',
    gender: 'women',
    colorsToRemove: ['VO51202288']
  },
  {
    domain: 'himalayaoptical.com',
    handle: 'vogue-5276-spectacle',
    model: 'VO5276',
    basePrice: 1990,
    shape: 'cat-eye',
    material: 'Acetate',
    gender: 'women',
    colorsToRemove: ['VO5C762940', 'VO5C76296K']
  }
];

async function run() {
  console.log(`Ingesting ${ITEMS_TO_INGEST.length} verified Vogue models...`);

  for (const item of ITEMS_TO_INGEST) {
    const prod = await fetchProductJson(item.domain, item.handle);
    if (!prod) {
      console.log(`Failed to fetch ${item.handle} on ${item.domain}`);
      continue;
    }

    const title = prod.title.trim();
    const slug = `so-vogue-${item.model.toLowerCase()}`;
    const cleanDesc = (prod.body_html || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = cleanDesc.length > 20 ? cleanDesc : `Authentic luxury Vogue Eyewear frames featuring iconic Italian styling, premium acetate, and ergonomic comfort.`;

    const images = (prod.images || []).map(img => cleanHdImageUrl(img.src)).filter(Boolean);
    const sourcePrice = (prod.variants && prod.variants[0] && prod.variants[0].price) ? Number(prod.variants[0].price) : item.basePrice;
    const originalPrice = Math.max(sourcePrice, Math.round(item.basePrice * 1.5));

    const variants = [];
    (prod.variants || []).forEach((v, vIdx) => {
      const colorName = v.option1 || v.title || 'Standard';
      const sku = `SO-VOGUE-${item.model.toUpperCase()}-${vIdx + 1}`;
      variants.push({
        sku,
        colorName,
        colorHex: resolveColorHex(colorName),
        price: item.basePrice,
        stockQuantity: 12,
      });
    });

    if (variants.length === 0) {
      variants.push({
        sku: `SO-VOGUE-${item.model.toUpperCase()}-1`,
        colorName: 'Standard',
        colorHex: '#1A1816',
        price: item.basePrice,
        stockQuantity: 12,
      });
    }

    const masterFrame = {
      sourceUrl: `https://${item.domain}/products/${item.handle}`,
      slug,
      name: title,
      subtitle: `Vogue Eyewear ${item.shape}`,
      brand: 'Vogue',
      category: 'eyeglasses',
      gender: item.gender,
      shape: item.shape,
      rimType: 'full-rim',
      material: item.material,
      color: variants[0].colorName,
      colorHex: variants[0].colorHex,
      basePrice: item.basePrice,
      originalPrice,
      description,
      specs: { lensWidth: 52, bridgeWidth: 17, templeLength: 140, frameWidth: 138, weight: '20g' },
      packageDimensions: { lengthCm: 18, breadthCm: 9, heightCm: 7, weightKg: 0.25 },
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'],
      variants,
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      const pId = await insertIntoSupabase(client, masterFrame);
      await client.query('COMMIT;');
      console.log(`✓ INGESTED INTO SUPABASE: ${title} (Product ID: ${pId}) | Variants: ${variants.length} | Images: ${masterFrame.images.length}`);
    } catch (e) {
      await client.query('ROLLBACK;');
      console.error(`Error ingesting ${slug}:`, e.message);
    } finally {
      client.release();
    }
  }

  // Update pending list
  const modelsToRemove = new Set(ITEMS_TO_INGEST.flatMap(it => it.colorsToRemove));
  const pending = JSON.parse(fs.readFileSync('data/unmatched_designer_pending.json', 'utf8'));
  const remaining = pending.filter(p => !modelsToRemove.has(p.model));
  fs.writeFileSync('data/unmatched_designer_pending.json', JSON.stringify(remaining, null, 2));
  console.log(`Updated pending list: ${remaining.length} models remaining.`);

  await pool.end();
}

run();
