"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "./hero-title.module.scss";

/** Landing hero title — same wordmark treatment as the navbar (gradient "RUN")
 *  but with the Bitcoin "₿" standing in for each capital B of "BitByBit", plus a
 *  spring "pop" entrance and a slow idle wobble. */
export function HeroTitle({ label }: { label: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.h1
      className={styles.title}
      aria-label={label}
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
    >
      <motion.span
        className={styles.inner}
        animate={reduce ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className={styles.primary}>₿it₿y₿it&nbsp;</span>
        <span className={styles.gradient}>RUN</span>
      </motion.span>
    </motion.h1>
  );
}

export default HeroTitle;
