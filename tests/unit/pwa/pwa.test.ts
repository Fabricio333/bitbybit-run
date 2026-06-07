// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA assets", () => {
  it("ships an installable mobile manifest", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "public/manifest.webmanifest"), "utf8")
    ) as {
      name: string;
      display: string;
      start_url: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };

    expect(manifest.name).toBe("Bit by Bit Run");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/demo");
    expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
  });

  it("does not cache auth, session, or API requests in the service worker", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

    expect(sw).toContain("shouldBypassCache");
    expect(sw).toContain("/api/");
    expect(sw).toContain("/api/auth/");
    expect(sw).toContain("/sign-in");
    expect(sw).toContain("event.respondWith(fetch(request))");
  });
});
