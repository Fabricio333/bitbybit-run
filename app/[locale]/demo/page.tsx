import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { GameHeader } from "@/components/game/game-header/game-header";
import { PlayStage } from "@/components/game/play-stage";
import { GameRouteShell } from "@/components/game/game-route-shell";
import styles from "@/components/game/game-route-shell.module.scss";

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
    <GameRouteShell>
      <div className={styles.mobileHidden}>
        <GameHeader backHref="/how-to-play" phase={t("phase")} />
      </div>
      <PlayStage demo />
    </GameRouteShell>
  );
}
