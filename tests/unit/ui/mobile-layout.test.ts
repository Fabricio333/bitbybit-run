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

  it("keeps fullscreen/no-scroll game layout scoped to mobile", () => {
    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("touch-action: manipulation");
    expect(canvasStyles).toContain("@media (max-width: 760px)");
    expect(canvasStyles).toContain("height: 100dvh");

    const pageStyles = read("app/[locale]/play/page.module.scss");
    expect(pageStyles).toContain("overflow-y: auto");
  });

  it("hides desktop keyboard legend on mobile so it does not waste screen space", () => {
    const controlsStyles = read("components/game/game-controls.module.scss");
    expect(controlsStyles).toContain("@media (max-width: 760px)");
    expect(controlsStyles).toContain("display: none");
  });

  it("uses one shared responsive game route shell for demo and play", () => {
    const shell = read("components/game/game-route-shell.tsx");
    const shellStyles = read("components/game/game-route-shell.module.scss");
    expect(shell).toContain("children: React.ReactNode");
    expect(shell).toContain("styles.page");
    expect(shell).toContain("styles.stage");
    expect(shellStyles).toContain("overflow-y: auto");
    expect(shellStyles).toContain("@media (max-width: 760px)");
    expect(shellStyles).toContain("height: 100dvh");
    expect(shellStyles).toContain("overflow: hidden");

    const play = read("app/[locale]/play/page.tsx");
    const demo = read("app/[locale]/demo/page.tsx");
    expect(play).toContain("<GameRouteShell>");
    expect(demo).toContain("<GameRouteShell>");
  });

  it("uses swipe movement plus only boost and power touch buttons on mobile", () => {
    const canvas = read("components/game/game-canvas.tsx");
    expect(canvas).toContain('dispatchAction(dx > 0 ? "right" : "left")');
    expect(canvas).toContain('dispatchAction(dy > 0 ? "duck" : "jump")');
    expect(canvas).toContain('dispatchAction("boost")');
    expect(canvas).toContain('dispatchAction("power")');
    expect(canvas).toContain("styles.boostButton");
    expect(canvas).toContain("styles.powerButton");
    expect(canvas).toContain("styles.laneButtonLeft");
    expect(canvas).toContain("styles.laneButtonRight");
    expect(canvas).toContain("styles.jumpButton");
    expect(canvas).toContain("styles.duckButton");

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain(".touchButton");
    expect(canvasStyles).toContain("width: clamp(68px, 17vw, 92px)");
    expect(canvasStyles).toContain("height: clamp(68px, 17vw, 92px)");
    expect(canvasStyles).toContain("font-size: clamp(1.6rem, 5vw, 2.2rem)");
    expect(canvasStyles).toContain(".boostButton");
    expect(canvasStyles).toContain(".powerButton");
    expect(canvasStyles).toContain(".laneButtonLeft,");
    expect(canvasStyles).toContain(".laneButtonRight,");
    expect(canvasStyles).toContain(".jumpButton,");
    expect(canvasStyles).toContain(".duckButton");
    expect(canvasStyles).toContain("display: none");
    expect(canvasStyles).toContain("bottom: max(76px, calc(env(safe-area-inset-bottom) + 52px))");
  });

  it("hides site chrome and in-page game headers only on mobile game routes", () => {
    const siteNavbar = read("components/layout/navbar/site-navbar.tsx");
    expect(siteNavbar).toContain('pathname.startsWith("/play")');
    expect(siteNavbar).toContain('pathname.startsWith("/demo")');
    expect(siteNavbar).toContain("gameRouteChrome");

    const layout = read("app/[locale]/layout.tsx");
    expect(layout).toContain("<SiteNavbar />");

    const siteFooter = read("components/layout/footer/site-footer.tsx");
    expect(siteFooter).toContain('pathname.startsWith("/play")');
    expect(siteFooter).toContain('pathname.startsWith("/demo")');
    expect(siteFooter).toContain("gameRouteChrome");

    const play = read("app/[locale]/play/page.tsx");
    const demo = read("app/[locale]/demo/page.tsx");
    expect(play).toContain("GameHeader");
    expect(demo).toContain("GameHeader");
    expect(play).toContain("styles.mobileHidden");
    expect(demo).toContain("styles.mobileHidden");
  });

  it("keeps original desktop camera and applies zoomed mobile camera only on phones", () => {
    const scene = read("lib/game/scenes/race-scene.ts");
    expect(scene).toContain("const DESKTOP_NEAR = 230");
    expect(scene).toContain("const MOBILE_NEAR = 620");
    expect(scene).toContain("isMobileGameViewport");
    expect(scene).toContain("this.near = isMobileGameViewport ? MOBILE_NEAR : DESKTOP_NEAR");
    expect(scene).toContain("height * 1.08");
    expect(scene).toContain("height * 0.32");
    expect(scene).toContain("width * 0.118");
    expect(scene).toContain("height * 0.12");
    expect(scene).toContain("width * 0.24");
  });

  it("keeps the runner visible when the zoomed track projects below the viewport", () => {
    const scene = read("lib/game/scenes/race-scene.ts");
    expect(scene).toContain("const runnerBaseY = Math.min(me.y, this.scale.height - 18)");
    expect(scene).toContain("const spriteBaseY = Math.min(");
    expect(scene).toContain("this.scale.height - 18");
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
    expect(sw).toContain("bitbybit-run-pwa-v4");
    expect(sw).toContain('url.pathname.startsWith("/_next/")');
    expect(sw).toContain('request.mode === "navigate"');
    expect(sw).toContain('request.headers.get("accept")');
    expect(sw).not.toContain('"/demo",');
  });
});
