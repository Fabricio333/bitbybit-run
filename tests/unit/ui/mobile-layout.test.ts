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
    expect(canvasStyles).toContain("height: 100%");
  });

  it("locks game routes to a no-scroll fullscreen canvas", () => {
    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("touch-action: manipulation");

    const pageStyles = read("app/[locale]/play/page.module.scss");
    expect(pageStyles).toContain("height: 100dvh");
    expect(pageStyles).toContain("overflow: hidden");
    expect(pageStyles).toContain("padding: 0");
  });

  it("hides desktop keyboard legend on mobile so it does not waste screen space", () => {
    const controlsStyles = read("components/game/game-controls.module.scss");
    expect(controlsStyles).toContain("@media (max-width: 760px)");
    expect(controlsStyles).toContain("display: none");
  });

  it("uses swipe-only mobile input with no visible touch buttons over the track", () => {
    const canvas = read("components/game/game-canvas.tsx");
    expect(canvas).toContain('dispatchAction(dx > 0 ? "right" : "left")');
    expect(canvas).toContain('dispatchAction(dy > 0 ? "duck" : "jump")');
    expect(canvas).not.toContain("styles.touchButton");
    expect(canvas).not.toContain("<button");

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).not.toContain(".touchButton");
  });

  it("hides site chrome and in-page game headers on game routes", () => {
    const siteNavbar = read("components/layout/navbar/site-navbar.tsx");
    expect(siteNavbar).toContain('pathname.startsWith("/play")');
    expect(siteNavbar).toContain('pathname.startsWith("/demo")');

    const layout = read("app/[locale]/layout.tsx");
    expect(layout).toContain("<SiteNavbar />");

    const siteFooter = read("components/layout/footer/site-footer.tsx");
    expect(siteFooter).toContain('pathname.startsWith("/play")');
    expect(siteFooter).toContain('pathname.startsWith("/demo")');

    const play = read("app/[locale]/play/page.tsx");
    const demo = read("app/[locale]/demo/page.tsx");
    expect(play).not.toContain("GameHeader");
    expect(demo).not.toContain("GameHeader");
  });

  it("renders the track closer to the runner", () => {
    const scene = read("lib/game/scenes/race-scene.ts");
    expect(scene).toContain("const NEAR = 320");
    expect(scene).toContain("this.horizonY = height * 0.24");
    expect(scene).toContain("this.laneSpacing = width * 0.16");
  });

  it("does not ask mobile players for the R key after finishing", () => {
    const en = read("messages/en.json");
    const es = read("messages/es.json");
    expect(en).not.toContain("press R");
    expect(es).not.toContain("apretá R");

    const scene = read("lib/game/scenes/race-scene.ts");
    const canvas = read("components/game/game-canvas.tsx");
    expect(scene).toContain('if (this.finished) this.resetRace();');
    expect(scene).toContain('again: "tap to race again"');
    expect(canvas).toContain('dispatchAction("restart")');
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
