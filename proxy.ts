import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next.js 16 middleware (renamed `proxy.ts`). Handles locale negotiation and
// prefixing for next-intl. Kept minimal — no CSP layer yet.
export default createMiddleware(routing);

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
