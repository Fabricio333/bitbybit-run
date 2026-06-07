"use client";

/**
 * Lobby container — wires the presentational <CharacterSelect> to the live
 * match held by <MatchProvider> (so the same client survives into the race).
 * Claiming a runner announces this peer's own seat (kind 30078, lane = the
 * character's `startLane`); every client aggregates the presences into the
 * roster. The host shares an invite link and presses Start; joiners wait.
 *
 * When the match context is "dead" (no live signer: nsec / NIP-46 reload, or
 * the session still loading) it falls back to a local-only lobby so play still
 * works — claims just don't broadcast.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHARACTERS,
  getCharacter,
  type CharacterId,
} from "@/lib/game/characters";
import { MAX_PLAYERS, type MatchPlayer } from "@/lib/multiplayer/types";
import { CharacterSelect, type LobbyOccupant } from "./character-select";
import { useMatchContext, type MatchContextValue } from "./match-provider";

export interface CurrentUser {
  name: string;
  avatarUrl?: string | null;
}

interface RunnerLobbyProps {
  currentUser: CurrentUser;
  /** Reports the claimed character up so the race mounts the right runner. */
  onClaim: (id: CharacterId) => void;
  /** Begin a *local* (single-player) race. In a live match the start flows
   *  through the match status instead, so this is only used by the fallback. */
  onStart?: () => void;
}

/** Short, readable label for a remote pubkey we have no name for. */
function shortPubkey(pubkey: string): string {
  return `${pubkey.slice(0, 6)}…${pubkey.slice(-4)}`;
}

/** Map a live roster onto lanes keyed by character id (each char owns a lane). */
function rosterToOccupants(
  players: MatchPlayer[],
  pubkey: string,
  currentUser: CurrentUser,
  myReady: boolean
): Partial<Record<CharacterId, LobbyOccupant>> {
  const map: Partial<Record<CharacterId, LobbyOccupant>> = {};
  for (const p of players) {
    const char = CHARACTERS.find((c) => c.startLane === p.lane);
    if (!char) continue;
    const isMe = p.pubkey === pubkey;
    map[char.id] = {
      name: isMe ? currentUser.name : p.name || shortPubkey(p.pubkey),
      avatarUrl: isMe ? currentUser.avatarUrl : null,
      // The wire protocol has no "ready" flag, so we only know our own; remote
      // seats are shown as present (their readiness isn't tracked yet).
      ready: isMe ? myReady : true,
      isCurrentUser: isMe,
    };
  }
  return map;
}

export function RunnerLobby(props: RunnerLobbyProps) {
  const match = useMatchContext();

  if (match.live && match.selfPubkey) {
    return <WiredLobby {...props} match={match} pubkey={match.selfPubkey} />;
  }
  return <LocalLobby {...props} />;
}

function WiredLobby({
  currentUser,
  onClaim,
  match,
  pubkey,
}: RunnerLobbyProps & { match: MatchContextValue; pubkey: string }) {
  const { announceSelf, start, isHost } = match;
  const snapshot = match.snapshot;
  const [ready, setReady] = useState(false);

  const players = useMemo(() => snapshot?.players ?? [], [snapshot]);

  const occupants = useMemo(
    () => rosterToOccupants(players, pubkey, currentUser, ready),
    [players, pubkey, currentUser, ready]
  );

  // Shareable invite for the host — same /play URL with the match + host in the
  // query, so opening it joins this match instead of hosting a new one.
  const inviteUrl = useMemo(() => {
    if (!isHost || !match.matchId || typeof window === "undefined")
      return undefined;
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?m=${encodeURIComponent(match.matchId)}&h=${pubkey}`;
  }, [isHost, match.matchId, pubkey]);

  const claim = useCallback(
    (id: CharacterId) => {
      const char = getCharacter(id);
      setReady(false);
      onClaim(id);
      // Announce our seat (optimistic local upsert happens inside); a relay
      // hiccup must not block the UI.
      announceSelf({ lane: char.startLane, name: currentUser.name }).catch(
        () => {}
      );
    },
    [currentUser.name, announceSelf, onClaim]
  );

  const toggleReady = useCallback((next: boolean) => setReady(next), []);

  // Host only — sending the start signal flips everyone into the race (the
  // parent watches match status, so no local started flag is needed).
  const startRace = useCallback(() => {
    start(0).catch(() => {});
  }, [start]);

  // Auto-start once the grid is full (4/4). Host only, fires once.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (isHost && !autoStarted.current && players.length >= MAX_PLAYERS) {
      autoStarted.current = true;
      start(0).catch(() => {});
    }
  }, [isHost, players.length, start]);

  return (
    <CharacterSelect
      occupants={occupants}
      playerCount={players.length}
      onClaim={claim}
      onToggleReady={toggleReady}
      onStart={startRace}
      canStart
      isHost={isHost}
      inviteUrl={inviteUrl}
    />
  );
}

function LocalLobby({ currentUser, onClaim, onStart }: RunnerLobbyProps) {
  const [claimedId, setClaimedId] = useState<CharacterId | null>(null);
  const [ready, setReady] = useState(false);

  const occupants = useMemo<Partial<Record<CharacterId, LobbyOccupant>>>(
    () =>
      claimedId
        ? {
            [claimedId]: {
              name: currentUser.name,
              avatarUrl: currentUser.avatarUrl,
              ready,
              isCurrentUser: true,
            },
          }
        : {},
    [claimedId, ready, currentUser]
  );

  const claim = useCallback(
    (id: CharacterId) => {
      setClaimedId(id);
      setReady(false);
      onClaim(id);
    },
    [onClaim]
  );

  return (
    <CharacterSelect
      occupants={occupants}
      playerCount={claimedId ? 1 : 0}
      onClaim={claim}
      onToggleReady={setReady}
      onStart={() => onStart?.()}
      canStart
    />
  );
}

export default RunnerLobby;
