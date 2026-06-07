"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import { CHARACTERS, type CharacterId } from "@/lib/game/characters";
import { cn } from "@/lib/utils";
import styles from "./character-select.module.scss";

/** A player sitting in a lane. The lobby container builds this map from the
 *  live match snapshot (or local state when offline). */
export interface LobbyOccupant {
  name: string;
  avatarUrl?: string | null;
  ready: boolean;
  isCurrentUser?: boolean;
}

interface CharacterSelectProps {
  /** Lane roster keyed by character id — each character owns a lane. */
  occupants: Partial<Record<CharacterId, LobbyOccupant>>;
  /** Filled lanes, for the `x/4` counter. */
  playerCount: number;
  onClaim: (id: CharacterId) => void;
  onToggleReady: (next: boolean) => void;
  onStart: () => void;
  /** Whether the local player is allowed to start the race (host + ready). */
  canStart?: boolean;
}

export function CharacterSelect({
  occupants,
  playerCount,
  onClaim,
  onToggleReady,
  onStart,
  canStart = true,
}: CharacterSelectProps) {
  const t = useTranslations("play");
  const [hoveredId, setHoveredId] = useState<CharacterId | null>(null);

  const me =
    Object.values(occupants).find((o) => o?.isCurrentUser) ?? null;
  const hasClaimed = !!me;
  const ready = me?.ready ?? false;

  return (
    <div className={styles.select}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t("choose")}</h2>
        <span className={styles.counter}>
          {t("lobby.players", { count: playerCount })}
        </span>
      </div>

      <ul className={styles.cards}>
        {CHARACTERS.map((c) => {
          const occupant = occupants[c.id] ?? null;
          const mine = occupant?.isCurrentUser ?? false;
          const taken = !!occupant && !mine;
          const laneNo = c.startLane + 1;
          const facing = hoveredId === c.id || mine ? "back" : "front";

          return (
            <li key={c.id} className={styles.cell}>
              <button
                type="button"
                onClick={() => !taken && onClaim(c.id)}
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
          <Button size="lg" onClick={() => onToggleReady(true)}>
            {t("lobby.ready")}
          </Button>
        ) : (
          <>
            <Button size="lg" onClick={onStart} disabled={!canStart}>
              {t("lobby.startRace")} ▶
            </Button>
            <Button variant="outline" size="lg" onClick={() => onToggleReady(false)}>
              {t("lobby.cancelReady")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default CharacterSelect;
