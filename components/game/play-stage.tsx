"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { GameCanvas } from "./game-canvas";
import { GameControls } from "./game-controls";
import { RunnerLobby } from "./runner-lobby";
import { MatchProvider, useMatchContext } from "./match-provider";
import { InterstitialAd } from "./interstitial-ad";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button/button";
import { useSignerContext } from "@/lib/contexts/signer-context";
import type { SignerHandle } from "@/lib/nostr/signers";
import { getCharacter, type CharacterId } from "@/lib/game/characters";
import styles from "./play-stage.module.scss";

type FinishResult = { time: number; points: number };

/**
 * Play flow. Normal mode: pick a character, then race. Demo mode: skip the
 * picker (Sprinter only) and, on crossing the finish line, invite the player to
 * sign in to compete for zaps.
 */
type CurrentUser = { name: string; avatarUrl?: string | null };

export function PlayStage({
  demo = false,
  currentUser,
}: {
  demo?: boolean;
  currentUser?: CurrentUser;
}) {
  if (demo) return <DemoStage />;
  return <CompetitiveStage currentUser={currentUser ?? { name: "Player" }} />;
}

/**
 * Competitive flow. With a live signer we host (or join, via an invite link)
 * a real match; without one (nsec / NIP-46 reload) we fall back to a local
 * single-player lobby so play still works.
 */
function CompetitiveStage({ currentUser }: { currentUser: CurrentUser }) {
  const { signer, session } = useSignerContext();
  if (signer && session?.pubkey) {
    return (
      <SignedInStage
        currentUser={currentUser}
        signer={signer}
        pubkey={session.pubkey}
      />
    );
  }
  return <LocalStage currentUser={currentUser} />;
}

type Target = { matchId: string; isHost: boolean; host: string };

/** Resolve the match target once: join the one in the invite link, or host a
 *  fresh one. Stable for the session so the client isn't re-created. */
function SignedInStage({
  currentUser,
  signer,
  pubkey,
}: {
  currentUser: CurrentUser;
  signer: SignerHandle;
  pubkey: string;
}) {
  const params = useSearchParams();
  const joinId = params.get("m");
  const joinHost = params.get("h");
  const [target] = useState<Target>(() =>
    joinId
      ? { matchId: joinId, isHost: false, host: joinHost ?? "" }
      : {
          matchId: `bbr-${pubkey.slice(0, 8)}-${Date.now()}`,
          isHost: true,
          host: pubkey,
        }
  );

  return (
    <MatchProvider
      signer={signer}
      pubkey={pubkey}
      matchId={target.matchId}
      isHost={target.isHost}
      host={target.host}
    >
      <LobbyAndRace currentUser={currentUser} />
    </MatchProvider>
  );
}

/** Inside a live match: show the lobby until the host starts (status leaves
 *  "waiting"), then the race. The same client drives both. */
function LobbyAndRace({ currentUser }: { currentUser: CurrentUser }) {
  const match = useMatchContext();
  const [selectedId, setSelectedId] = useState<CharacterId>("default");

  const status = match.snapshot?.status ?? "waiting";
  if (status === "waiting") {
    return <RunnerLobby currentUser={currentUser} onClaim={setSelectedId} />;
  }

  // Only hand the scene a live net when there's company on the track —
  // otherwise a solo host would get MP behavior (lonely minimap, no restart).
  const multiplayer = (match.snapshot?.players.length ?? 0) > 1;
  return (
    <div className={styles.wrap}>
      <GameCanvas
        key={selectedId}
        character={getCharacter(selectedId)}
        raceNet={multiplayer ? (match.raceNet ?? undefined) : undefined}
      />
      <GameControls />
    </div>
  );
}

/** No live signer: a local single-player lobby + race (no match). */
function LocalStage({ currentUser }: { currentUser: CurrentUser }) {
  const [selectedId, setSelectedId] = useState<CharacterId>("default");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <RunnerLobby
        currentUser={currentUser}
        onClaim={setSelectedId}
        onStart={() => setStarted(true)}
      />
    );
  }
  return (
    <div className={styles.wrap}>
      <GameCanvas key={selectedId} character={getCharacter(selectedId)} />
      <GameControls />
    </div>
  );
}

/** Free single-player demo: no match, finish invites sign-in. */
function DemoStage() {
  const tDemo = useTranslations("demo");
  const [finish, setFinish] = useState<FinishResult | null>(null);
  const [showAd, setShowAd] = useState(false);
  // Bumped to remount GameCanvas (Phaser builds on mount) for a fresh round.
  const [runId, setRunId] = useState(0);

  return (
    <div className={styles.wrap}>
      <GameCanvas
        key={runId}
        character={getCharacter("default")}
        onFinish={setFinish}
      />
      <GameControls />

      {finish && (
        <Modal
          onClose={() => setFinish(null)}
          title={tDemo("finishTitle")}
          ariaLabel={tDemo("finishTitle")}
          size="sm"
        >
          <div className={styles.invite}>
            <p className={styles.inviteStats}>
              {finish.time.toFixed(1)}s · {finish.points} pts
            </p>
            <p className={styles.inviteText}>{tDemo("finishText")}</p>
            <div className={styles.inviteActions}>
              <Button
                href={{ pathname: "/sign-in", query: { next: "/play" } }}
                size="lg"
              >
                {tDemo("login")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  // Swap the finish modal for the ad so they don't stack.
                  setFinish(null);
                  setShowAd(true);
                }}
              >
                {tDemo("keepPlaying")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showAd && (
        <InterstitialAd
          onDone={() => {
            // Dismissing the ad ends the round: close everything and remount
            // the canvas so a brand-new race starts from the line.
            setShowAd(false);
            setFinish(null);
            setRunId((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

export default PlayStage;
