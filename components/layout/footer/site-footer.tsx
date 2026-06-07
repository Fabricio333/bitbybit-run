"use client";

import { usePathname } from "@/i18n/routing";
import { Footer } from "./footer";
import styles from "../game-route-chrome.module.scss";

/** Keep desktop footer intact; hide it with CSS only on mobile game routes. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/demo")) {
    return (
      <div className={styles.gameRouteChrome}>
        <Footer />
      </div>
    );
  }
  return <Footer />;
}

export default SiteFooter;
