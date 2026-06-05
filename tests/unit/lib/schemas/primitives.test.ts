// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Hex64Schema, Hex128Schema } from "@/lib/schemas/primitives";

describe("Hex64Schema", () => {
  it("accepts a 64-char hex string and lowercases", () => {
    const out = Hex64Schema.parse("ABCDEF" + "0".repeat(58));
    expect(out).toBe("abcdef" + "0".repeat(58));
  });

  it("trims whitespace around the input", () => {
    const out = Hex64Schema.parse("  " + "a".repeat(64) + "  ");
    expect(out).toBe("a".repeat(64));
  });

  it("rejects strings of the wrong length", () => {
    expect(Hex64Schema.safeParse("abc").success).toBe(false);
    expect(Hex64Schema.safeParse("a".repeat(63)).success).toBe(false);
  });
});

describe("Hex128Schema", () => {
  it("accepts a 128-char hex string and lowercases", () => {
    const out = Hex128Schema.parse("AB" + "0".repeat(126));
    expect(out).toBe("ab" + "0".repeat(126));
  });

  it("rejects a 64-char hex string", () => {
    expect(Hex128Schema.safeParse("a".repeat(64)).success).toBe(false);
  });
});
