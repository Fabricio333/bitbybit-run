import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button/button";
import styles from "./page.module.scss";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howToPlay" });
  return { title: t("title") };
}

export default async function HowToPlayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("howToPlay");

  const cards = [
    { title: t("goalTitle"), text: t("goalText") },
    { title: t("energyTitle"), text: t("energyText") },
    { title: t("poisonTitle"), text: t("poisonText") },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>

      <div className={styles.grid}>
        {cards.map((card) => (
          <article key={card.title} className={styles.card}>
            <h2 className={styles.cardTitle}>{card.title}</h2>
            <p className={styles.cardText}>{card.text}</p>
          </article>
        ))}

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{t("controlsTitle")}</h2>
          <ul className={styles.controls}>
            <li>{t("controlsLanes")}</li>
            <li>{t("controlsSprint")}</li>
            <li>{t("controlsBrake")}</li>
            <li>{t("controlsRestart")}</li>
          </ul>
        </article>
      </div>

      <div className={styles.cta}>
        <Button href="/play" size="lg">
          {t("cta")}
        </Button>
      </div>
    </div>
  );
}
