"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import { LocaleThemeToggle } from "@/components/layout/locale-theme-toggle/locale-theme-toggle";
import { CHARACTERS, type CharacterId } from "@/lib/game/characters";
import { cn } from "@/lib/utils";
import styles from "./character-select.module.scss";

/** A player sitting in a lane. The lobby container builds this map from the
 *  live match snapshot (or local state when offline). */
export interface LobbyOccupant {
  name: string;
  avatarUrl?: string | null;
  isCurrentUser?: boolean;
}

interface CharacterSelectProps {
  /** Lane roster keyed by character id — each character owns a lane. */
  occupants: Partial<Record<CharacterId, LobbyOccupant>>;
  /** Filled lanes, for the `x/4` counter. */
  playerCount: number;
  onClaim: (id: CharacterId) => void;
  /** Host only — publish the match (reveals the invite link + Start button). */
  onCreate?: () => void;
  /** Begin the race (host once created, or the local single-player fallback). */
  onStart: () => void;
  /** Leave the lobby, back to the races browser. Absent in the local fallback. */
  onBack?: () => void;
  /** Whether the local player is allowed to start the race. */
  canStart?: boolean;
  /** Host only — when false, a joiner waits for the host instead of starting. */
  isHost?: boolean;
  /** Host only — the match has been created (link shareable, Start available). */
  created?: boolean;
  /** Host only — a shareable link that drops others into this match. Shown
   *  once the match is created. */
  inviteUrl?: string;
  /** Transient banner (e.g. "that runner was already taken"). */
  notice?: string;
}

export function CharacterSelect({
  occupants,
  playerCount,
  onClaim,
  onCreate,
  onStart,
  onBack,
  canStart = true,
  isHost = true,
  created = false,
  inviteUrl,
  notice,
}: CharacterSelectProps) {
  const t = useTranslations("play");
  const [hoveredId, setHoveredId] = useState<CharacterId | null>(null);
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl).then(
      () => setCopied(true),
      () => {}
    );
  };

  const me = Object.values(occupants).find((o) => o?.isCurrentUser) ?? null;
  const hasClaimed = !!me;

  return (
    <div className={styles.select}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t("choose")}</h2>
        <span className={styles.counter}>
          {t("lobby.players", { count: playerCount })}
        </span>
      </div>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {inviteUrl && (
        <button
          type="button"
          className={styles.invite}
          onClick={copyInvite}
          aria-label={t("lobby.invite")}
        >
          <span className={styles.inviteLabel}>{t("lobby.invite")}</span>
          <span className={styles.inviteAction}>
            {copied ? t("lobby.copied") : t("lobby.copy")}
          </span>
        </button>
      )}

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
                aria-label={
                  occupant ? `${c.label} — ${occupant.name}` : c.label
                }
                className={cn(
                  styles.card,
                  mine && styles.mine,
                  taken && styles.taken,
                  !occupant && styles.free
                )}
                style={{ "--lane-color": c.laneColor } as CSSProperties}
              >
                <span className={styles.laneBadge}>{laneNo}</span>

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
                        <span
                          className={styles.avatarFallback}
                          aria-hidden="true"
                        >
                          {occupant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className={styles.playerName}>{occupant.name}</span>
                      {mine && (
                        <span className={styles.youBadge}>
                          {t("lobby.you")}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span key="char" className={styles.charBlock}>
                      <span className={styles.charName}>{c.label}</span>
                      <span className={styles.waiting}>
                        {t("lobby.waiting")}
                      </span>
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
        ) : (
          <>
            {onBack && (
              <Button variant="outline" size="lg" onClick={onBack}>
                {t("lobby.back")}
              </Button>
            )}
            {isHost ? (
              !created ? (
                <Button size="lg" onClick={onCreate}>
                  {t("lobby.createRace")}
                </Button>
              ) : (
                <Button size="lg" onClick={onStart} disabled={!canStart}>
                  {t("lobby.startRace")} ▶
                </Button>
              )
            ) : (
              <p className={styles.hint}>{t("lobby.waitingHost")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CharacterSelect;
