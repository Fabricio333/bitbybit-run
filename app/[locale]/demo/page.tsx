import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PlayStage } from "@/components/game/play-stage";
import { GameRouteShell } from "@/components/game/game-route-shell";

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
  return (
    <GameRouteShell>
      <PlayStage demo />
    </GameRouteShell>
  );
}
