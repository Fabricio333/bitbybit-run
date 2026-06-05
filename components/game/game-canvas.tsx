"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_CHARACTER, type Character } from "@/lib/game/characters";
import styles from "./game-canvas.module.scss";

/**
 * Mounts the Phaser game into a div, client-side only.
 *
 * Phaser touches `window`/`document` at import time, so we import it (and the
 * scene) lazily inside useEffect — it never runs during SSR. That also means
 * the play page can stay a normal Server Component.
 *
 * Localized in-game strings are read here (React has the i18n context) and
 * handed to the scene, so the canvas text follows the current locale.
 */
export function GameCanvas({
  character = DEFAULT_CHARACTER,
}: {
  character?: Character;
}) {
  const t = useTranslations("game");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invoke in dev.
    if (startedRef.current) return;
    startedRef.current = true;

    let game: import("phaser").Game | undefined;
    let cancelled = false;

    const strings = {
      go: t("go"),
      finish: t("finish"),
      again: t("again"),
      goodPhrases: t.raw("goodPhrases") as string[],
      badPhrases: t.raw("badPhrases") as string[],
      bathrooms: t.raw("bathrooms") as string[],
      signs: t.raw("signs") as string[],
    };

    const sprite = {
      sheet: character.sheet,
      frameWidth: character.frameWidth,
      frameHeight: character.frameHeight,
    };

    (async () => {
      const Phaser = await import("phaser");
      const { createGameConfig } = await import("@/lib/game/scenes/race-scene");
      // Wait for web fonts so Phaser's canvas text renders in Nunito, not a
      // fallback that would flash and re-layout.
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled || !containerRef.current) return;
      game = new Phaser.Game(
        createGameConfig(containerRef.current, strings, sprite)
      );
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
      startedRef.current = false;
    };
    // Re-create the game when the locale or chosen character changes.
  }, [locale, t, character]);

  return <div ref={containerRef} className={styles.canvas} />;
}
