// @vitest-environment node
import { describe, it, expect } from "vitest";
import { lnurlpUrl, callbackWithAmount, ZAP_SATS } from "@/lib/lightning/zap";

describe("lightning/zap lnurlpUrl", () => {
  it("maps a Lightning address to its well-known LNURL-pay URL", () => {
    expect(lnurlpUrl("alice@getalby.com")).toBe(
      "https://getalby.com/.well-known/lnurlp/alice"
    );
  });

  it("keeps dotted names and subdomains", () => {
    expect(lnurlpUrl("bob.run@pay.example.io")).toBe(
      "https://pay.example.io/.well-known/lnurlp/bob.run"
    );
  });

  it("rejects malformed addresses", () => {
    for (const bad of [
      "",
      "nope",
      "@domain.com",
      "name@",
      "a@b@c",
      "na me@x.com",
    ]) {
      expect(() => lnurlpUrl(bad)).toThrow("invalid_lud16");
    }
  });
});

describe("lightning/zap callbackWithAmount", () => {
  it("appends the amount (msats) without dropping existing params", () => {
    const out = callbackWithAmount(
      "https://getalby.com/lnurlp/alice/callback?foo=bar",
      ZAP_SATS * 1000
    );
    const url = new URL(out);
    expect(url.searchParams.get("amount")).toBe(String(ZAP_SATS * 1000));
    expect(url.searchParams.get("foo")).toBe("bar");
  });

  it("adds the zap message as the `comment` param when given", () => {
    const url = new URL(
      callbackWithAmount("https://x.com/cb", 21000, "GG! 🏆")
    );
    expect(url.searchParams.get("comment")).toBe("GG! 🏆");
  });

  it("omits `comment` when no message is given", () => {
    const url = new URL(callbackWithAmount("https://x.com/cb", 21000));
    expect(url.searchParams.has("comment")).toBe(false);
  });
});
