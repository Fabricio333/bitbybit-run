"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/common/logo/logo";
import { LocaleThemeToggle } from "@/components/layout/locale-theme-toggle/locale-theme-toggle";
import { Button } from "@/components/ui/button/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSignerContext } from "@/lib/contexts/signer-context";
import styles from "./navbar.module.scss";

/**
 * Shorten a hex pubkey into a readable label for signed-in users who
 * have no display name yet — e.g. `npub` short form `a1b2…f9e8`.
 */
function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

export function Navbar() {
  const t = useTranslations("nav");
  const { session } = useSignerContext();

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Logo />
        <div className={styles.right}>
          <LocaleThemeToggle />
          {session === null ? (
            <Button href="/sign-in" variant="primary" size="sm">
              {t("login")}
            </Button>
          ) : (
            <div className={styles.account}>
              <span className={styles.accountName}>
                {session.user?.display_name ?? shortPubkey(session.pubkey)}
              </span>
              <SignOutButton label={t("signOut")} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
