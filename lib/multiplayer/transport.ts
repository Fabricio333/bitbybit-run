/**
 * Transport abstraction for match traffic.
 *
 * The match layer only ever talks to this interface, never to a relay
 * client directly. That keeps the realtime contract testable (swap in the
 * in-memory transport, no network) and leaves room to swap the public-
 * relay implementation for an authoritative server (Colyseus / Durable
 * Objects) later — see `docs/ARCHITECTURE.md §10`.
 */
import type { Filter } from "nostr-tools/filter";
import type { NostrEvent } from "@/lib/nostr/types";

/** Handle to an open subscription; call `close()` to stop receiving. */
export interface Subscription {
  close(): void;
}

export interface Transport {
  /** Publish a signed event to all configured destinations. */
  publish(event: NostrEvent): Promise<void>;
  /** Subscribe to events matching `filter`; returns a closable handle. */
  subscribe(filter: Filter, onEvent: (event: NostrEvent) => void): Subscription;
  /** Tear down all connections. */
  close(): void;
}
