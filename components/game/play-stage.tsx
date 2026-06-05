"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GameCanvas } from "./game-canvas";
import { GameControls } from "./game-controls";
import { CharacterSelect } from "./character-select";
import { getCharacter, type CharacterId } from "@/lib/game/characters";
import styles from "./play-stage.module.scss";

/** Two-step play flow: pick a character, then race with it. */
export function PlayStage() {
  const t = useTranslations("play");
  const [selectedId, setSelectedId] = useState<CharacterId>("default");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <CharacterSelect
        value={selectedId}
        onSelect={setSelectedId}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <GameCanvas key={selectedId} character={getCharacter(selectedId)} />
      <GameControls />
      <button
        type="button"
        className={styles.change}
        onClick={() => setStarted(false)}
      >
        ← {t("change")}
      </button>
    </div>
  );
}

export default PlayStage;
