// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("mobile game UI layout", () => {
  it("uses a portrait vertical game viewport that fits a phone screen", () => {
    const config = read("lib/game/config.ts");
    expect(config).toContain("width: 540");
    expect(config).toContain("height: 960");

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("aspect-ratio: 9 / 16");
    expect(canvasStyles).toContain("height: min(100dvh");
  });

  it("keeps mobile page scrolling available while the game handles swipes", () => {
    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("touch-action: manipulation");

    const pageStyles = read("app/[locale]/play/page.module.scss");
    expect(pageStyles).toContain("overflow-y: auto");
    expect(pageStyles).toContain("padding: 0");
  });

  it("hides desktop keyboard legend on mobile so it does not waste screen space", () => {
    const controlsStyles = read("components/game/game-controls.module.scss");
    expect(controlsStyles).toContain("@media (max-width: 760px)");
    expect(controlsStyles).toContain("display: none");
  });

  it("renders compact transparent bubble controls over the game instead of blocky panels", () => {
    const canvas = read("components/game/game-canvas.tsx");
    for (const action of ["left", "right", "jump", "duck", "power", "boost"]) {
      expect(canvas).toContain(`dispatchAction(\"${action}\")`);
    }

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("border-radius: 999px");
    expect(canvasStyles).toContain("backdrop-filter: blur(10px)");
    expect(canvasStyles).toContain("background: rgba");
    expect(canvasStyles).toContain("width: clamp(42px");
  });

  it("shows compact pre-match settings with language controls before starting", () => {
    const select = read("components/game/character-select.tsx");
    expect(select).toContain("LocaleThemeToggle");
    expect(select).toContain("settingsOpen");
    expect(select).toContain("play.settings");

    const en = read("messages/en.json");
    const es = read("messages/es.json");
    expect(en).toContain('"settings"');
    expect(en).toContain('"language"');
    expect(es).toContain('"settings"');
    expect(es).toContain('"language"');
  });

  it("does not show global sticky ad banners on game routes", () => {
    const siteAds = read("components/layout/fake-ads/site-fake-ads.tsx");
    expect(siteAds).toContain('pathname.startsWith("/play")');
    expect(siteAds).toContain('pathname.startsWith("/demo")');

    const layout = read("app/[locale]/layout.tsx");
    expect(layout).toContain("<SiteFakeAds />");
  });

  it("does not let the PWA service worker pin stale Next.js CSS/JS assets", () => {
    const sw = read("public/sw.js");
    expect(sw).toContain("bitbybit-run-pwa-v3");
    expect(sw).toContain('url.pathname.startsWith("/_next/")');
  });
});
