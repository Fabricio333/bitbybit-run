import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { getUserByPubkey } from "@/lib/creator/users";
import { GameHeader } from "@/components/game/game-header/game-header";
import { PlayStage } from "@/components/game/play-stage";
import styles from "./page.module.scss";

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
    return null;
  }

  const t = await getTranslations("play");

  const user = await getUserByPubkey(session.pubkey);
  const currentUser = {
    name: user?.display_name ?? "Player",
    avatarUrl: user?.avatar_url ?? null,
  };

  return (
    <div className={styles.page}>
      <GameHeader phase={t("phase")} />
      <div className={styles.stage}>
        <PlayStage currentUser={currentUser} />
      </div>
    </div>
  );
}
