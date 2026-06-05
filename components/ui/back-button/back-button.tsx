"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeftIcon } from "@/components/icons/arrow-left-icon";
import styles from "./back-button.module.scss";

interface BackButtonProps {
  href?: React.ComponentProps<typeof Link>["href"];
}

/** Round icon-only back button (no label). Links home by default. */
export function BackButton({ href = "/" }: BackButtonProps) {
  const t = useTranslations("nav");
  return (
    <Link href={href} className={styles.back} aria-label={t("back")}>
      <ArrowLeftIcon size={20} />
    </Link>
  );
}

export default BackButton;
