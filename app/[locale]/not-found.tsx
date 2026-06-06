"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import styles from "./not-found.module.scss";

// Rendered inside the localized layout (via the [...rest] catch-all below),
// so it inherits fonts, navbar, footer and the next-intl provider. Client
// component because not-found.tsx can't read params to set the request locale.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className={styles.page}>
      <p className={styles.code}>{t("code")}</p>
      <span className={styles.runner} aria-hidden="true">
        🏃💨
      </span>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.body}>{t("body")}</p>
      <div className={styles.actions}>
        <Button href="/" size="lg">
          {t("cta")}
        </Button>
      </div>
    </div>
  );
}
