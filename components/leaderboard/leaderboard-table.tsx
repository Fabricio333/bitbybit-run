import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/multiplayer/store";
import styles from "./leaderboard-table.module.scss";

type Props = {
  rows: LeaderboardRow[];
};

/** Shorten a hex pubkey for players that have no synced display name yet. */
function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 8)}…${pubkey.slice(-4)}`;
}

/**
 * Global ranking, rendered server-side from the aggregated `getLeaderboard()`
 * rows. The first three places get a podium accent on their rank badge; the
 * empty state covers the (current) pre-multiplayer reality where no results
 * exist yet.
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colRank} scope="col">
                  {t("rank")}
                </th>
                <th className={styles.colPlayer} scope="col">
                  {t("player")}
                </th>
                <th className={styles.colNum} scope="col">
                  {t("wins")}
                </th>
                <th className={styles.colNum} scope="col">
                  {t("points")}
                </th>
                <th className={cn(styles.colNum, styles.colRaces)} scope="col">
                  {t("races")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rank = i + 1;
                const podium =
                  rank === 1
                    ? styles.gold
                    : rank === 2
                      ? styles.silver
                      : rank === 3
                        ? styles.bronze
                        : undefined;
                const name = row.display_name ?? shortPubkey(row.pubkey);

                return (
                  <tr key={row.pubkey} className={cn(podium && styles.podiumRow)}>
                    <td className={styles.colRank}>
                      <span className={cn(styles.rankBadge, podium)}>{rank}</span>
                    </td>
                    <td className={styles.colPlayer}>
                      <span className={styles.player}>
                        {row.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className={styles.avatar}
                            src={row.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            loading="lazy"
                          />
                        ) : (
                          <span className={styles.avatarFallback} aria-hidden="true">
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className={styles.name}>{name}</span>
                      </span>
                    </td>
                    <td className={styles.colNum}>{row.wins}</td>
                    <td className={styles.colNum}>{row.points}</td>
                    <td className={cn(styles.colNum, styles.colRaces)}>
                      {row.races}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default LeaderboardTable;
