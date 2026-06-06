import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { Kind0Profile } from "@/lib/nostr/profile";

/**
 * User row helpers. One row per signed-in Nostr account, keyed by
 * their pubkey. Auto-created at sign-in from kind:0 metadata.
 *
 * Conventions:
 *   - Reads accept either a pubkey or a slug; writes always go
 *     through the row id so the caller has already proven they
 *     are talking about a specific row.
 */

export type User = typeof users.$inferSelect;

export const UpdateUserProfileSchema = z
  .object({
    display_name: z.string().trim().min(2).max(80),
    bio: z.string().trim().max(500).nullable(),
    avatar_url: z.string().trim().url().nullable(),
    banner_url: z.string().trim().url().nullable(),
    locale: z.enum(["es", "en"]),
  })
  .partial();

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

export async function getUserByPubkey(pubkey: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.pubkey, pubkey))
    .limit(1);
  return row ?? null;
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function listActiveUsers(): Promise<User[]> {
  const db = getDb();
  return db.select().from(users).where(eq(users.active, true));
}

/** Route slugs the user-derived slug must never collide with. */
const RESERVED_SLUGS = new Set([
  "sign-in",
  "play",
  "how-to-play",
  "api",
  "settings",
  "admin",
]);

/**
 * Slugify a free-form display name into a URL-safe slug. Lowercase,
 * ASCII-only, hyphens between word boundaries, max 40 chars, no
 * leading/trailing hyphens. Returns null when the input does not
 * produce at least 3 valid characters or matches a reserved route
 * slug — caller falls back to the pubkey-derived placeholder.
 */
export function slugifyDisplayName(name: string): string | null {
  const slug = name
    .normalize("NFKD")
    // Strip combining diacritical marks (U+0300–U+036F) so accented
    // chars decompose to their base letter (`é` → `e`, `ñ` → `n`).
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  if (slug.length < 3) return null;
  if (RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

export interface InitialUserProfile {
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  /** Lightning address (kind:0 `lud16`) for zapping winnings. */
  lud16?: string;
  /**
   * Default UI locale to seed on *creation* — the locale the user
   * signed in with the first time. Applied only when the row is
   * inserted; a returning user keeps the preference they saved
   * (ensureUserForPubkey short-circuits on existing rows). Falls back
   * to the column default ("es") when omitted.
   */
  locale?: "es" | "en";
}

/**
 * Return the user row keyed to `pubkey`, creating it lazily if it
 * does not exist. The row is seeded from the user's Nostr kind:0
 * metadata at sign-in time when available; subsequent calls without
 * `initial` are pure reads + a placeholder fallback for legacy or
 * relay-failed cases.
 */
export async function ensureUserForPubkey(
  pubkey: string,
  initial?: InitialUserProfile
): Promise<User> {
  const existing = await getUserByPubkey(pubkey);
  if (existing) return existing;

  const db = getDb();
  const placeholderSlug = `user-${pubkey.slice(0, 8).toLowerCase()}`;
  const namedSlug =
    initial?.display_name && slugifyDisplayName(initial.display_name);
  // Try the named slug first; fall back to the pubkey-derived
  // placeholder if it's missing/reserved/already taken.
  const candidates = [namedSlug, placeholderSlug].filter(
    (s): s is string => typeof s === "string"
  );
  const displayName = initial?.display_name?.trim() || placeholderSlug;

  // Retry on slug collision. The pubkey-prefixed candidate is
  // astronomically unlikely to collide; the named slug can if two
  // users share a display name. Final fallback uses a short random
  // suffix.
  const attempts = [
    ...candidates,
    `${placeholderSlug}-${Math.random().toString(36).slice(2, 6)}`,
    `${placeholderSlug}-${Math.random().toString(36).slice(2, 6)}`,
    `${placeholderSlug}-${Math.random().toString(36).slice(2, 6)}`,
  ];

  for (const slug of attempts) {
    try {
      const [row] = await db
        .insert(users)
        .values({
          pubkey,
          slug,
          display_name: displayName,
          avatar_url: initial?.avatar_url ?? null,
          banner_url: initial?.banner_url ?? null,
          bio: initial?.bio ?? null,
          lud16: initial?.lud16 ?? null,
          // Seed the preferred locale from the sign-in locale; the
          // column default ("es") covers callers that omit it.
          ...(initial?.locale ? { locale: initial.locale } : {}),
        })
        .returning();
      return row;
    } catch (err) {
      // A concurrent request claimed the pubkey first; re-read.
      const winner = await getUserByPubkey(pubkey);
      if (winner) return winner;
      // Slug collision — try the next candidate. Anything else,
      // bubble up.
      const message = err instanceof Error ? err.message : String(err);
      if (!/slug/i.test(message)) throw err;
    }
  }
  throw new Error("ensure_user_failed: slug retries exhausted");
}

/**
 * Compute which row fields to refresh from a kind:0 profile (pure;
 * unit-tested). Conservative by design — never clobbers a value the
 * user has set:
 *   - `display_name` is replaced only while it still equals the
 *     pubkey-derived placeholder (`user-<8hex>`).
 *   - `avatar_url`, `banner_url`, `bio` are filled only when empty.
 * Returns the (possibly empty) patch; `slug` is never included —
 * changing it would break the user's profile URL.
 */
export function kind0RefreshPatch(
  existing: User,
  profile: Kind0Profile
): Partial<User> {
  const isEmpty = (v: string | null | undefined): boolean =>
    !v || v.trim().length === 0;

  const next: Partial<User> = {};

  const placeholderName = `user-${existing.pubkey.slice(0, 8).toLowerCase()}`;
  const kind0Name = profile.display_name?.trim() || profile.name?.trim();
  if (kind0Name && existing.display_name === placeholderName) {
    next.display_name = kind0Name.slice(0, 80);
  }
  if (isEmpty(existing.avatar_url) && profile.picture?.trim()) {
    next.avatar_url = profile.picture.trim();
  }
  if (isEmpty(existing.banner_url) && profile.banner?.trim()) {
    next.banner_url = profile.banner.trim();
  }
  if (isEmpty(existing.bio) && profile.about?.trim()) {
    next.bio = profile.about.trim();
  }
  if (isEmpty(existing.lud16) && profile.lud16?.trim()) {
    next.lud16 = profile.lud16.trim();
  }

  return next;
}

/**
 * Force-refresh a user row from kind:0 metadata — used by the manual
 * "sync profile from Nostr" action. Unlike `kind0RefreshPatch`, this
 * OVERWRITES name/avatar/banner/bio/lud16 with whatever Nostr currently
 * has (Nostr is the source of truth; there's no in-app profile editor).
 * `slug` is left untouched so the user's URL stays stable.
 */
export async function syncUserFromKind0(
  pubkey: string,
  profile: Kind0Profile
): Promise<User | null> {
  const existing = await getUserByPubkey(pubkey);
  if (!existing) return null;

  const kind0Name = profile.display_name?.trim() || profile.name?.trim();
  const next: Partial<User> = { updated_at: new Date() };
  if (kind0Name) next.display_name = kind0Name.slice(0, 80);
  next.avatar_url = profile.picture?.trim() || null;
  next.banner_url = profile.banner?.trim() || null;
  next.bio = profile.about?.trim() || null;
  next.lud16 = profile.lud16?.trim() || null;

  const db = getDb();
  const [row] = await db
    .update(users)
    .set(next)
    .where(eq(users.id, existing.id))
    .returning();
  return row;
}

/**
 * Refresh an existing user row from freshly-fetched kind:0 metadata at
 * sign-in. `ensureUserForPubkey` seeds a row only on *creation*; a row
 * created during a sign-in whose relay fetch timed out keeps its
 * placeholder `display_name` forever otherwise.
 *
 * Best-effort: callers wrap this in try/catch and never fail sign-in
 * over it. The patch logic lives in `kind0RefreshPatch`.
 */
export async function refreshUserFromKind0(
  pubkey: string,
  profile: Kind0Profile
): Promise<void> {
  const existing = await getUserByPubkey(pubkey);
  if (!existing) return;

  const next = kind0RefreshPatch(existing, profile);
  if (Object.keys(next).length === 0) return;
  next.updated_at = new Date();

  const db = getDb();
  await db.update(users).set(next).where(eq(users.id, existing.id));
}

/**
 * Update mutable profile fields on an existing user row.
 */
export async function updateUserProfile(
  id: string,
  patch: UpdateUserProfileInput
): Promise<User> {
  const db = getDb();
  const before = await getUserById(id);
  if (!before) {
    throw new Error(`user_not_found: ${id}`);
  }

  const next: Partial<User> = { updated_at: new Date() };
  if (patch.display_name !== undefined) next.display_name = patch.display_name;
  if (patch.bio !== undefined) next.bio = patch.bio;
  if (patch.avatar_url !== undefined) next.avatar_url = patch.avatar_url;
  if (patch.banner_url !== undefined) next.banner_url = patch.banner_url;
  if (patch.locale !== undefined) next.locale = patch.locale;

  const [row] = await db
    .update(users)
    .set(next)
    .where(eq(users.id, id))
    .returning();

  return row;
}
