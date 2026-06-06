// Fake "spam" ads shown in the desktop margins (see components/layout/fake-ads).
//
// Each ad has a UNIQUE `id` that doubles as its URL segment (/gotcha/<id>) so
// every banner links somewhere different — but they all resolve to the same
// gag page, which renders a different joke per slug. Ads intentionally never
// link to the game itself (avoids sending people to a half-built screen).
//
// Copy lives in the `fakeAds` i18n namespace, keyed by id. This file only holds
// the visual metadata so it stays safe to import from both server and client.

export type AdVariant = "warning" | "primary" | "secondary" | "nostr" | "error";

export interface FakeAd {
  /** Slug — also the unique URL segment at /gotcha/<id>. */
  id: string;
  /** Oversized emoji shown as the ad's "creative". */
  emoji: string;
  /** Rotated corner sticker (kept short — "NEW!", "2X", "HOT"). */
  sticker: string;
  /** Accent color theme (maps to a CSS role token in the stylesheet). */
  variant: AdVariant;
}

export const FAKE_ADS: FakeAd[] = [
  { id: "free-bitcoin", emoji: "🎉", sticker: "NEW!", variant: "warning" },
  { id: "hot-zaps", emoji: "💜", sticker: "HOT", variant: "nostr" },
  { id: "cloud-seed", emoji: "☁️", sticker: "✓ SAFE", variant: "secondary" },
  { id: "lambo-90-days", emoji: "🏎️", sticker: "WOW", variant: "primary" },
  { id: "browser-miner", emoji: "⛏️", sticker: "FREE", variant: "secondary" },
  { id: "sat-faucet", emoji: "💧", sticker: "CLICK", variant: "primary" },
  { id: "double-btc", emoji: "🚀", sticker: "2X", variant: "error" },
  { id: "scarcity-21m", emoji: "⏳", sticker: "LAST", variant: "warning" },
  { id: "elon-giveaway", emoji: "📺", sticker: "LIVE", variant: "primary" },
  { id: "shitcoin-1000x", emoji: "📈", sticker: "1000X", variant: "error" },
  { id: "nft-rare", emoji: "🖼️", sticker: "RARE", variant: "nostr" },
  { id: "wallet-airdrop", emoji: "🪂", sticker: "FREE", variant: "warning" },
  { id: "telegram-signals", emoji: "💎", sticker: "VIP", variant: "secondary" },
  {
    id: "lightning-yield",
    emoji: "⚡",
    sticker: "50% APY",
    variant: "warning",
  },
  { id: "nostr-verify", emoji: "✅", sticker: "VERIFY", variant: "nostr" },
  { id: "mining-rig", emoji: "🔥", sticker: "-90%", variant: "secondary" },
  { id: "quantum-safe", emoji: "🛡️", sticker: "URGENT", variant: "error" },
  { id: "btc-pizza", emoji: "🍕", sticker: "DEAL", variant: "primary" },
];

/** All slugs — used to pre-render the gag pages (generateStaticParams). */
export const FAKE_AD_IDS = FAKE_ADS.map((ad) => ad.id);
