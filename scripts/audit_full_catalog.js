const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fullCatalogAudit() {
  const inventory = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));
  const client = await pool.connect();

  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.base_price, p.original_price, p.source_url
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY b.name, p.slug;
    `);

    const products = res.rows;
    console.log(`Auditing all ${products.length} active products against raw PDF rows...`);

    const report = [];

    for (const prod of products) {
      const slug = prod.slug.toLowerCase();
      const name = prod.name.toLowerCase();
      const brand = (prod.brand || '').toLowerCase();
      const dbBasePrice = Number(prod.base_price);
      const dbMrp = Number(prod.original_price);

      // Extract model numbers
      // Match raw items in inventory
      const matchingItems = inventory.filter(item => {
        const iBrand = (item.brand || '').toLowerCase();
        const iModel = (item.model || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const iRaw = (item.rawText || '').toLowerCase();

        // Brand match
        const bMatch = 
          (brand.includes('ray') && (iBrand.includes('ray') || iRaw.includes('rb'))) ||
          (brand.includes('carrera') && (iBrand.includes('carrera') || iRaw.includes('ca'))) ||
          (brand.includes('burberry') && (iBrand.includes('burberry') || iRaw.includes('b-') || iRaw.includes('b1') || iRaw.includes('b2') || iRaw.includes('b3') || iRaw.includes('b4'))) ||
          (brand.includes('vogue') && (iBrand.includes('vogue') || iRaw.includes('vo'))) ||
          (brand.includes('tommy') && (iBrand.includes('tommy') || iRaw.includes('th'))) ||
          (brand.includes('french') && (iBrand.includes('french') || iRaw.includes('fc'))) ||
          (brand.includes('armani exchange') && (iBrand.includes('exchange') || iRaw.includes('ax'))) ||
          (brand.includes('emporio') && (iBrand.includes('emporio') || iRaw.includes('ea'))) ||
          (brand.includes('boss') && (iBrand.includes('boss') || iRaw.includes('boss')));

        if (!bMatch) return false;

        // Check if slug or name contains the item model
        if (iModel.length >= 3 && (slug.includes(iModel) || name.includes(iModel))) return true;

        // Check digits
        const digits = slug.match(/\d{3,5}/g) || [];
        for (const d of digits) {
          if (iRaw.includes(d) || iModel.includes(d)) return true;
        }

        return false;
      });

      report.push({
        id: prod.id,
        slug: prod.slug,
        name: prod.name,
        brand: prod.brand,
        dbBasePrice,
        dbMrp,
        sourceUrl: prod.source_url,
        matchCount: matchingItems.length,
        candidateRaws: matchingItems.map(m => m.rawText)
      });
    }

    fs.writeFileSync('scripts/audit_full_catalog_report.json', JSON.stringify(report, null, 2));
    console.log('Report written to scripts/audit_full_catalog_report.json');

  } finally {
    client.release();
    await pool.end();
  }
}

fullCatalogAudit().catch(console.error);
