"use client";

import { usePathname } from "@/i18n/routing";
import { Navbar } from "./navbar";
import styles from "../game-route-chrome.module.scss";

/** Keep desktop chrome intact; hide it with CSS only on mobile game routes. */
export function SiteNavbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/demo")) {
    return (
      <div className={styles.gameRouteChrome}>
        <Navbar />
      </div>
    );
  }
  return <Navbar />;
}

export default SiteNavbar;
