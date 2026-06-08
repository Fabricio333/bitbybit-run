import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_CHARACTER, type Character } from "@/lib/game/characters";
import styles from "./runner-sprite.module.scss";

/** Which way the runner faces. `front` (south) is the default UI view; `back`
 *  (north) is the in-game view — used in the lobby to preview a runner lined up
 *  at the starting blocks, ready to take off. */
export type RunnerFacing = "front" | "back";

/** Front- or back-facing runner, animated purely with CSS (steps(8)) — no JS, no
 *  canvas. The character's sheet + frame size feed in via CSS variables. Pass
 *  `idle` to freeze on the first frame (e.g. an unclaimed lobby lane). */
export function RunnerSprite({
  character = DEFAULT_CHARACTER,
  facing = "front",
  idle = false,
  className,
}: {
  character?: Character;
  facing?: RunnerFacing;
  idle?: boolean;
  className?: string;
}) {
  const sheet = facing === "back" ? character.sheet : character.southSheet;
  const sheetWidth = character.frameWidth * character.frames;
  const style = {
    "--rs-sheet": `url("${sheet}")`,
    "--rs-frame": `${character.frameWidth}px`,
    "--rs-sheet-width": `${sheetWidth}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(styles.runner, idle && styles.idle, className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export default RunnerSprite;
