"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeftIcon } from "@/components/icons";
import { SoundToggle } from "@/components/game/sound-toggle";
import styles from "./game-header.module.scss";

interface GameHeaderProps {
  /** Where the back key navigates (home by default). */
  backHref?: React.ComponentProps<typeof Link>["href"];
  phase: string;
}

/** Arcade-style game header: a pixel "back key", the phase label, and the
 *  sound toggle pinned to the right. */
export function GameHeader({ backHref = "/", phase }: GameHeaderProps) {
  const t = useTranslations("nav");
  return (
    <header className={styles.bar}>
      <Link href={backHref} className={styles.backKey} aria-label={t("back")}>
        <ArrowLeftIcon size={18} />
      </Link>
      <span className={styles.phase}>{phase}</span>
      <SoundToggle />
    </header>
  );
}

export default GameHeader;
