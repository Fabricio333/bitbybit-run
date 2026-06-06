"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CloseIcon } from "@/components/icons";
import { FAKE_ADS, type FakeAd } from "@/lib/fake-ads/ads";
import { cn } from "@/lib/utils";
import styles from "./fake-ads.module.scss";

const STORAGE_KEY = "fake-ads-closed";
const PER_SIDE = 2;
// Close → respawn choreography. Keep these in sync with the slide-out /
// slide-in durations in the stylesheet so the timing lines up.
const OUT_MS = 300;
const RESPAWN_DELAY = 650;

type AdState = {
  left: FakeAd[];
  right: FakeAd[];
  /** How many distinct ads the user has dismissed this session. */
  closedCount: number;
};

function loadClosed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveClosed(closed: Set<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...closed]));
  } catch {
    // sessionStorage can be unavailable (privacy mode) — degrade silently.
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Top up any column with an empty slot from the still-unseen pool. */
function refill(prev: AdState, closed: Set<string>): AdState {
  const onScreen = new Set([...prev.left, ...prev.right].map((ad) => ad.id));
  const pool = shuffle(
    FAKE_ADS.filter((ad) => !closed.has(ad.id) && !onScreen.has(ad.id))
  );
  let i = 0;
  const fill = (column: FakeAd[]): FakeAd[] => {
    const next = [...column];
    while (next.length < PER_SIDE && i < pool.length) next.push(pool[i++]);
    return next;
  };
  return {
    left: fill(prev.left),
    right: fill(prev.right),
    closedCount: closed.size,
  };
}

/**
 * Fake "spam" ads pinned to the desktop margins. Rendered once from the shared
 * layout so it shows on every page. Client-only: it picks a random set after
 * mount (no SSR markup) to keep the choice fresh per visit and avoid hydration
 * mismatches. Closing an ad plays a slide-out, then — after a beat — a fresh ad
 * from the pool slides into the empty slot. The spam never truly dies, until the
 * whole pool is dismissed, which earns a small reward.
 */
export function FakeAds() {
  const t = useTranslations("fakeAds");
  const [state, setState] = useState<AdState | null>(null);
  const [leaving, setLeaving] = useState<Set<string>>(() => new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const closed = loadClosed();
    const available = shuffle(FAKE_ADS.filter((ad) => !closed.has(ad.id)));
    setState({
      left: available.slice(0, PER_SIDE),
      right: available.slice(PER_SIDE, PER_SIDE * 2),
      closedCount: closed.size,
    });
  }, []);

  // Clear any pending respawn timers on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const handleClose = useCallback((id: string) => {
    // 1. Persist the dismissal and kick off the slide-out animation.
    const closed = loadClosed();
    closed.add(id);
    saveClosed(closed);
    setLeaving((prev) => new Set(prev).add(id));

    // 2. Once it has slid out, drop it from its column.
    timers.current.push(
      setTimeout(() => {
        setState((prev) =>
          prev
            ? {
                left: prev.left.filter((ad) => ad.id !== id),
                right: prev.right.filter((ad) => ad.id !== id),
                // Re-read fresh so concurrent dismissals don't undercount.
                closedCount: loadClosed().size,
              }
            : prev
        );
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, OUT_MS)
    );

    // 3. After a beat, slide a fresh ad into the freed slot.
    timers.current.push(
      setTimeout(() => {
        setState((prev) => (prev ? refill(prev, loadClosed()) : prev));
      }, OUT_MS + RESPAWN_DELAY)
    );
  }, []);

  // Nothing until mounted.
  if (!state) return null;

  const allClosed =
    state.left.length === 0 &&
    state.right.length === 0 &&
    state.closedCount >= FAKE_ADS.length;

  const renderColumn = (ads: FakeAd[], side: "left" | "right") => (
    <aside
      className={cn(styles.column, styles[side])}
      aria-label={t(side === "left" ? "regionLabelLeft" : "regionLabelRight")}
    >
      {ads.map((ad) => (
        <article
          key={ad.id}
          className={cn(
            styles.ad,
            styles[ad.variant],
            leaving.has(ad.id) && styles.leaving
          )}
        >
          <span className={styles.badge}>{t("badgeAd")}</span>
          <span className={styles.sticker} aria-hidden="true">
            {ad.sticker}
          </span>
          <button
            type="button"
            className={styles.close}
            onClick={() => handleClose(ad.id)}
            aria-label={t("close")}
          >
            <CloseIcon size={14} />
          </button>
          <Link
            href={`/gotcha/${ad.id}`}
            className={styles.link}
            aria-label={t(`ads.${ad.id}.title`)}
          >
            <span className={styles.emoji} aria-hidden="true">
              {ad.emoji}
            </span>
            <span className={styles.title}>{t(`ads.${ad.id}.title`)}</span>
            <span className={styles.cta}>{t(`ads.${ad.id}.cta`)}</span>
          </Link>
        </article>
      ))}

      {allClosed && side === "right" && (
        <div className={styles.reward} role="status">
          <span className={styles.rewardEmoji} aria-hidden="true">
            🧹
          </span>
          <strong className={styles.rewardTitle}>{t("allClosedTitle")}</strong>
          <span className={styles.rewardBody}>{t("allClosedBody")}</span>
        </div>
      )}
    </aside>
  );

  // On small screens the side rails have no room, so a single ad floats fixed to
  // the bottom of the viewport instead (the classic mobile-web sticky banner).
  // It draws from the same pool — CSS keeps it and the columns mutually exclusive.
  const bannerAd = state.left[0] ?? state.right[0] ?? null;

  const renderBanner = (ad: FakeAd) => (
    <aside
      className={cn(
        styles.banner,
        styles[ad.variant],
        leaving.has(ad.id) && styles.leaving
      )}
      aria-label={t("regionLabelLeft")}
    >
      <span className={styles.badge}>{t("badgeAd")}</span>
      <span className={styles.sticker} aria-hidden="true">
        {ad.sticker}
      </span>
      <button
        type="button"
        className={styles.close}
        onClick={() => handleClose(ad.id)}
        aria-label={t("close")}
      >
        <CloseIcon size={14} />
      </button>
      <Link
        href={`/gotcha/${ad.id}`}
        className={styles.bannerLink}
        aria-label={t(`ads.${ad.id}.title`)}
      >
        <span className={styles.emoji} aria-hidden="true">
          {ad.emoji}
        </span>
        <span className={styles.bannerCopy}>
          <span className={styles.title}>{t(`ads.${ad.id}.title`)}</span>
          <span className={styles.cta}>{t(`ads.${ad.id}.cta`)}</span>
        </span>
      </Link>
    </aside>
  );

  return (
    <>
      {renderColumn(state.left, "left")}
      {renderColumn(state.right, "right")}
      {bannerAd && renderBanner(bannerAd)}
    </>
  );
}

export default FakeAds;
