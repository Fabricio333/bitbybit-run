// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  slugifyDisplayName,
  kind0RefreshPatch,
  UpdateUserProfileSchema,
} from "@/lib/creator/users";
import type { User } from "@/lib/creator/users";
import type { Kind0Profile } from "@/lib/nostr/profile";

// 8-hex-prefixed pubkey so the placeholder name is deterministic.
const PUBKEY = "abc12345" + "f".repeat(56);
const PLACEHOLDER_NAME = "user-abc12345";

// Minimal User stub matching the trimmed schema.
function makeUser(overrides: Partial<User>): User {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    pubkey: PUBKEY,
    slug: "user-x",
    display_name: "X",
    bio: null,
    avatar_url: null,
    banner_url: null,
    locale: "es",
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as User;
}

describe("slugifyDisplayName", () => {
  it("lowercases and hyphenates word boundaries", () => {
    expect(slugifyDisplayName("Profe Bitcoin")).toBe("profe-bitcoin");
    expect(slugifyDisplayName("Maria Lopez")).toBe("maria-lopez");
  });

  it("strips diacritical marks via NFKD", () => {
    expect(slugifyDisplayName("Joaquín Acosta")).toBe("joaquin-acosta");
    expect(slugifyDisplayName("Sofía Pérez")).toBe("sofia-perez");
    expect(slugifyDisplayName("Año Nuevo")).toBe("ano-nuevo");
  });

  it("collapses runs of separator characters", () => {
    expect(slugifyDisplayName("a   b\t\nc")).toBe("a-b-c");
    expect(slugifyDisplayName("foo___bar")).toBe("foo-bar");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugifyDisplayName("--hello--")).toBe("hello");
  });

  it("drops emoji and other non-ASCII chars", () => {
    expect(slugifyDisplayName("🚀 Rocket Runner")).toBe("rocket-runner");
  });

  it("truncates to 40 characters", () => {
    const result = slugifyDisplayName("a".repeat(50));
    expect(result?.length).toBeLessThanOrEqual(40);
    expect(result).not.toMatch(/-$/);
  });

  it("returns null for too-short or reserved slugs", () => {
    expect(slugifyDisplayName("ab")).toBeNull();
    expect(slugifyDisplayName("play")).toBeNull();
  });
});

describe("kind0RefreshPatch", () => {
  it("replaces a placeholder display_name with the kind:0 name", () => {
    const user = makeUser({ display_name: PLACEHOLDER_NAME });
    const profile: Kind0Profile = { display_name: "Alice" };
    expect(kind0RefreshPatch(user, profile)).toEqual({ display_name: "Alice" });
  });

  it("never clobbers a user-set display_name", () => {
    const user = makeUser({ display_name: "My Name" });
    const profile: Kind0Profile = { display_name: "Alice" };
    expect(kind0RefreshPatch(user, profile).display_name).toBeUndefined();
  });

  it("fills empty avatar/banner/bio only", () => {
    const user = makeUser({ avatar_url: null, banner_url: "x", bio: null });
    const profile: Kind0Profile = {
      picture: "https://img/a.png",
      banner: "https://img/b.png",
      about: "hi",
    };
    const patch = kind0RefreshPatch(user, profile);
    expect(patch.avatar_url).toBe("https://img/a.png");
    expect(patch.banner_url).toBeUndefined();
    expect(patch.bio).toBe("hi");
  });

  it("returns an empty patch when nothing to fill", () => {
    const user = makeUser({ display_name: "Set", avatar_url: "x", bio: "y" });
    expect(kind0RefreshPatch(user, {})).toEqual({});
  });
});

describe("UpdateUserProfileSchema", () => {
  it("accepts a partial patch", () => {
    const out = UpdateUserProfileSchema.safeParse({ display_name: "Bob" });
    expect(out.success).toBe(true);
  });

  it("rejects an invalid locale", () => {
    const out = UpdateUserProfileSchema.safeParse({ locale: "fr" });
    expect(out.success).toBe(false);
  });
});
