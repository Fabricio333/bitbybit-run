import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button/back-button";
import { PlayStage } from "@/components/game/play-stage";
import { SoundToggle } from "@/components/game/sound-toggle";
import styles from "../play/page.module.scss";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "demo" });
  return { title: t("title") };
}

// Free single-player demo: no login required, Sprinter only. Crossing the
// finish line invites the player to sign in to compete for zaps.
export default async function DemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("demo");

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <BackButton />
        <span className={styles.phase}>{t("phase")}</span>
        <SoundToggle />
      </header>
      <div className={styles.stage}>
        <PlayStage demo />
      </div>
    </div>
  );
}
