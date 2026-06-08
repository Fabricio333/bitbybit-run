import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Wipe the match tables before each integration test. The suite shares a
 * single Neon test branch and runs files serially (see vitest.config.ts), so a
 * clean slate per test keeps assertions deterministic. `cascade` clears
 * `results` via its FK; `users` is left alone.
 */
export async function cleanDb(): Promise<void> {
  const db = getDb();
  await db.execute(
    sql`truncate table results, matches restart identity cascade`
  );
}
