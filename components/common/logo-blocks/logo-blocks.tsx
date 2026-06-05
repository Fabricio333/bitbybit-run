import styles from "./logo-blocks.module.scss";

/** Three vertically-stacked "bit by bit" blocks in the brand palette.
 *  Ported from bitbybit-cursats; reused in the navbar and footer. */
export function LogoBlocks() {
  return (
    <span className={styles.stack} aria-hidden="true">
      <span className={styles.block} />
      <span className={styles.block} />
      <span className={styles.block} />
    </span>
  );
}

export default LogoBlocks;
