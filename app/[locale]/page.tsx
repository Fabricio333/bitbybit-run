import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button/button";
import { RunnerSprite } from "@/components/common/runner-sprite/runner-sprite";
import { CHARACTERS } from "@/lib/game/characters";
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
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.tagline}>{t("tagline")}</p>

      <div className={styles.cast}>
        {CHARACTERS.map((c) => (
          <div key={c.id} className={styles.char}>
            <RunnerSprite character={c} />
            <span className={styles.charName}>{c.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button href="/play" size="lg">
          {t("play")} ▶
        </Button>
        <Button href="/how-to-play" variant="outline" size="lg">
          {t("howToPlay")}
        </Button>
      </div>
    </div>
  );
}
