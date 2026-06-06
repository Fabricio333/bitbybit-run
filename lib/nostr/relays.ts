/**
 * Public Nostr relays used for read-only queries (kind:0 profile
 * metadata, etc). Kept distinct from `NIP46_CONNECT_RELAYS` in
 * `nip46-login.ts` because that list has an ordering constraint
 * (`relay.nsec.app` must come first) that does not apply here.
 */
// Ordered for kind:0 coverage. purplepag.es + nos.lol reliably serve
// profile metadata; damus/primal frequently EOSE with no event for a
// kind:0 query, so they're only backups.
export const PUBLIC_RELAYS = [
  "wss://purplepag.es",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://relay.primal.net",
] as const;
