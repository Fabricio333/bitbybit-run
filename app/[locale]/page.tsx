import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import styles from "./page.module.scss";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  return (
    <div className={styles.hero}>
      <RunnerSprite className={styles.heroRunner} />
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.subtitle}>{t("subtitle")}</p>
      <div className={styles.actions}>
        <Button href="/play" size="lg">
          {t("play")} ▶
        </Button>
        <Button href="/how-to-play" variant="ghost" size="lg">
          {t("howToPlay")}
        </Button>
      </div>
    </div>
  );
}
