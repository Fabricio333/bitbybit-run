"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/common/logo/logo";
import { LocaleThemeToggle } from "@/components/layout/locale-theme-toggle/locale-theme-toggle";
import { Button } from "@/components/ui/button/button";
import styles from "./navbar.module.scss";

export function Navbar() {
  const t = useTranslations("nav");

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Logo />
        <div className={styles.right}>
          <LocaleThemeToggle />
          {/* TODO(Phase 2): wire to Nostr login (NIP-07). */}
          <Button variant="primary" size="sm">
            {t("login")}
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
