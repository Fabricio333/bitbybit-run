import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { getLeaderboard, type LeaderboardRow } from "@/lib/multiplayer/store";

// DB-backed and live: never statically prerender at build (no DATABASE_URL /
// no rows yet during the build).
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  return { title: t("title") };
}

export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Multiplayer persistence isn't wired yet (and the DB may be absent in dev),
  // so degrade to the empty state instead of crashing the page.
  let rows: LeaderboardRow[] = [];
  try {
    rows = await getLeaderboard();
  } catch {
    rows = [];
  }

  return (
    <Container>
      <LeaderboardTable rows={rows} />
    </Container>
  );
}
