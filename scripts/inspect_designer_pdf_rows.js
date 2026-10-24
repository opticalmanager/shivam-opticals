const fs = require('fs');

const inv = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));

const designerBrands = [
  'Ray-Ban', 'Carrera', 'Burberry', 'Tommy Hilfiger', 'Vogue',
  'Armani Exchange', 'Emporio Armani', 'Boss', 'French Connection', 'Bebe'
];

const designerRows = inv.filter(x => designerBrands.includes(x.brand));
console.log(`Total designer rows in PDF extracted: ${designerRows.length}`);

// Group by brand
const byBrand = {};
designerRows.forEach(r => {
  byBrand[r.brand] = byBrand[r.brand] || [];
  byBrand[r.brand].push(r);
});

for (const [brand, rows] of Object.entries(byBrand)) {
  console.log(`\n=================== ${brand.toUpperCase()} (${rows.length} rows in PDF) ===================`);
  rows.forEach(r => {
    console.log(`[${r.itemCode}] ${r.model} | color: ${r.color} | price: ₹${r.price} | raw: "${r.rawText}"`);
  });
}
