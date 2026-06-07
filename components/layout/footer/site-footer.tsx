"use client";

import { usePathname } from "@/i18n/routing";
import { Footer } from "./footer";

/** Renders the footer everywhere except full-screen game routes. */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/demo")) return null;
  return <Footer />;
}

export default SiteFooter;
