/**
 * `Transport` over public Nostr relays — the production realtime layer.
 *
 * Wraps a `SimplePool`: publishes to every game relay (resolving as soon
 * as one accepts) and dedupes inbound events by id across relays. Browser-
 * side, long-lived for the duration of a match.
 */
import { SimplePool } from "nostr-tools/pool";
import type { Filter } from "nostr-tools/filter";
import type { NostrEvent } from "@/lib/nostr/types";
import { GAME_RELAYS } from "./relays";
import type { Subscription, Transport } from "./transport";

export class NostrTransport implements Transport {
  private readonly pool = new SimplePool();
  private readonly relays: string[];

  constructor(relays: readonly string[] = GAME_RELAYS) {
    this.relays = [...relays];
  }

  async publish(event: NostrEvent): Promise<void> {
    // `publish` returns one promise per relay; succeed if any relay accepts,
    // swallow the AggregateError when they all reject (best-effort fan-out).
    try {
      await Promise.any(this.pool.publish(this.relays, event));
    } catch {
      // all relays rejected — nothing we can do but drop this frame.
    }
  }

  subscribe(
    filter: Filter,
    onEvent: (event: NostrEvent) => void
  ): Subscription {
    const seen = new Set<string>();
    const sub = this.pool.subscribeMany(this.relays, filter, {
      onevent: (event) => {
        if (seen.has(event.id)) return; // same event echoed by another relay
        seen.add(event.id);
        onEvent(event);
      },
    });
    return { close: () => sub.close() };
  }

  close(): void {
    this.pool.close(this.relays);
  }
}
