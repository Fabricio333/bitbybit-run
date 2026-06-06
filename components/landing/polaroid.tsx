"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import type { Character } from "@/lib/game/characters";
import styles from "./polaroid.module.scss";

/** A runner shown inside a tilted polaroid frame. Springs in with a staggered
 *  delay, floats gently while idle, and straightens + lifts on hover. */
export function Polaroid({
  character,
  index = 0,
}: {
  character: Character;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const tilt = index % 2 === 0 ? -4 : 4;

  return (
    <motion.div
      className={styles.polaroid}
      initial={reduce ? false : { opacity: 0, y: 32, rotate: 0, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 18,
        delay: 0.2 + index * 0.12,
      }}
      whileHover={
        reduce
          ? undefined
          : {
              rotate: 0,
              y: -8,
              scale: 1.05,
              transition: { type: "spring", stiffness: 300, damping: 15 },
            }
      }
    >
      <motion.div
        className={styles.frame}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{
          duration: 3 + index * 0.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className={styles.photo}>
          <RunnerSprite character={character} className={styles.sprite} />
        </div>
        <span className={styles.caption}>{character.label}</span>
      </motion.div>
    </motion.div>
  );
}

export default Polaroid;
