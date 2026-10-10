/**
 * Phase 7 Comprehensive End-to-End Verification Suite: Full Production Build & QA
 * 
 * Tests:
 * 1. Global TypeScript Typecheck (npx tsc --noEmit).
 * 2. Whole-Codebase Zero Unicode Emojis Audit across all .ts and .tsx files.
 * 3. Client Navigation Audit: Strict Next.js <Link> usage (zero raw <a> for internal routes).
 * 4. Live Supabase PostgreSQL Connectivity & Table Health Check.
 * 5. Full Next.js Production Build (npm run build).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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
console.log('PHASE 7: FULL END-TO-END PRODUCTION BUILD & QA VERIFICATION');
console.log('================================================================\n');

// Helper to recursively collect files
function getFilesRecursively(dir, extensions = ['.ts', '.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(getFilesRecursively(fullPath, extensions));
      }
    } else {
      if (extensions.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// -----------------------------------------------------------------------------
// TEST 1: GLOBAL TYPESCRIPT TYPECHECK
// -----------------------------------------------------------------------------
console.log('TEST 1: Global TypeScript Type Check (npx tsc --noEmit)');
{
  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    assert(true, 'Full codebase compiles cleanly with zero TypeScript errors');
  } catch (err) {
    console.error('TypeScript compilation error:', err.stdout || err.message);
    assert(false, 'TypeScript typecheck failed');
  }
}
console.log('');

// -----------------------------------------------------------------------------
// TEST 2: WHOLE-CODEBASE ZERO UNICODE EMOJIS AUDIT
// -----------------------------------------------------------------------------
console.log('TEST 2: Whole-Codebase Zero Unicode Emojis Audit');
{
  const targetDirs = ['app', 'components', 'context', 'lib'];
  const rootDir = path.join(__dirname, '..');
  let allFiles = [];
  for (const dir of targetDirs) {
    allFiles = allFiles.concat(getFilesRecursively(path.join(rootDir, dir)));
  }

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
  const violations = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (emojiRegex.test(content)) {
      const rel = path.relative(rootDir, file);
      violations.push(rel);
    }
  }

  if (violations.length > 0) {
    console.error('  Emoji violations detected in:');
    violations.forEach(v => console.error(`    - ${v}`));
  }

  assert(violations.length === 0,
    `Zero Unicode Emojis Policy verified across ${allFiles.length} source files (${violations.length} violations found)`);
}
console.log('');

// -----------------------------------------------------------------------------
// TEST 3: CLIENT NAVIGATION AUDIT (ZERO RAW <A> FOR INTERNAL LINKS)
// -----------------------------------------------------------------------------
console.log('TEST 3: Client Navigation Audit (Strict Next.js <Link> Usage)');
{
  const rootDir = path.join(__dirname, '..');
  const tsxFiles = getFilesRecursively(path.join(rootDir, 'app'), ['.tsx'])
    .concat(getFilesRecursively(path.join(rootDir, 'components'), ['.tsx']));

  // Matches <a href="/..." but not <a href="http..." or <a href="tel:..." or <a href="mailto:..."
  const rawInternalLinkRegex = /<a\s+[^>]*href=["']\/(?![\/\\])[^"']*["'][^>]*>/i;
  const linkViolations = [];

  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (rawInternalLinkRegex.test(content)) {
      const rel = path.relative(rootDir, file);
      linkViolations.push(rel);
    }
  }

  if (linkViolations.length > 0) {
    console.error('  Raw <a> tags found for internal routes in:');
    linkViolations.forEach(v => console.error(`    - ${v}`));
  }

  assert(linkViolations.length === 0,
    `Client Navigation Rule: 0 raw <a> tags found across ${tsxFiles.length} UI components (all use next/link)`);
}
console.log('');

// -----------------------------------------------------------------------------
// TEST 4: LIVE SUPABASE POSTGRESQL CONNECTIVITY & TABLE HEALTH CHECK
// -----------------------------------------------------------------------------
console.log('TEST 4: Live Supabase PostgreSQL Connectivity & Table Health');
async function testDbHealth() {
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
    const requiredTables = [
      'orders',
      'order_items',
      'products',
      'coupons',
      'admin_settings',
      'wishlist_items',
      'customer_addresses',
      'otp_verifications',
    ];

    const missingTables = requiredTables.filter(t => !tables.includes(t));
    assert(missingTables.length === 0,
      `All critical tables active in Supabase PostgreSQL (${tables.length} public tables online)`);

    // Quick test query on orders count
    const countRes = await pool.query('SELECT COUNT(*) as c FROM public.orders;');
    assert(countRes.rows.length === 1, `Live query on public.orders successful (${countRes.rows[0].c} records)`);
  } catch (err) {
    console.error('DB health check error:', err.message);
    assert(false, `Database health check failed: ${err.message}`);
  } finally {
    await pool.end();
  }
}

// -----------------------------------------------------------------------------
// TEST 5: FULL NEXT.JS PRODUCTION BUILD
// -----------------------------------------------------------------------------
console.log('TEST 5: Full Next.js Production Build (npm run build)');
function testNextBuild() {
  try {
    console.log('  Executing "npm run build" (this may take 20-40 seconds)...');
    const buildOutput = execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    });
    assert(true, 'Next.js production build succeeded with zero compile or prerendering errors');
  } catch (buildErr) {
    console.error('Next.js build failure output:\n', buildErr.stdout || buildErr.stderr || buildErr.message);
    assert(false, 'Next.js production build failed');
  }
}

// -----------------------------------------------------------------------------
// RUNNER
// -----------------------------------------------------------------------------
testDbHealth().then(() => {
  testNextBuild();

  console.log('================================================================');
  console.log(`PHASE 7 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('ALL PHASE 7 TESTS PASSED! APPLICATION IS 100% PRODUCTION READY.');
    process.exit(0);
  } else {
    console.error(`${failedTests} TESTS FAILED. INVESTIGATE BEFORE SIGN-OFF.`);
    process.exit(1);
  }
}).catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
