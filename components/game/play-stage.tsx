"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GameCanvas } from "./game-canvas";
import { GameControls } from "./game-controls";
import { CharacterSelect } from "./character-select";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button/button";
import { getCharacter, type CharacterId } from "@/lib/game/characters";
import styles from "./play-stage.module.scss";

type FinishResult = { time: number; points: number };

/**
 * Play flow. Normal mode: pick a character, then race. Demo mode: skip the
 * picker (Sprinter only) and, on crossing the finish line, invite the player to
 * sign in to compete for zaps.
 */
export function PlayStage({ demo = false }: { demo?: boolean }) {
  const t = useTranslations("play");
  const tDemo = useTranslations("demo");
  const [selectedId, setSelectedId] = useState<CharacterId>("default");
  const [started, setStarted] = useState(demo);
  const [finish, setFinish] = useState<FinishResult | null>(null);

  if (demo) {
    return (
      <div className={styles.wrap}>
        <GameCanvas
          character={getCharacter("default")}
          onFinish={setFinish}
        />
        <GameControls />

        {finish && (
          <Modal
            onClose={() => setFinish(null)}
            title={tDemo("finishTitle")}
            ariaLabel={tDemo("finishTitle")}
            size="sm"
          >
            <div className={styles.invite}>
              <p className={styles.inviteStats}>
                {finish.time.toFixed(1)}s · {finish.points} pts
              </p>
              <p className={styles.inviteText}>{tDemo("finishText")}</p>
              <div className={styles.inviteActions}>
                <Button
                  href={{ pathname: "/sign-in", query: { next: "/play" } }}
                  size="lg"
                >
                  {tDemo("login")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setFinish(null)}
                >
                  {tDemo("keepPlaying")}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

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
