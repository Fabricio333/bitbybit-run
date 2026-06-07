import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { GameHeader } from "@/components/game/game-header/game-header";
import { PlayStage } from "@/components/game/play-stage";
import { GameRouteShell } from "@/components/game/game-route-shell";
import styles from "@/components/game/game-route-shell.module.scss";

type Props = {
  params: Promise<{ locale: string }>;
};

// The competitive game requires an identity — send anonymous visitors to sign in
// (they can still try the free /demo). Returns to /play after login.
export default async function PlayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: { pathname: "/sign-in", query: { next: "/play" } }, locale });
  }

  const t = await getTranslations("play");

  return (
    <GameRouteShell>
      <div className={styles.mobileHidden}>
        <GameHeader phase={t("phase")} />
      </div>
      <PlayStage />
    </GameRouteShell>
  );
}
