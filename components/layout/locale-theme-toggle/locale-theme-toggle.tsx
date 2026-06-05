"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "@/lib/contexts/theme-context";
import { cn } from "@/lib/utils";
import styles from "./locale-theme-toggle.module.scss";

interface LocaleThemeToggleProps {
  className?: string;
}

/** Joined pill: theme button (emoji ☀️/🌙, matching the food emoji) + locale
 *  button (EN/ES). Same segmented-control shape as bitbybit-cursats. */
export function LocaleThemeToggle({ className }: LocaleThemeToggleProps) {
  const tTheme = useTranslations("theme");
  const tNav = useTranslations("nav");
  const { theme, toggleTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  const toggleLocale = () => {
    const next = locale === "es" ? "en" : "es";
    router.replace(pathname, { locale: next });
  };

  return (
    <div className={cn(styles.group, className)}>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleTheme}
        aria-label={mounted && isDark ? tTheme("toLight") : tTheme("toDark")}
        suppressHydrationWarning
      >
        {mounted ? (isDark ? "☀️" : "🌙") : "🌗"}
      </button>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleLocale}
        aria-label={locale === "es" ? tNav("toEnglish") : tNav("toSpanish")}
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
    </div>
  );
}

export default LocaleThemeToggle;
