"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import { LocaleThemeToggle } from "@/components/layout/locale-theme-toggle/locale-theme-toggle";
import { CHARACTERS, type CharacterId } from "@/lib/game/characters";
import { cn } from "@/lib/utils";
import styles from "./character-select.module.scss";

interface CharacterSelectProps {
  value: CharacterId;
  onSelect: (id: CharacterId) => void;
  onStart: () => void;
}

export function CharacterSelect({
  value,
  onSelect,
  onStart,
}: CharacterSelectProps) {
  const t = useTranslations("play");
  const tSettings = useTranslations("play.settings");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={styles.select}>
      <div className={styles.topBar}>
        <h2 className={styles.heading}>{t("choose")}</h2>
        <button
          type="button"
          className={styles.settingsButton}
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          ⚙️ {tSettings("button")}
        </button>
      </div>

      {settingsOpen && (
        <div className={styles.settingsPanel} aria-label={tSettings("title")}>
          <div>
            <p className={styles.settingsTitle}>{tSettings("title")}</p>
            <p className={styles.settingsHint}>{tSettings("language")}</p>
          </div>
          <LocaleThemeToggle className={styles.settingsToggle} />
        </div>
      )}

      <div className={styles.cards}>
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(styles.card, value === c.id && styles.active)}
            aria-pressed={value === c.id}
          >
            <span className={styles.sprite}>
              <RunnerSprite character={c} />
            </span>
            <span className={styles.name}>{c.label}</span>
          </button>
        ))}
      </div>

      <Button size="lg" onClick={onStart}>
        {t("start")} ▶
      </Button>
    </div>
  );
}

export default CharacterSelect;
