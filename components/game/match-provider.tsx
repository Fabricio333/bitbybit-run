"use client";

/**
 * Owns the match for a whole play session so it survives the lobby → race
 * handoff. Previously the lobby created its own `MatchClient` and threw it
 * away on start, leaving the race single-player; now the client lives here,
 * above both, and is exposed two ways:
 *   - the lobby reads the roster + start/announce/setRoster actions;
 *   - the race reads a `RaceNet` (built once from the same client) and feeds
 *     it to the Phaser scene.
 *
 * The signed-in player hosts their own match. Without a live signer
 * (nsec / NIP-46 reload, or the session still loading) the context is
 * "dead" — the lobby falls back to local-only and the race stays solo.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSignerContext } from "@/lib/contexts/signer-context";
import { useMatch } from "@/lib/hooks/use-match";
import type { SignerHandle } from "@/lib/nostr/signers";
import type { MatchPlayer, MatchSnapshot } from "@/lib/multiplayer/types";
import { createRaceNet, type RaceNet } from "@/lib/game/race-net";
import { TRACK } from "@/lib/game/track";

export interface MatchContextValue {
  /** True when a real, signed-in match is hosted (vs the local fallback). */
  live: boolean;
  selfPubkey: string | null;
  matchId: string | null;
  snapshot: MatchSnapshot | null;
  announceLobby: (name?: string) => Promise<void>;
  start: (countdownMs?: number) => Promise<void>;
  setRoster: (players: MatchPlayer[]) => void;
  /** The race seam, ready once the client exists. Null when not live. */
  raceNet: RaceNet | null;
}

const noop = async () => {};

const DEAD: MatchContextValue = {
  live: false,
  selfPubkey: null,
  matchId: null,
  snapshot: null,
  announceLobby: noop,
  start: noop,
  setRoster: () => {},
  raceNet: null,
};

const MatchContext = createContext<MatchContextValue>(DEAD);

export function useMatchContext(): MatchContextValue {
  return useContext(MatchContext);
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const { signer, session } = useSignerContext();

  if (signer && session?.pubkey) {
    return (
      <LiveMatchProvider signer={signer} pubkey={session.pubkey}>
        {children}
      </LiveMatchProvider>
    );
  }
  return <MatchContext.Provider value={DEAD}>{children}</MatchContext.Provider>;
}

function LiveMatchProvider({
  signer,
  pubkey,
  children,
}: {
  signer: SignerHandle;
  pubkey: string;
  children: ReactNode;
}) {
  // One stable match identity for this lobby session (host = this player).
  const [matchId] = useState(() => `bbr-${pubkey.slice(0, 8)}-${Date.now()}`);
  const match = useMatch({
    signer,
    matchId,
    trackId: TRACK.id,
    isHost: true,
  });

  // Build the race seam once the client exists; React owns its lifecycle now
  // (the scene no longer disposes it), so tear it down when we unmount.
  const [raceNet, setRaceNet] = useState<RaceNet | null>(null);
  const { client } = match;
  useEffect(() => {
    if (!client) return;
    const net = createRaceNet(client);
    setRaceNet(net);
    return () => {
      net.dispose();
      setRaceNet(null);
    };
  }, [client]);

  const value = useMemo<MatchContextValue>(
    () => ({
      live: true,
      selfPubkey: pubkey,
      matchId,
      snapshot: match.snapshot,
      announceLobby: match.announceLobby,
      start: match.start,
      setRoster: match.setRoster,
      raceNet,
    }),
    [
      pubkey,
      matchId,
      match.snapshot,
      match.announceLobby,
      match.start,
      match.setRoster,
      raceNet,
    ]
  );

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}
