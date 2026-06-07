import { getTranslations } from "next-intl/server";
import type { LeaderboardRow } from "@/lib/multiplayer/store";
import { RankingTable } from "./ranking-table";
import { shortPubkey } from "@/lib/utils";
import styles from "./leaderboard-table.module.scss";

type Props = {
  rows: LeaderboardRow[];
};

/**
 * Global ranking, rendered server-side from the aggregated `getLeaderboard()`
 * rows via the shared <RankingTable>. The empty state covers the reality where
 * no results exist yet (no DB, or no matches played).
 */
export async function LeaderboardTable({ rows }: Props) {
  const t = await getTranslations("leaderboard");

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.subtitle}>{t("subtitle")}</p>

      {rows.length === 0 ? (
        <p className={styles.empty}>{t("empty")}</p>
      ) : (
        <RankingTable
          rankLabel={t("rank")}
          playerLabel={t("player")}
          columns={[
            { label: t("wins") },
            { label: t("points") },
            { label: t("races"), collapsible: true },
          ]}
          rows={rows.map((row) => ({
            key: row.pubkey,
            name: row.display_name ?? shortPubkey(row.pubkey),
            avatarUrl: row.avatar_url,
            values: [row.wins, row.points, row.races],
          }))}
        />
      )}
    </section>
  );
}

export default LeaderboardTable;
