"use client";

import { usePathname } from "@/i18n/routing";
import { Navbar } from "./navbar";

/** Hide the site navbar on game routes: the game owns the whole viewport. */
export function SiteNavbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/demo")) return null;
  return <Navbar />;
}

export default SiteNavbar;
