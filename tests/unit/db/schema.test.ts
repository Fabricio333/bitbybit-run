// @vitest-environment node
import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { matches, results, users } from "@/lib/db/schema";

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
        "lud16",
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

describe("db/schema matches", () => {
  const config = getTableConfig(matches);

  it("uses snake_case table name", () => {
    expect(config.name).toBe("matches");
  });

  it("carries the match lifecycle columns", () => {
    const columnNames = config.columns.map((c) => c.name).sort();
    expect(columnNames).toEqual(
      [
        "id",
        "nostr_id",
        "track_id",
        "host_pubkey",
        "started_at",
        "finished_at",
        "created_at",
      ].sort()
    );
  });

  it("keys idempotency on a unique nostr_id", () => {
    const col = config.columns.find((c) => c.name === "nostr_id");
    expect(col?.isUnique).toBe(true);
  });
});

describe("db/schema results", () => {
  const config = getTableConfig(results);

  it("uses snake_case table name", () => {
    expect(config.name).toBe("results");
  });

  it("carries one placement row per player per match", () => {
    const columnNames = config.columns.map((c) => c.name).sort();
    expect(columnNames).toEqual(
      [
        "id",
        "match_id",
        "pubkey",
        "position",
        "points",
        "finish_time",
        "created_at",
      ].sort()
    );
  });

  it("declares a unique index over (match_id, pubkey) for idempotent saves", () => {
    const unique = config.indexes.find(
      (i) => i.config.name === "results_match_pubkey_idx"
    );
    expect(unique).toBeDefined();
    expect(unique?.config.unique).toBe(true);
  });
});
