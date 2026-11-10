const fs = require('fs');

const dbProducts = JSON.parse(fs.readFileSync('scripts/all_db_products.json', 'utf8'));

console.log('Total DB products:', dbProducts.length);

// Print all brand counts and sample products per brand
const byBrand = {};
dbProducts.forEach(p => {
  const b = p.brand_name || 'UNKNOWN';
  if (!byBrand[b]) byBrand[b] = [];
  byBrand[b].push(p);
});

for (const [brand, list] of Object.entries(byBrand)) {
  console.log(`\n=== Brand: ${brand} (${list.length} products) ===`);
  list.slice(0, 5).forEach(p => {
    console.log(`  - ID: ${p.id.slice(0, 8)} | Name: "${p.name}" | Slug: "${p.slug}" | Cat: ${p.category_name} | Price: ${p.base_price}`);
  });
}
