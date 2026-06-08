/**
 * The seam between the Phaser race and the multiplayer layer.
 *
 * `RaceScene` knows nothing about `MatchClient`, Nostr, or signing — it only
 * sees a `RaceNet`: push my own runner state, hear about the finish, and pull
 * smoothed remote runners to draw. That keeps the scene single-player by
 * default (no `RaceNet` in the registry → none of this runs) and lets the
 * lobby wire a real match in without touching the game loop.
 */
import type { RunnerInput } from "@/lib/multiplayer/match-client";
import type { MatchSnapshot } from "@/lib/multiplayer/types";
import { RemoteRunners, type RemoteRunnerView } from "./remote-runners";

/**
 * The slice of `MatchClient` a race needs. Structural on purpose so tests can
 * pass a fake and the real client satisfies it without a hard dependency.
 */
export interface MatchClientLike {
  readonly pubkey: string;
  onSnapshot(listener: (snapshot: MatchSnapshot) => void): () => void;
  broadcastRunner(
    input: RunnerInput,
    opts?: { force?: boolean }
  ): Promise<boolean>;
  finish(input: { points: number; finishTime?: number }): Promise<void>;
}

export interface RaceNet {
  readonly selfPubkey: string;
  /** Broadcast the local runner (throttled downstream by the client). */
  publishSelf(state: RunnerInput): void;
  /** Announce the local finish. */
  finish(result: { points: number; finishTime: number }): void;
  /** Smoothed remote runners (excludes self) for this frame. */
  frame(nowMono: number): RemoteRunnerView[];
  /** Detach the snapshot listener. */
  dispose(): void;
}

export function createRaceNet(client: MatchClientLike): RaceNet {
  const remotes = new RemoteRunners();
  let snapshot: MatchSnapshot | null = null;
  const unsubscribe = client.onSnapshot((s) => {
    snapshot = s;
  });

  return {
    selfPubkey: client.pubkey,

    publishSelf(state) {
      // Fire-and-forget: a dropped frame is fine, the next one supersedes it.
      void client.broadcastRunner(state).catch(() => {});
    },

    finish(result) {
      void client.finish(result).catch(() => {});
    },

    frame(nowMono) {
      if (!snapshot) return [];
      remotes.ingest(snapshot.runners, client.pubkey, nowMono);
      return remotes.frame(nowMono, snapshot.players);
    },

    dispose() {
      unsubscribe();
      remotes.clear();
    },
  };
}
