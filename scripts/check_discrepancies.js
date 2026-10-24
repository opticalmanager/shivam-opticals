const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('scripts/detailed_price_audit.json', 'utf8'));

console.log(`Loaded ${audit.length} audited products.`);

// Helper to extract prices from rawText
function extractPricesFromRaw(rawText) {
  // Looks for 4 or 5 digit numbers that look like optical prices (typically 1500 to 35000)
  const matches = rawText.match(/\b\d{4,5}\b/g) || [];
  return matches.map(Number).filter(n => n >= 1500 && n <= 35000);
}

const discrepancyList = [];
const verifiedExactList = [];
const unlinkedList = [];

for (const item of audit) {
  if (item.matchesCount === 0) {
    unlinkedList.push(item);
    continue;
  }

  // Look across matches for exact or potential prices
  const allCandidatePrices = [];
  item.matches.forEach(m => {
    // Check parsed price
    if (m.parsedPrice >= 1500 && m.parsedPrice <= 35000) {
      allCandidatePrices.push({ price: m.parsedPrice, source: 'parsed', raw: m.rawText });
    }
    // Check raw prices
    const fromRaw = extractPricesFromRaw(m.rawText);
    fromRaw.forEach(p => {
      allCandidatePrices.push({ price: p, source: 'raw', raw: m.rawText });
    });
  });

  const exactMatch = allCandidatePrices.find(cp => Math.abs(cp.price - item.dbPrice) < 1.0);

  if (exactMatch) {
    verifiedExactList.push({
      brand: item.brand,
      name: item.name,
      slug: item.slug,
      price: item.dbPrice,
      matchedRaw: exactMatch.raw
    });
  } else {
    discrepancyList.push({
      id: item.id,
      brand: item.brand,
      name: item.name,
      slug: item.slug,
      dbPrice: item.dbPrice,
      candidatePrices: [...new Set(allCandidatePrices.map(c => c.price))],
      candidateRaws: item.matches.map(m => m.rawText)
    });
  }
}

console.log(`\n======================================================`);
console.log(`PRICE AUDIT SUMMARY:`);
console.log(`✓ Confirmed Exact Price Matches with PDF: ${verifiedExactList.length}`);
console.log(`! Price Discrepancies to Reconcile: ${discrepancyList.length}`);
console.log(`? Unlinked / Non-Numeric Slugs: ${unlinkedList.length}`);
console.log(`======================================================`);

if (discrepancyList.length > 0) {
  console.log(`\n--- PRICE DISCREPANCIES DETAILED ---`);
  discrepancyList.forEach((d, i) => {
    console.log(`\n[${i+1}] [${d.brand}] ${d.name} (${d.slug})`);
    console.log(`    DB Current Price: ₹${d.dbPrice}`);
    console.log(`    PDF Extracted Prices: ₹${d.candidatePrices.join(', ₹')}`);
    console.log(`    PDF Raw Lines: ${d.candidateRaws.slice(0, 3).join(' | ')}`);
  });
}

if (unlinkedList.length > 0) {
  console.log(`\n--- UNLINKED PRODUCTS (${unlinkedList.length}) ---`);
  unlinkedList.forEach((u, i) => {
    console.log(`[${i+1}] [${u.brand}] ${u.name} (${u.slug}) -> DB Price: ₹${u.dbPrice}`);
  });
}
