"use client";

import { usePathname } from "@/i18n/routing";
import { Footer } from "./footer";

/** Renders the footer everywhere except the full-screen game page. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/play")) return null;
  return <Footer />;
}

export default SiteFooter;
