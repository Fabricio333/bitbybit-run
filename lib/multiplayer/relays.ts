/**
 * Relays used for realtime *game* traffic (discovery + control + runner
 * state + finish events). Deliberately a short list of fast, write-
 * friendly public relays — ephemeral events fan out at ~5 Hz per player,
 * so latency and write acceptance matter more than archival coverage.
 *
 * Kept separate from `PUBLIC_RELAYS` in `lib/nostr/relays.ts`, which is
 * tuned for one-shot kind:0 profile *reads* (purplepag.es first, etc.).
 * Publish to all of these and dedupe inbound events by id on read.
 */
export const GAME_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
] as const;
