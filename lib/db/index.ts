import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

let db: ReturnType<typeof createDb> | null = null;
let pool: Pool | null = null;

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}

export function getDb() {
  if (!db) db = createDb();
  return db;
}

export type Db = ReturnType<typeof getDb>;

export * from "./schema";
