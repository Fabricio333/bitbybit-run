import styles from "./game-route-shell.module.scss";

export function GameRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.stage}>{children}</div>
    </div>
  );
}

export default GameRouteShell;
