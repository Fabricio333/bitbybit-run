import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Let SCSS partials resolve `@use "@/styles/..."` from the project root.
  sassOptions: {
    includePaths: [process.cwd()],
  },
  // TODO: CSP connect-src wss: for NIP-46 — if a Content-Security-Policy
  // is ever added, it must allow `wss:` and `https:` in connect-src so
  // the NIP-46 (Nostr Connect) relay handshake can reach signer relays.
};

export default withNextIntl(nextConfig);
