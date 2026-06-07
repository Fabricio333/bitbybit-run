/**
 * In-process `Transport` — no network, no relays.
 *
 * Multiple `MemoryTransport`s sharing a `MemoryHub` see each other's
 * published events (filtered with the same NIP-01 matching the real relays
 * use, via `matchFilters`). This is what makes the multiplayer contract
 * unit-testable: spin up two `MatchClient`s on one hub and assert they
 * converge — exactly the relay round-trip, minus the flakiness. A single
 * hub backed by `BroadcastChannel` could also drive two browser tabs in
 * local dev, but that wiring lives outside this module.
 */
import { matchFilters, type Filter } from "nostr-tools/filter";
import type { NostrEvent } from "@/lib/nostr/types";
import type { Subscription, Transport } from "./transport";

type Listener = (event: NostrEvent) => void;

/** Shared bus that fans published events out to every subscriber. */
export class MemoryHub {
  private readonly listeners = new Set<Listener>();

  publish(event: NostrEvent): void {
    // Copy first so a listener that (un)subscribes mid-dispatch can't
    // mutate the set we're iterating.
    for (const listener of [...this.listeners]) listener(event);
  }

  add(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export class MemoryTransport implements Transport {
  constructor(private readonly hub: MemoryHub) {}

  async publish(event: NostrEvent): Promise<void> {
    this.hub.publish(event);
  }

  subscribe(
    filter: Filter,
    onEvent: (event: NostrEvent) => void
  ): Subscription {
    const remove = this.hub.add((event) => {
      // matchFilters expects nostr-tools' Event; our NostrEvent is the
      // same shape structurally.
      if (matchFilters([filter], event)) onEvent(event);
    });
    return { close: remove };
  }

  close(): void {
    // Per-subscription cleanup happens via Subscription.close(); the hub
    // itself outlives individual transports.
  }
}
