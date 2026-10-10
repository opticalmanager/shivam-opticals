const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Regex to detect Unicode Emojis (standard emoji ranges, symbols, pictographs)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2705}]|[\u{274C}]/u;

function checkEmojisInDirectory(dirPath) {
  let emojiViolations = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      emojiViolations = emojiViolations.concat(checkEmojisInDirectory(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, lineIdx) => {
        const match = line.match(EMOJI_REGEX);
        if (match) {
          emojiViolations.push({
            file: path.relative(ROOT, fullPath),
            line: lineIdx + 1,
            match: match[0],
            snippet: line.trim().slice(0, 80)
          });
        }
      });
    }
  }
  return emojiViolations;
}

console.log('=== 1. Checking Zero Unicode Emojis Policy across Admin ===');
const adminEmojis = checkEmojisInDirectory(path.join(ROOT, 'app', 'admin'));
const compEmojis = checkEmojisInDirectory(path.join(ROOT, 'components', 'admin'));
const allViolations = [...adminEmojis, ...compEmojis];

if (allViolations.length === 0) {
  console.log('PASS: 0 Unicode emojis found across all admin pages and components!');
} else {
  console.log(`FAIL: Found ${allViolations.length} Unicode emoji violations:`);
  allViolations.forEach(v => {
    console.log(`  - [${v.file}:${v.line}] Emoji "${v.match}": ${v.snippet}`);
  });
}

console.log('\n=== 2. Checking Admin Parity Components Existence & Sizes ===');
const requiredFiles = [
  'app/admin/settings/page.tsx',
  'app/admin/payments/page.tsx',
  'app/admin/shipping/page.tsx',
  'app/admin/shipping/api/page.tsx',
  'app/admin/orders/[id]/page.tsx',
  'app/admin/try-on-calibrator/page.tsx',
  'components/admin/products/ProductForm.tsx',
  'app/admin/inventory/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/brands/page.tsx',
  'app/admin/categories/page.tsx',
  'app/api/admin/fast2sms/wallet/route.ts',
  'app/api/admin/demo-products/route.ts',
  'app/api/webhooks/delivery/route.ts',
  'app/api/admin/customers/route.ts'
];

let allExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    console.log(`PASS: ${file} exists (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`FAIL: ${file} MISSING!`);
    allExist = false;
  }
});

console.log('\n=== 3. Checking Try-On Gatekeeping ===');
const productDetailContent = fs.readFileSync(path.join(ROOT, 'app/product/[id]/ProductDetailView.tsx'), 'utf-8');
const productCardContent = fs.readFileSync(path.join(ROOT, 'components/home/ProductCard.tsx'), 'utf-8');

const detailGated = productDetailContent.includes('hasTryOnModel(product)') && productDetailContent.includes('3D TRY-ON');
const cardGated = productCardContent.includes('hasTryOnModel(product)');

console.log(`ProductDetailView 3D button gated by hasTryOnModel: ${detailGated ? 'PASS' : 'FAIL'}`);
console.log(`ProductCard 3D indicator gated by hasTryOnModel: ${cardGated ? 'PASS' : 'FAIL'}`);

console.log('\n=== Verification Summary Complete ===');
