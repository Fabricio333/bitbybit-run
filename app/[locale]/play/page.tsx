import { setRequestLocale, getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button/back-button";
import { PlayStage } from "@/components/game/play-stage";
import { SoundToggle } from "@/components/game/sound-toggle";
import styles from "./page.module.scss";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PlayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("play");

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <BackButton />
        <span className={styles.phase}>{t("phase")}</span>
        <SoundToggle />
      </header>
      <div className={styles.stage}>
        <PlayStage />
      </div>
    </div>
  );
}
