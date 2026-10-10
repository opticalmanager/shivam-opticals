import { Pool, QueryResult, QueryResultRow } from "pg";

/**
 * Shivam Optics - Direct PostgreSQL Database Service
 * Connects directly to the PostgreSQL pooler using server-side DATABASE_URL.
 * Supports Supabase, Neon, AWS RDS, or local PostgreSQL.
 */

function getConnectionString(): string {
  return process.env.DATABASE_URL || process.env.DATABASE_DIRECT_URL || "";
}

declare global {
  // eslint-disable-next-line no-var
  var _shivamAdminPool: Pool | undefined;
}

let pool: Pool | null = null;

export function getPgPool(): Pool | null {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  if (process.env.NODE_ENV === "production") {
    if (!pool) {
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    return pool;
  }

  if (!global._shivamAdminPool) {
    global._shivamAdminPool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return global._shivamAdminPool;
}

export { pool };

/**
 * Execute a parameterized query against PostgreSQL with automatic connection handling
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const activePool = getPgPool();
  if (!activePool) {
    throw new Error(
      "PostgreSQL connection string not configured. Please set DATABASE_URL in .env or .env.local"
    );
  }

  const start = Date.now();
  try {
    const res = await activePool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "production" && duration > 500) {
      console.warn(`[adminDb] Slow query (${duration}ms):`, text.slice(0, 100));
    }
    return res;
  } catch (error) {
    console.error("[adminDb] Query error:", error, "\nQuery:", text);
    throw error;
  }
}
