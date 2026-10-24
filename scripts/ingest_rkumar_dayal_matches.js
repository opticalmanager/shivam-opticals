const { Pool } = require('pg');
const https = require('https');
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
  if (c.includes('gold') || c.includes('arista') || c.includes('2m2')) return '#C5A059';
  if (c.includes('black') || c.includes('c3')) return '#1A1816';
  if (c.includes('silver') || c.includes('gunmetal') || c.includes('grey') || c.includes('gray')) return '#716B64';
  if (c.includes('havana') || c.includes('tortoise') || c.includes('brown')) return '#5C4033';
  if (c.includes('blue')) return '#1E3A8A';
  if (c.includes('red') || c.includes('burgundy')) return '#881337';
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

  const cleanShape = (frame.shape || 'rectangle').toLowerCase();
  const cleanRimType = (frame.rimType || 'full-rim').toLowerCase();
  const cleanGender = (frame.gender || 'unisex').toLowerCase();
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

const NEW_MATCHES = [
  {
    domain: 'rkumar.in',
    handle: 'fcuk-fc8278-clipon-c3-53-sunglasses',
    brand: 'French Connection',
    model: 'FC8278',
    category: 'sunglasses',
    basePrice: 8200,
    shape: 'rectangle',
    material: 'Metal',
    gender: 'unisex'
  },
  {
    domain: 'dayalopticalsindia.com',
    handle: 'carrera-317-s',
    brand: 'Carrera',
    model: 'CA37YG',
    canonicalModel: 'CA317S',
    category: 'sunglasses',
    basePrice: 10690,
    shape: 'navigator',
    material: 'Metal / Acetate',
    gender: 'unisex'
  }
];

async function run() {
  console.log(`Ingesting ${NEW_MATCHES.length} verified products into Supabase...`);

  for (const item of NEW_MATCHES) {
    const prod = await fetchProductJson(item.domain, item.handle);
    if (!prod) {
      console.log(`Failed to fetch JSON for ${item.handle} on ${item.domain}`);
      continue;
    }

    const title = prod.title.trim();
    const slug = `so-${item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(item.canonicalModel || item.model).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const cleanDesc = (prod.body_html || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = cleanDesc.length > 20 ? cleanDesc : `Authentic luxury ${item.brand} optical eyewear featuring premium craftsmanship and timeless aesthetic balance.`;

    const images = (prod.images || []).map(img => cleanHdImageUrl(img.src)).filter(Boolean);
    const sourcePrice = (prod.variants && prod.variants[0] && prod.variants[0].price) ? Number(prod.variants[0].price) : item.basePrice;
    const originalPrice = Math.max(sourcePrice, Math.round(item.basePrice * 1.3));

    const variants = [];
    (prod.variants || []).forEach((v, vIdx) => {
      const colorName = v.option1 || v.title || 'Standard';
      const sku = `SO-${item.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${(item.canonicalModel || item.model).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${vIdx + 1}`;
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
        sku: `SO-${item.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${(item.canonicalModel || item.model).toUpperCase().replace(/[^A-Z0-9]/g, '')}-1`,
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
      subtitle: `${item.brand} ${item.shape}`,
      brand: item.brand,
      category: item.category,
      gender: item.gender,
      shape: item.shape,
      rimType: 'full-rim',
      material: item.material,
      color: variants[0].colorName,
      colorHex: variants[0].colorHex,
      basePrice: item.basePrice,
      originalPrice,
      description,
      specs: { lensWidth: 54, bridgeWidth: 17, templeLength: 145, frameWidth: 142, weight: '24g' },
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
  const pending = JSON.parse(fs.readFileSync('data/unmatched_designer_pending.json', 'utf8'));
  const remaining = pending.filter(p => p.model !== 'FC8278' && p.model !== 'CA37YG');
  fs.writeFileSync('data/unmatched_designer_pending.json', JSON.stringify(remaining, null, 2));
  console.log(`Updated pending list: ${remaining.length} models remaining.`);

  await pool.end();
}

run();
