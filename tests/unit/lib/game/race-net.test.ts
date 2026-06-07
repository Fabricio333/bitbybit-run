// @vitest-environment node
import { describe, it, expect } from "vitest";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { makeNsecSigner } from "@/lib/nostr/signers";
import { MatchClient } from "@/lib/multiplayer/match-client";
import { MemoryHub, MemoryTransport } from "@/lib/multiplayer/memory-transport";
import { createRaceNet } from "@/lib/game/race-net";

/**
 * RaceNet over two real MatchClients on a shared in-memory hub — proves the
 * Phaser-facing seam surfaces remote runners and publishes the local one,
 * without any Phaser or network.
 */

function makeSigner() {
  const sk = generateSecretKey();
  return makeNsecSigner(sk, getPublicKey(sk));
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("createRaceNet", () => {
  it("surfaces remote runners and excludes self", async () => {
    const hub = new MemoryHub();
    const a = makeSigner();
    const b = makeSigner();
    const roster = [
      { pubkey: a.pubkey, lane: 0 },
      { pubkey: b.pubkey, lane: 1, name: "Bea" },
    ];

    const clientA = new MatchClient({
      transport: new MemoryTransport(hub),
      signer: a,
      matchId: "m1",
      trackId: "classic-v1",
      players: roster,
      isHost: true,
    });
    const clientB = new MatchClient({
      transport: new MemoryTransport(hub),
      signer: b,
      matchId: "m1",
      trackId: "classic-v1",
      players: roster,
    });

    const netA = createRaceNet(clientA);

    // B broadcasts; A's RaceNet should see B (and only B).
    await clientB.broadcastRunner(
      {
        progress: 0.3,
        lane: 1,
        speed: 300,
        energy: 0.5,
        poison: 0,
        status: "running",
        points: 10,
      },
      { force: true }
    );

    const views = netA.frame(1000);
    expect(views.map((v) => v.pubkey)).toEqual([b.pubkey]);
    expect(views[0].progress).toBeCloseTo(0.3, 5);
    expect(views[0].name).toBe("Bea");

    netA.dispose();
    clientA.leave();
    clientB.leave();
  });

  it("publishSelf broadcasts the local runner to peers", async () => {
    const hub = new MemoryHub();
    const a = makeSigner();
    const b = makeSigner();

    const clientA = new MatchClient({
      transport: new MemoryTransport(hub),
      signer: a,
      matchId: "m2",
      trackId: "classic-v1",
    });
    const clientB = new MatchClient({
      transport: new MemoryTransport(hub),
      signer: b,
      matchId: "m2",
      trackId: "classic-v1",
    });

    const netA = createRaceNet(clientA);
    netA.publishSelf({
      progress: 0.42,
      lane: 0,
      speed: 200,
      energy: 0.7,
      poison: 0,
      status: "running",
      points: 5,
    });
    await tick(); // publishSelf is fire-and-forget (async sign + dispatch)

    const seen = clientB.getSnapshot().runners[a.pubkey];
    expect(seen).toBeDefined();
    expect(seen.progress).toBeCloseTo(0.42, 5);

    netA.dispose();
    clientA.leave();
    clientB.leave();
  });
});
