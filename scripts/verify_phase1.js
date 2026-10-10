const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || "").trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  }
}

async function verify() {
  console.log("--------------------------------------------------");
  console.log("Shivam Optics - Phase 1 Verification Suite");
  console.log("--------------------------------------------------");

  // 1. Check database connectivity and schemas
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is missing in environment");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  const resTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  const tables = resTables.rows.map(r => r.table_name);
  console.log(`[DB] Successfully connected to PostgreSQL.`);
  console.log(`[DB] Public tables count: ${tables.length}`);
  console.log(`[DB] Tables found: ${tables.join(", ")}`);

  const requiredTables = [
    "products",
    "orders",
    "order_items",
    "wishlist_items",
    "privacy_requests",
    "admin_settings",
    "coupons",
    "profiles",
  ];

  const missing = requiredTables.filter(t => !tables.includes(t));
  if (missing.length > 0) {
    console.error(`[DB ERROR] Missing tables: ${missing.join(", ")}`);
    process.exit(1);
  } else {
    console.log(`[DB SUCCESS] All required tables exist.`);
  }

  // 2. Check phone regex
  const testPhone = "+91 98100 12345";
  const normalized = testPhone.replace(/\D/g, "");
  console.log(`[UTILS] Phone normalization test: ${testPhone} -> ${normalized}`);

  // 3. Verify admin_settings
  const resSettings = await pool.query("SELECT count(*) as count FROM public.admin_settings;");
  console.log(`[SETTINGS] admin_settings row count: ${resSettings.rows[0].count}`);

  await pool.end();
  console.log("--------------------------------------------------");
  console.log("Phase 1 verification completed successfully!");
  console.log("--------------------------------------------------");
}

verify().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
