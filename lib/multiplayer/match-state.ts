/**
 * Pure match state machine.
 *
 * Given a snapshot and a parsed inbound event, return the next snapshot —
 * no I/O, no clock, no Phaser. This is the heart of the multiplayer
 * contract and the easiest piece to test exhaustively. The orchestrator
 * (`match-client.ts`) owns timers and transport; this file owns the rules:
 *   - the roster aggregates each peer's self-presence (no server to own it):
 *     every discovery event upserts that author's seat, keyed by pubkey
 *   - runner frames merge newest-wins (stale frames are dropped)
 *   - the winner is the *earliest* finishTime, recomputed locally — we
 *     never trust a remote event's claimed `position` (see ARCHITECTURE §4.4)
 */
import type { ParsedEvent } from "./events";
import type { FinalStanding, MatchSnapshot } from "./types";

export interface CreateMatchInput {
  matchId: string;
  trackId: string;
  host?: string;
  players?: MatchSnapshot["players"];
  status?: MatchSnapshot["status"];
}

export function createMatchState(input: CreateMatchInput): MatchSnapshot {
  return {
    matchId: input.matchId,
    trackId: input.trackId,
    host: input.host ?? "",
    status: input.status ?? "waiting",
    startAt: null,
    players: input.players ?? [],
    runners: {},
    finishes: {},
    standings: [],
  };
}

/**
 * Resolve current placements. Finishers rank by earliest `finishTime`;
 * everyone still running trails them, ordered by points. Always covers the
 * full roster so the results screen can show every seat.
 */
export function resolveStandings(state: MatchSnapshot): FinalStanding[] {
  const rows = state.players.map((player) => {
    const finish = state.finishes[player.pubkey];
    const runner = state.runners[player.pubkey];
    return {
      pubkey: player.pubkey,
      finishTime: finish ? finish.finishTime : null,
      points: finish ? finish.points : (runner?.points ?? 0),
    };
  });

  rows.sort((a, b) => {
    if (a.finishTime !== null && b.finishTime !== null) {
      return a.finishTime - b.finishTime;
    }
    if (a.finishTime !== null) return -1; // finishers ahead of non-finishers
    if (b.finishTime !== null) return 1;
    return b.points - a.points; // both unfinished → more points ranks higher
  });

  return rows.map((row, index) => ({ ...row, position: index + 1 }));
}

/** True once every roster player has a recorded finish. */
export function isComplete(state: MatchSnapshot): boolean {
  return (
    state.players.length > 0 &&
    state.players.every((p) => state.finishes[p.pubkey] !== undefined)
  );
}

/**
 * Flip a countdown to playing. Time-driven, so the orchestrator calls this
 * when the clock reaches `startAt` (the reducer stays clock-free).
 */
export function beginPlaying(state: MatchSnapshot): MatchSnapshot {
  if (state.status !== "countdown") return state;
  return { ...state, status: "playing" };
}

export function applyEvent(
  state: MatchSnapshot,
  event: ParsedEvent
): MatchSnapshot {
  switch (event.type) {
    case "discovery": {
      // Ignore discovery for a different match sharing our channel.
      if (event.data.matchId !== state.matchId) return state;
      // Upsert this peer's seat (keyed by pubkey) and re-sort by lane. The
      // roster is the union of everyone's self-presence.
      const seat = {
        pubkey: event.data.pubkey,
        lane: event.data.lane,
        name: event.data.name,
      };
      const players = [
        ...state.players.filter((p) => p.pubkey !== seat.pubkey),
        seat,
      ].sort((a, b) => a.lane - b.lane);
      return {
        ...state,
        host: state.host || event.data.host,
        trackId: event.data.trackId,
        players,
      };
    }

    case "control": {
      if (event.data.matchId !== state.matchId) return state;
      // Only ever advance the lifecycle forward.
      if (state.status !== "waiting") {
        return { ...state, startAt: event.data.startAt };
      }
      return { ...state, status: "countdown", startAt: event.data.startAt };
    }

    case "runner": {
      const prev = state.runners[event.data.pubkey];
      if (prev && prev.t >= event.data.t) return state; // stale frame
      return {
        ...state,
        runners: { ...state.runners, [event.data.pubkey]: event.data },
      };
    }

    case "finish": {
      const prev = state.finishes[event.data.pubkey];
      // First finish wins for a given pubkey (a later duplicate can only be
      // slower, so keep the earliest).
      if (prev && prev.finishTime <= event.data.finishTime) return state;
      const next: MatchSnapshot = {
        ...state,
        finishes: { ...state.finishes, [event.data.pubkey]: event.data },
      };
      next.standings = resolveStandings(next);
      if (isComplete(next)) next.status = "finished";
      return next;
    }

    default:
      return state;
  }
}
