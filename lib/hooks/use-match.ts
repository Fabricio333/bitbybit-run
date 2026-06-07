"use client";

/**
 * React adapter over `MatchClient`. Owns the client's lifecycle for the
 * duration of a match and mirrors its snapshot into React state so the
 * lobby / minimap / results UI can render off it.
 *
 * The transport and signer are injected (the signer comes from the auth
 * context; the transport defaults to public Nostr relays) so this hook
 * stays testable and the realtime backend remains swappable. No page wires
 * it up yet — it ships ahead of the lobby/race UI it will drive.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SignerHandle } from "@/lib/nostr/signers";
import { MatchClient, type RunnerInput } from "@/lib/multiplayer/match-client";
import { NostrTransport } from "@/lib/multiplayer/nostr-transport";
import type { Transport } from "@/lib/multiplayer/transport";
import type { MatchPlayer, MatchSnapshot } from "@/lib/multiplayer/types";

export interface UseMatchOptions {
  signer: SignerHandle;
  matchId: string;
  trackId: string;
  players?: MatchPlayer[];
  isHost?: boolean;
  /** Override the realtime transport (defaults to public Nostr relays). */
  transport?: Transport;
}

export interface UseMatch {
  snapshot: MatchSnapshot;
  announceLobby: (name?: string) => Promise<void>;
  start: (countdownMs?: number) => Promise<void>;
  broadcastRunner: (
    input: RunnerInput,
    opts?: { force?: boolean }
  ) => Promise<boolean>;
  finish: (input: { points: number; finishTime?: number }) => Promise<void>;
  setRoster: (players: MatchPlayer[]) => void;
}

export function useMatch(options: UseMatchOptions): UseMatch {
  const {
    signer,
    matchId,
    trackId,
    players,
    isHost,
    transport: injectedTransport,
  } = options;

  const clientRef = useRef<MatchClient | null>(null);
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);

  // A new MatchClient (and a fresh default transport) per match identity.
  useEffect(() => {
    const transport = injectedTransport ?? new NostrTransport();
    const client = new MatchClient({
      transport,
      signer,
      matchId,
      trackId,
      players,
      isHost,
    });
    clientRef.current = client;
    const unsubscribe = client.onSnapshot(setSnapshot);

    return () => {
      unsubscribe();
      client.leave();
      // Only close a transport we created; an injected one is the caller's.
      if (!injectedTransport) transport.close();
      clientRef.current = null;
    };
    // Re-init only on a genuine identity change. `players` is just a seed
    // (a fresh array each render); roster updates flow through setRoster, so
    // it is intentionally excluded to avoid tearing down the live client.
  }, [signer, matchId, trackId, isHost, injectedTransport]);

  const announceLobby = useCallback(
    (name?: string) => clientRef.current!.announceLobby(name),
    []
  );
  const start = useCallback(
    (countdownMs?: number) => clientRef.current!.start(countdownMs),
    []
  );
  const broadcastRunner = useCallback(
    (input: RunnerInput, opts?: { force?: boolean }) =>
      clientRef.current!.broadcastRunner(input, opts),
    []
  );
  const finish = useCallback(
    (input: { points: number; finishTime?: number }) =>
      clientRef.current!.finish(input),
    []
  );
  const setRoster = useCallback(
    (next: MatchPlayer[]) => clientRef.current!.setRoster(next),
    []
  );

  // Stable empty snapshot for the first render before the effect runs.
  const fallback = useMemo<MatchSnapshot>(
    () => ({
      matchId,
      trackId,
      host: isHost ? signer.pubkey : "",
      status: "waiting",
      startAt: null,
      players: players ?? [],
      runners: {},
      finishes: {},
      standings: [],
    }),
    [matchId, trackId, isHost, signer.pubkey, players]
  );

  return {
    snapshot: snapshot ?? fallback,
    announceLobby,
    start,
    broadcastRunner,
    finish,
    setRoster,
  };
}
