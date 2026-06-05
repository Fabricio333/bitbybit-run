import { Link } from "@/i18n/routing";
import { LogoBlocks } from "@/components/common/logo-blocks/logo-blocks";
import { Wordmark } from "@/components/common/wordmark/wordmark";
import styles from "./logo.module.scss";

/** Navbar brand: blocks + wordmark, links home. */
export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="BitByBit RUN">
      <LogoBlocks />
      <Wordmark className={styles.wordmark} />
    </Link>
  );
}

export default Logo;
