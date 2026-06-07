"use client";

import { usePathname } from "@/i18n/routing";
import { FakeAds } from "./fake-ads";

/** Hide fixed spam banners on game routes so mobile play stays fullscreen. */
export function SiteFakeAds() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/demo")) return null;
  return <FakeAds />;
}

export default SiteFakeAds;
