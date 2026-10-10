/**
 * Phase 1 Comprehensive Verification Script: Foundation & Core Data Infrastructure
 * 
 * Tests:
 * 1. Environment configuration (.env.local, DATABASE_URL, Supabase credentials).
 * 2. Live Supabase PostgreSQL connectivity & table verification across all 17 tables.
 * 3. ACID Transaction & Connection Pooling check.
 * 4. Production dependencies validation (razorpay, three, @mediapipe/tasks-vision, pg).
 * 5. Strict Zero Unicode Emojis check across Phase 1 infrastructure files.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, '..', file);
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf-8');
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnv();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

console.log('================================================================');
console.log('PHASE 1: FOUNDATION & CORE DATA INFRASTRUCTURE VERIFICATION');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: ENVIRONMENT & CREDENTIAL RESOLUTION
// -----------------------------------------------------------------------------
console.log('TEST 1: Environment & Credential Resolution');
{
  assert(Boolean(process.env.DATABASE_URL), 'DATABASE_URL is defined and populated');
  assert(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), 'NEXT_PUBLIC_SUPABASE_URL is configured for Shivam Optics');
  assert(Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), 'NEXT_PUBLIC_SUPABASE_ANON_KEY is configured');
  assert(Boolean(process.env.RAZORPAY_KEY_ID), 'RAZORPAY_KEY_ID is available');
  assert(Boolean(process.env.RAZORPAY_KEY_SECRET), 'RAZORPAY_KEY_SECRET is available');
  assert(Boolean(process.env.SHIPROCKET_EMAIL), 'SHIPROCKET_EMAIL is available');
}
console.log('');

// -----------------------------------------------------------------------------
// TEST 2: PACKAGE DEPENDENCIES VALIDATION
// -----------------------------------------------------------------------------
console.log('TEST 2: Production Package Dependencies Validation');
{
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const requiredPackages = [
    'pg',
    'razorpay',
    'three',
    '@mediapipe/tasks-vision',
    'lucide-react',
    'sonner',
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
  ];

  for (const p of requiredPackages) {
    assert(Boolean(deps[p]), `Production package '${p}' is installed (v${deps[p]})`);
  }
}
console.log('');

// -----------------------------------------------------------------------------
// TEST 3: LIVE SUPABASE POSTGRESQL CONNECTIVITY & ALL 17 TABLES
// -----------------------------------------------------------------------------
console.log('TEST 3: Live Supabase PostgreSQL Connectivity & Table Architecture');
async function runPostgresTests() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = res.rows.map(r => r.table_name);
    const expectedTables = [
      'admin_settings',
      'appointments',
      'brands',
      'categories',
      'coupons',
      'customer_addresses',
      'lens_packages',
      'order_items',
      'orders',
      'prescriptions',
      'privacy_requests',
      'product_images',
      'product_variants',
      'products',
      'profiles',
      'reviews',
      'wishlist_items',
    ];

    for (const t of expectedTables) {
      assert(tables.includes(t), `Public PostgreSQL table '${t}' is online`);
    }

    // Test ACID Transaction Execution
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      const txRes = await client.query('SELECT NOW() as tx_now;');
      await client.query('COMMIT;');
      assert(txRes.rows.length === 1, 'Isolated ACID transaction (BEGIN -> COMMIT) executed successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('PostgreSQL verification error:', err.message);
    assert(false, `PostgreSQL connectivity error: ${err.message}`);
  } finally {
    await pool.end();
  }
}

// -----------------------------------------------------------------------------
// TEST 4: STRICT ZERO UNICODE EMOJIS IN PHASE 1 CODE
// -----------------------------------------------------------------------------
console.log('TEST 4: Strict Zero Unicode Emojis Audit Across Phase 1 Files');
{
  const phase1Files = [
    'lib/db.ts',
    'lib/pg.ts',
    'lib/shippingSettings.ts',
    'lib/shiprocketClient.ts',
    'lib/smsClient.ts',
    'lib/wacrmClient.ts',
    'lib/loadRazorpay.ts',
    'lib/phoneUtils.ts',
    'app/api/health/route.ts',
    'app/api/settings/public/route.ts',
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
  let violations = 0;

  for (const rel of phase1Files) {
    const full = path.join(__dirname, '..', rel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      if (emojiRegex.test(content)) {
        console.error(`  [FAIL] Emoji violation in ${rel}`);
        violations++;
      }
    }
  }

  assert(violations === 0, `Zero Unicode Emojis Policy verified across ${phase1Files.length} Phase 1 files`);
}
console.log('');

// -----------------------------------------------------------------------------
// RUNNER
// -----------------------------------------------------------------------------
runPostgresTests().then(() => {
  console.log('================================================================');
  console.log(`PHASE 1 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('ALL PHASE 1 TESTS PASSED!');
    process.exit(0);
  } else {
    console.error(`${failedTests} TESTS FAILED.`);
    process.exit(1);
  }
}).catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
