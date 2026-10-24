const fs = require('fs');

const inv = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));
const rayban = inv.filter(x => x.brand === 'Ray-Ban');
console.log(`Ray-Ban rows: ${rayban.length}`);

rayban.forEach(r => {
  console.log(`[${r.itemCode}] ${r.model} | col: ${r.color} | parsed: ₹${r.price} | raw: "${r.rawText}"`);
});
