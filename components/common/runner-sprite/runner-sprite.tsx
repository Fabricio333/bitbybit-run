import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_CHARACTER, type Character } from "@/lib/game/characters";
import styles from "./runner-sprite.module.scss";

/** Front-facing (south) runner, animated purely with CSS (steps(8)) — no JS, no
 *  canvas. The character's sheet + frame size feed in via CSS variables. */
export function RunnerSprite({
  character = DEFAULT_CHARACTER,
  className,
}: {
  character?: Character;
  className?: string;
}) {
  const sheetWidth = character.frameWidth * character.frames;
  const style = {
    "--rs-sheet": `url("${character.southSheet}")`,
    "--rs-frame": `${character.frameWidth}px`,
    "--rs-sheet-width": `${sheetWidth}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(styles.runner, className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export default RunnerSprite;
