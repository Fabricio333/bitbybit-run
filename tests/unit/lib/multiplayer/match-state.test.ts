// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { ParsedEvent } from "@/lib/multiplayer/events";
import {
  applyEvent,
  beginPlaying,
  createMatchState,
  isComplete,
  resolveStandings,
} from "@/lib/multiplayer/match-state";
import type { RunnerState } from "@/lib/multiplayer/types";

const A = "a".repeat(64);
const B = "b".repeat(64);

function runner(pubkey: string, over: Partial<RunnerState> = {}): RunnerState {
  return {
    pubkey,
    progress: 0,
    lane: 0,
    speed: 180,
    energy: 0.5,
    poison: 0,
    status: "running",
    points: 0,
    t: 1,
    ...over,
  };
}

function base() {
  return createMatchState({
    matchId: "m1",
    trackId: "classic-v1",
    players: [
      { pubkey: A, lane: 0 },
      { pubkey: B, lane: 1 },
    ],
  });
}

describe("match-state createMatchState", () => {
  it("starts waiting with empty live state", () => {
    const s = base();
    expect(s.status).toBe("waiting");
    expect(s.startAt).toBeNull();
    expect(s.runners).toEqual({});
    expect(s.finishes).toEqual({});
    expect(s.players).toHaveLength(2);
  });
});

function presence(
  pubkey: string,
  lane: number,
  over: Partial<{ matchId: string; host: string; name: string }> = {}
): ParsedEvent {
  return {
    type: "discovery",
    data: {
      matchId: over.matchId ?? "m1",
      host: over.host ?? A,
      trackId: "classic-v1",
      pubkey,
      lane,
      name: over.name,
      createdAt: 1,
    },
  };
}

describe("match-state discovery (self-presence aggregation)", () => {
  it("aggregates each peer's seat into the roster, sorted by lane", () => {
    let s = createMatchState({ matchId: "m1", trackId: "classic-v1" });
    s = applyEvent(s, presence(B, 1, { name: "Bea" }));
    s = applyEvent(s, presence(A, 0, { name: "Ann" }));
    expect(s.players.map((p) => p.pubkey)).toEqual([A, B]); // lane order
    expect(s.players[0]).toMatchObject({ pubkey: A, lane: 0, name: "Ann" });
    expect(s.host).toBe(A);
  });

  it("upserts a peer's own seat (re-claim updates, doesn't duplicate)", () => {
    let s = createMatchState({ matchId: "m1", trackId: "classic-v1" });
    s = applyEvent(s, presence(A, 0));
    s = applyEvent(s, presence(A, 3)); // A moves lanes
    expect(s.players).toHaveLength(1);
    expect(s.players[0].lane).toBe(3);
  });

  it("ignores discovery for a different match", () => {
    const before = base();
    expect(applyEvent(before, presence(A, 0, { matchId: "other" }))).toBe(
      before
    );
  });
});

describe("match-state control + countdown", () => {
  it("moves waiting → countdown and records startAt", () => {
    const event: ParsedEvent = {
      type: "control",
      data: {
        type: "start",
        matchId: "m1",
        trackId: "classic-v1",
        startAt: 999,
      },
    };
    const s = applyEvent(base(), event);
    expect(s.status).toBe("countdown");
    expect(s.startAt).toBe(999);
  });

  it("beginPlaying only advances from countdown", () => {
    const waiting = base();
    expect(beginPlaying(waiting)).toBe(waiting);
    const countdown = { ...waiting, status: "countdown" as const, startAt: 1 };
    expect(beginPlaying(countdown).status).toBe("playing");
  });
});

describe("match-state runner merge", () => {
  it("keeps the newest frame per pubkey and drops stale ones", () => {
    let s = base();
    s = applyEvent(s, {
      type: "runner",
      data: runner(A, { t: 10, progress: 0.2 }),
    });
    expect(s.runners[A].progress).toBeCloseTo(0.2);

    // stale (older t) → ignored, returns same reference
    const same = applyEvent(s, {
      type: "runner",
      data: runner(A, { t: 5, progress: 0.9 }),
    });
    expect(same).toBe(s);

    // newer t → applied
    s = applyEvent(s, {
      type: "runner",
      data: runner(A, { t: 20, progress: 0.6 }),
    });
    expect(s.runners[A].progress).toBeCloseTo(0.6);
  });
});

describe("match-state finish + standings", () => {
  it("ranks finishers by earliest finishTime and completes the match", () => {
    let s = base();
    s = applyEvent(s, {
      type: "finish",
      data: { pubkey: B, finishTime: 200, position: 1, points: 510 },
    });
    expect(s.status).not.toBe("finished"); // only one of two finished
    expect(isComplete(s)).toBe(false);

    s = applyEvent(s, {
      type: "finish",
      data: { pubkey: A, finishTime: 100, position: 1, points: 520 },
    });
    expect(isComplete(s)).toBe(true);
    expect(s.status).toBe("finished");
    // A finished earlier (100 < 200) → position 1 despite arriving second.
    expect(s.standings.map((r) => r.pubkey)).toEqual([A, B]);
    expect(s.standings[0].position).toBe(1);
    expect(s.standings[1].position).toBe(2);
  });

  it("does not let a later duplicate finish overwrite the first", () => {
    let s = base();
    s = applyEvent(s, {
      type: "finish",
      data: { pubkey: A, finishTime: 100, position: 1, points: 500 },
    });
    const same = applyEvent(s, {
      type: "finish",
      data: { pubkey: A, finishTime: 300, position: 2, points: 999 },
    });
    expect(same).toBe(s);
  });
});

describe("match-state resolveStandings", () => {
  it("orders unfinished players by points behind finishers", () => {
    let s = base();
    s = applyEvent(s, {
      type: "runner",
      data: runner(A, { t: 1, points: 40 }),
    });
    s = applyEvent(s, {
      type: "runner",
      data: runner(B, { t: 1, points: 90 }),
    });
    const standings = resolveStandings(s);
    // No finishers → higher points first.
    expect(standings[0].pubkey).toBe(B);
    expect(standings[0].finishTime).toBeNull();
  });
});
