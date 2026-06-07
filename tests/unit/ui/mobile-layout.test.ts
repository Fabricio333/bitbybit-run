// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("mobile game UI layout", () => {
  it("uses a portrait vertical game viewport", () => {
    const config = read("lib/game/config.ts");
    expect(config).toContain("width: 540");
    expect(config).toContain("height: 960");

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("aspect-ratio: 9 / 16");
    expect(canvasStyles).toContain("max-height: min(78svh, 960px)");
  });

  it("keeps mobile page scrolling available while the game handles horizontal swipes", () => {
    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("touch-action: pan-y");

    const pageStyles = read("app/[locale]/play/page.module.scss");
    expect(pageStyles).toContain("overflow-y: auto");
    expect(pageStyles).toContain("align-items: flex-start");
  });

  it("renders transparent bubble action buttons over the game instead of blocky panels", () => {
    const canvas = read("components/game/game-canvas.tsx");
    for (const action of ["left", "right", "jump", "duck", "power", "boost"]) {
      expect(canvas).toContain(`dispatchAction(\"${action}\")`);
    }

    const canvasStyles = read("components/game/game-canvas.module.scss");
    expect(canvasStyles).toContain("border-radius: 999px");
    expect(canvasStyles).toContain("backdrop-filter: blur(10px)");
    expect(canvasStyles).toContain("background: rgba");
  });

  it("shows a pre-match settings panel with language controls before starting", () => {
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
});
