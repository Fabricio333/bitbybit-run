"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { initMutedFromStorage, isMuted, setMuted } from "@/lib/game/sound";
import styles from "./sound-toggle.module.scss";

export function SoundToggle() {
  const t = useTranslations("play");
  const [mounted, setMounted] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    initMutedFromStorage();
    setMutedState(isMuted());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const label = muted ? t("soundOn") : t("soundOff");

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {mounted ? (muted ? "🔇" : "🔊") : "🔊"}
    </button>
  );
}

export default SoundToggle;
