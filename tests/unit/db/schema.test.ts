// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { users } from "@/lib/db/schema";

describe("db/schema users", () => {
  const config = getTableConfig(users);

  it("uses snake_case table name", () => {
    expect(config.name).toBe("users");
  });

  it("keys identity by pubkey and slug as unique", () => {
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toContain("pubkey");
    expect(columnNames).toContain("slug");
  });

  it("only carries the trimmed (non-commerce) columns", () => {
    const columnNames = config.columns.map((c) => c.name).sort();
    expect(columnNames).toEqual(
      [
        "id",
        "pubkey",
        "slug",
        "display_name",
        "bio",
        "avatar_url",
        "banner_url",
        "locale",
        "active",
        "created_at",
        "updated_at",
      ].sort()
    );
  });

  it("dropped all commerce/payout columns", () => {
    const columnNames = config.columns.map((c) => c.name);
    for (const dropped of [
      "payout_method",
      "cbu",
      "alias",
      "lightning_address",
      "nostr_lightning_address",
      "nwc_uri",
    ]) {
      expect(columnNames).not.toContain(dropped);
    }
  });
});
