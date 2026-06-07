"use client";

/**
 * Subscribe to the lobby — open matches advertised on the relays via kind 30078
 * self-presence — and return them aggregated and ready to render. Opens its own
 * relay subscription (independent of any match client) for the browser screen.
 */
import { useEffect, useMemo, useState } from "react";
import { lobbyFilter, parseEvent } from "@/lib/multiplayer/events";
import { NostrTransport } from "@/lib/multiplayer/nostr-transport";
import {
  addPresence,
  selectOpenMatches,
  type DiscoveryState,
  type OpenMatch,
} from "@/lib/multiplayer/discovery";

export interface UseMatchDiscovery {
  matches: OpenMatch[];
  /** True until the first relay event (or a short grace) lands. */
  loading: boolean;
}

export function useMatchDiscovery(): UseMatchDiscovery {
  const [state, setState] = useState<DiscoveryState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transport = new NostrTransport();
    const sub = transport.subscribe(lobbyFilter(), (event) => {
      const parsed = parseEvent(event);
      if (parsed?.type !== "discovery") return;
      setState((prev) => addPresence(prev, parsed.data));
      setLoading(false);
    });
    // Don't spin forever on an empty lobby.
    const grace = setTimeout(() => setLoading(false), 2500);

    return () => {
      clearTimeout(grace);
      sub.close();
      transport.close();
    };
  }, []);

  // Recomputed on every state change; `Date.now()` drives the staleness filter.
  const matches = useMemo(() => selectOpenMatches(state, Date.now()), [state]);

  return { matches, loading };
}
