const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Manually load .env.local and .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, "utf-8");
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || "").trim();
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

async function runMigrations() {
  loadEnv();

  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL is not set in .env.local or .env");
    console.error("Please add your PostgreSQL connection string and try again.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL database...");
  console.log(`Connection target: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.error("Migration directory not found:", migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration file(s) in supabase/migrations:\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`▶ Executing ${file}...`);
    try {
      await pool.query(sql);
      console.log(`  ✓ ${file} applied successfully.\n`);
    } catch (err) {
      console.error(`  ✕ Migration ${file} failed:`, err.message);
      await pool.end();
      process.exit(1);
    }
  }

  console.log("All migrations applied successfully to Supabase!");
  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
