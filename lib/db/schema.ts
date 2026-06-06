import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// --- Users ---
// One row per signed-in account. Keyed by Nostr pubkey — the user's
// identity is their key, period. Auto-created at sign-in from kind:0
// metadata (display name, avatar, banner, bio).
//
// `active` is the platform-admin moderation gate. Inactive users
// disappear from discovery surfaces but the row + history stays for
// audit.
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pubkey: varchar("pubkey", { length: 64 }).notNull().unique(),
    slug: varchar("slug", { length: 40 }).notNull().unique(),
    display_name: varchar("display_name", { length: 80 }).notNull(),
    bio: text("bio"),
    avatar_url: text("avatar_url"),
    // Wide banner image displayed behind the avatar + name + bio.
    // Seeded from kind:0 `banner` at sign-in. Null when unset.
    banner_url: text("banner_url"),
    // Lightning address (kind:0 `lud16`) used to zap this user's race
    // winnings. Seeded + re-synced from Nostr; null when unset.
    lud16: varchar("lud16", { length: 255 }),
    // Default UI language for this user.
    locale: varchar("locale", { length: 2 }).notNull().default("es"),
    active: boolean("active").notNull().default(true),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_pubkey_idx").on(table.pubkey),
    uniqueIndex("users_slug_idx").on(table.slug),
    index("users_active_idx").on(table.active),
  ]
);
