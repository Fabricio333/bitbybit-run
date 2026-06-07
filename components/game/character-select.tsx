"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import { CHARACTERS, type Character, type CharacterId } from "@/lib/game/characters";
import { cn } from "@/lib/utils";
import styles from "./character-select.module.scss";

/** A player sitting in a lane. Later this comes from the Nostr lobby sync; for
 *  now the current user is the only real one and `occupants` is mock/empty. */
export interface LobbyOccupant {
  name: string;
  avatarUrl?: string | null;
  ready: boolean;
  isCurrentUser?: boolean;
}

interface CharacterSelectProps {
  value: CharacterId;
  onSelect: (id: CharacterId) => void;
  onStart: () => void;
  /** The signed-in player claiming a lane. */
  currentUser: { name: string; avatarUrl?: string | null };
  /** Lanes already claimed by OTHER players, keyed by character id. Mock for
   *  now — wired to real lobby state in a later session. */
  occupants?: Partial<Record<CharacterId, LobbyOccupant>>;
}

export function CharacterSelect({
  value,
  onSelect,
  onStart,
  currentUser,
  occupants = {},
}: CharacterSelectProps) {
  const t = useTranslations("play");
  const [hoveredId, setHoveredId] = useState<CharacterId | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [ready, setReady] = useState(false);

  // Who, if anyone, occupies a given lane — the current user on their claimed
  // lane, otherwise whichever other player has it (mock for now).
  const occupantFor = (c: Character): LobbyOccupant | null => {
    if (hasClaimed && c.id === value) {
      return {
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        ready,
        isCurrentUser: true,
      };
    }
    return occupants[c.id] ?? null;
  };

  const claimedCount =
    (hasClaimed ? 1 : 0) +
    Object.keys(occupants).filter((id) => !(hasClaimed && id === value)).length;

  const claim = (c: Character, taken: boolean) => {
    if (taken) return; // lane owned by another player
    onSelect(c.id);
    setHasClaimed(true);
    setReady(false);
  };

  return (
    <div className={styles.select}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t("choose")}</h2>
        <span className={styles.counter}>{t("lobby.players", { count: claimedCount })}</span>
      </div>

      <ul className={styles.cards}>
        {CHARACTERS.map((c) => {
          const occupant = occupantFor(c);
          const mine = occupant?.isCurrentUser ?? false;
          const taken = !!occupant && !mine;
          const laneNo = c.startLane + 1;
          const facing = hoveredId === c.id || mine ? "back" : "front";

          return (
            <li key={c.id} className={styles.cell}>
              <button
                type="button"
                onClick={() => claim(c, taken)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() =>
                  setHoveredId((prev) => (prev === c.id ? null : prev))
                }
                disabled={taken}
                aria-pressed={mine}
                aria-label={occupant ? `${c.label} — ${occupant.name}` : c.label}
                className={cn(
                  styles.card,
                  mine && styles.mine,
                  taken && styles.taken,
                  !occupant && styles.free,
                )}
                style={{ "--lane-color": c.laneColor } as CSSProperties}
              >
                <span className={styles.laneBadge}>{laneNo}</span>
                {occupant?.ready && (
                  <span className={styles.readyTick} aria-hidden="true">
                    ✓
                  </span>
                )}

                <span className={styles.sprite}>
                  <RunnerSprite
                    character={c}
                    facing={facing}
                    idle={!occupant && hoveredId !== c.id}
                  />
                </span>

                <span className={styles.label}>
                  {occupant ? (
                    <span key="player" className={styles.playerChip}>
                      {occupant.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary Nostr avatar URLs
                        <img
                          src={occupant.avatarUrl}
                          alt=""
                          className={styles.avatar}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.avatarFallback} aria-hidden="true">
                          {occupant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className={styles.playerName}>{occupant.name}</span>
                      {mine && <span className={styles.youBadge}>{t("lobby.you")}</span>}
                    </span>
                  ) : (
                    <span key="char" className={styles.charBlock}>
                      <span className={styles.charName}>{c.label}</span>
                      <span className={styles.waiting}>{t("lobby.waiting")}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.actions}>
        {!hasClaimed ? (
          <p className={styles.hint}>{t("lobby.claimHint")}</p>
        ) : !ready ? (
          <Button size="lg" onClick={() => setReady(true)}>
            {t("lobby.ready")}
          </Button>
        ) : (
          <>
            <Button size="lg" onClick={onStart}>
              {t("lobby.startRace")} ▶
            </Button>
            <Button variant="outline" size="lg" onClick={() => setReady(false)}>
              {t("lobby.cancelReady")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default CharacterSelect;
