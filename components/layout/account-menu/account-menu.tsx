"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LogoutIcon } from "@/components/icons";
import { useSignerContext } from "@/lib/contexts/signer-context";
import { useClickOutside } from "@/lib/hooks/useClickOutside";
import styles from "./account-menu.module.scss";

/** `a1b2…f9e8` short form for users with no display name yet. */
function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

/**
 * Signed-in account control: the Nostr avatar (or a runner fallback)
 * that opens a small menu — name + lightning address, "sync profile
 * from Nostr", and sign out. There's no full settings page; syncing
 * pulls the latest kind:0 metadata so the row tracks Nostr.
 */
export function AccountMenu() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { session, signOut, refresh } = useSignerContext();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  if (!session) return null;

  const name = session.user?.display_name ?? shortPubkey(session.pubkey);
  const avatar = session.user?.avatar_url;
  const lud16 = session.user?.lud16;

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetch("/api/auth/sync-profile", { method: "POST" });
      setImgError(false);
      await refresh();
    } catch {
      // Best-effort; the menu stays open so the user can retry.
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account")}
      >
        {avatar && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary Nostr avatar URL; optimizer config not worth it for a 40px icon
          <img
            src={avatar}
            alt=""
            className={styles.avatarImg}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            🏃
          </span>
        )}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.header}>
            <span className={styles.name}>{name}</span>
            {lud16 ? <span className={styles.lud}>⚡ {lud16}</span> : null}
          </div>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? t("syncing") : t("syncProfile")}
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogoutIcon size={16} />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
