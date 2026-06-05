import { cn } from "@/lib/utils";
import styles from "./wordmark.module.scss";

export interface WordmarkProps {
  className?: string;
}

// "BitByBit" in the active text color, "RUN" filled with the brand
// orange→green→gold gradient (same hues as <LogoBlocks />). Font-size is
// inherited so each call-site controls its own display scale.
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn(styles.wordmark, className)}>
      <span className={styles.primary}>BitByBit&nbsp;</span>
      <span className={styles.gradient}>RUN</span>
    </span>
  );
}

export default Wordmark;
