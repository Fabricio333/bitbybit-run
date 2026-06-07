// @vitest-environment node
import { describe, expect, it } from "vitest";
import { publicRequestUrl } from "@/lib/auth/request-url";

describe("publicRequestUrl", () => {
  it("prefers forwarded host and proto over the internal tunnel origin", () => {
    const headers = new Headers({
      host: "localhost:3018",
      "x-forwarded-host": "run.fabri.lat",
      "x-forwarded-proto": "https",
    });

    expect(
      publicRequestUrl("http://localhost:3018/api/auth/nostr", headers)
    ).toBe("https://run.fabri.lat/api/auth/nostr");
  });

  it("keeps path and query string when rebuilding the public URL", () => {
    const headers = new Headers({
      "x-forwarded-host": "run.fabri.lat",
      "x-forwarded-proto": "https",
    });

    expect(
      publicRequestUrl("http://127.0.0.1:3018/api/auth/nostr?x=1", headers)
    ).toBe("https://run.fabri.lat/api/auth/nostr?x=1");
  });

  it("falls back to the input URL without forwarded headers", () => {
    expect(
      publicRequestUrl("http://localhost:3018/api/auth/nostr", new Headers())
    ).toBe("http://localhost:3018/api/auth/nostr");
  });
});
