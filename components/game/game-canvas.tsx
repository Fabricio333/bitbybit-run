"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_CHARACTER, type Character } from "@/lib/game/characters";
import type { RunnerAction } from "@/lib/game/player-state";
import { ArrowIcon } from "@/components/icons/arrow-icon";
import { BadgeIcon, BoltIcon } from "@/components/icons";
import type { RaceNet } from "@/lib/game/race-net";
import { LANES } from "@/lib/game/config";
import styles from "./game-canvas.module.scss";

const SWIPE_THRESHOLD = 32;

function dispatchAction(action: RunnerAction) {
  window.dispatchEvent(
    new CustomEvent<RunnerAction>("bitbybit-run:action", { detail: action })
  );
}

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
  onFinish,
  raceNet,
  laneCount = LANES,
}: {
  character?: Character;
  onFinish?: (result: { time: number; points: number }) => void;
  /** Multiplayer port (from the lobby). Absent → the canvas is single-player. */
  raceNet?: RaceNet;
  /** Demo/local keeps fork 3 lanes; multiplayer can opt into 4 seats. */
  laneCount?: number;
}) {
  const t = useTranslations("game");
  const tControls = useTranslations("play.controls");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  // Keep the latest callback without re-running the game-creation effect.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  // The match is fixed for this canvas's life; read at boot, don't re-create.
  const raceNetRef = useRef(raceNet);
  raceNetRef.current = raceNet;

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
      startLane: character.startLane,
    };

    (async () => {
      const Phaser = await import("phaser");
      const { createGameConfig } = await import("@/lib/game/scenes/race-scene");
      // Wait for web fonts so Phaser's canvas text renders in Nunito, not a
      // fallback that would flash and re-layout.
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled || !containerRef.current) return;
      game = new Phaser.Game(
        createGameConfig(
          containerRef.current,
          strings,
          sprite,
          (result) => onFinishRef.current?.(result),
          raceNetRef.current,
          laneCount
        )
      );
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
      startedRef.current = false;
    };
    // Re-create the game when the locale or chosen character changes.
  }, [locale, t, character, laneCount]);

  return (
    <div
      className={styles.shell}
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start) return;

        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (
          Math.abs(dx) < SWIPE_THRESHOLD &&
          Math.abs(dy) < SWIPE_THRESHOLD
        ) {
          dispatchAction("restart");
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          dispatchAction(dx > 0 ? "right" : "left");
          return;
        }

        dispatchAction(dy > 0 ? "duck" : "jump");
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      <div ref={containerRef} className={styles.canvas} />
      <button
        type="button"
        className={`${styles.touchButton} ${styles.laneButtonLeft}`}
        aria-label={tControls("changeLane")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("left")}
      >
        <ArrowIcon dir="left" />
        <span>{tControls("changeLane")}</span>
      </button>
      <button
        type="button"
        className={`${styles.touchButton} ${styles.laneButtonRight}`}
        aria-label={tControls("changeLane")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("right")}
      >
        <ArrowIcon dir="right" />
        <span>{tControls("changeLane")}</span>
      </button>
      <button
        type="button"
        className={`${styles.touchButton} ${styles.jumpButton}`}
        aria-label={tControls("jump")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("jump")}
      >
        <ArrowIcon dir="up" />
        <span>{tControls("jump")}</span>
      </button>
      <button
        type="button"
        className={`${styles.touchButton} ${styles.duckButton}`}
        aria-label={tControls("duck")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("duck")}
      >
        <ArrowIcon dir="down" />
        <span>{tControls("duck")}</span>
      </button>
      <button
        type="button"
        className={`${styles.touchButton} ${styles.powerButton}`}
        aria-label={tControls("power")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("power")}
      >
        <BadgeIcon size={32} />
        <span>{tControls("power")}</span>
      </button>
      <button
        type="button"
        className={`${styles.touchButton} ${styles.boostButton}`}
        aria-label={tControls("boost")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dispatchAction("boost")}
      >
        <BoltIcon size={34} />
        <span>{tControls("boost")}</span>
      </button>
    </div>
  );
}
