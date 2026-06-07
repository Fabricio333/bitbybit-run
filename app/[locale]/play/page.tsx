import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { PlayStage } from "@/components/game/play-stage";
import { GameRouteShell } from "@/components/game/game-route-shell";

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

  return (
    <GameRouteShell>
      <PlayStage />
    </GameRouteShell>
  );
}
