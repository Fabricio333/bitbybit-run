"use client";

/**
 * Lobby container — wires the presentational <CharacterSelect> to the live
 * multiplayer layer (`useMatch`). The signed-in player is the host of their
 * own match: claiming a runner writes a seat into the host-authoritative
 * roster (lane = the character's `startLane`) and re-announces the lobby;
 * "Ready → Start" sends the synced start signal.
 *
 * When no live signer is available (nsec / NIP-46 users who reloaded, or the
 * session is still loading) it falls back to a local-only lobby so play still
 * works — claims just don't broadcast.
 */

import { useCallback, useMemo, useState } from "react";
import { useSignerContext } from "@/lib/contexts/signer-context";
import { useMatch } from "@/lib/hooks/use-match";
import type { SignerHandle } from "@/lib/nostr/signers";
import {
  CHARACTERS,
  getCharacter,
  type CharacterId,
} from "@/lib/game/characters";
import type { MatchPlayer } from "@/lib/multiplayer/types";
import { CharacterSelect, type LobbyOccupant } from "./character-select";

export interface CurrentUser {
  name: string;
  avatarUrl?: string | null;
}

interface RunnerLobbyProps {
  currentUser: CurrentUser;
  /** Reports the claimed character up so the race mounts the right runner. */
  onClaim: (id: CharacterId) => void;
  /** Begin the race. */
  onStart: () => void;
}

const TRACK_ID = "classic-v1";

/** Short, readable label for a remote pubkey we have no name for. */
function shortPubkey(pubkey: string): string {
  return `${pubkey.slice(0, 6)}…${pubkey.slice(-4)}`;
}

/** Map a live roster onto lanes keyed by character id (each char owns a lane). */
function rosterToOccupants(
  players: MatchPlayer[],
  pubkey: string,
  currentUser: CurrentUser,
  myReady: boolean,
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
  const { signer, session } = useSignerContext();

  if (signer && session?.pubkey) {
    return <WiredLobby {...props} signer={signer} pubkey={session.pubkey} />;
  }
  return <LocalLobby {...props} />;
}

function WiredLobby({
  currentUser,
  onClaim,
  onStart,
  signer,
  pubkey,
}: RunnerLobbyProps & { signer: SignerHandle; pubkey: string }) {
  // One stable match identity per lobby session (host = this player).
  const [matchId] = useState(() => `bbr-${pubkey.slice(0, 8)}-${Date.now()}`);
  const [ready, setReady] = useState(false);

  const { snapshot, announceLobby, start, setRoster } = useMatch({
    signer,
    matchId,
    trackId: TRACK_ID,
    isHost: true,
  });

  const occupants = useMemo(
    () => rosterToOccupants(snapshot.players, pubkey, currentUser, ready),
    [snapshot.players, pubkey, currentUser, ready],
  );

  const claim = useCallback(
    (id: CharacterId) => {
      const char = getCharacter(id);
      const others = snapshot.players.filter((p) => p.pubkey !== pubkey);
      const next: MatchPlayer[] = [
        ...others,
        { pubkey, lane: char.startLane, name: currentUser.name },
      ];
      setRoster(next);
      setReady(false);
      onClaim(id);
      // Best-effort: a relay hiccup must not block the optimistic local update.
      announceLobby(currentUser.name).catch(() => {});
    },
    [snapshot.players, pubkey, currentUser, setRoster, announceLobby, onClaim],
  );

  const toggleReady = useCallback(
    (next: boolean) => {
      setReady(next);
      if (next) announceLobby(currentUser.name).catch(() => {});
    },
    [announceLobby, currentUser.name],
  );

  const startRace = useCallback(() => {
    start(0).catch(() => {});
    onStart();
  }, [start, onStart]);

  return (
    <CharacterSelect
      occupants={occupants}
      playerCount={snapshot.players.length}
      onClaim={claim}
      onToggleReady={toggleReady}
      onStart={startRace}
      canStart
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
    [claimedId, ready, currentUser],
  );

  const claim = useCallback(
    (id: CharacterId) => {
      setClaimedId(id);
      setReady(false);
      onClaim(id);
    },
    [onClaim],
  );

  return (
    <CharacterSelect
      occupants={occupants}
      playerCount={claimedId ? 1 : 0}
      onClaim={claim}
      onToggleReady={setReady}
      onStart={onStart}
      canStart
    />
  );
}

export default RunnerLobby;
