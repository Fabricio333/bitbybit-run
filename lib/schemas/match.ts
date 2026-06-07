/**
 * Zod schemas for the multiplayer wire payloads — the JSON `content` of
 * the four Nostr event kinds that drive a match (see
 * `docs/ARCHITECTURE.md §4`). Every inbound event is parsed through these
 * before the state machine ever sees it, so a malformed or hostile event
 * from a public relay can never corrupt local state.
 *
 *   30078  discovery  (lobby roster, replaceable)   -> MatchDiscoverySchema
 *   21001  control    (start signal)                -> MatchControlSchema
 *   21000  runner     (per-player state, ~5 Hz)     -> RunnerStateSchema
 *   21002  finish     (per-player finish)           -> MatchFinishSchema
 */
import { z } from "zod";
import { NostrPubkeySchema } from "./primitives";
import { LANES } from "@/lib/game/config";

/** A runner's coarse state, mirrored from `RaceScene` (lib/game). */
export const RunnerStatusSchema = z.enum(["running", "bathroom", "finished"]);
export type RunnerStatus = z.infer<typeof RunnerStatusSchema>;

/** 0..1 normalized value (progress, energy, poison). */
const UnitSchema = z.number().min(0).max(1);

/** Lane index on the shared track — `0..LANES-1`. */
const LaneSchema = z.number().int().min(0).max(LANES - 1);

/** Free-form ids kept short so payloads stay tiny on the wire. */
const ShortIdSchema = z.string().min(1).max(64);

/** One seat in the lobby roster. */
export const MatchPlayerSchema = z.object({
  pubkey: NostrPubkeySchema,
  lane: LaneSchema,
  name: z.string().max(80).optional(),
});
export type MatchPlayer = z.infer<typeof MatchPlayerSchema>;

/** kind 30078 content — the host-owned lobby roster. */
export const MatchDiscoverySchema = z.object({
  matchId: ShortIdSchema,
  host: NostrPubkeySchema,
  trackId: ShortIdSchema,
  players: z.array(MatchPlayerSchema).max(LANES),
  createdAt: z.number().int().nonnegative(),
});
export type MatchDiscovery = z.infer<typeof MatchDiscoverySchema>;

/** kind 21001 content — the host's "go" with a synced `startAt`. */
export const MatchControlSchema = z.object({
  type: z.literal("start"),
  matchId: ShortIdSchema,
  trackId: ShortIdSchema,
  /** Unix ms when the race begins (for a synced countdown). */
  startAt: z.number().int().nonnegative(),
});
export type MatchControl = z.infer<typeof MatchControlSchema>;

/** kind 21000 content — a single runner's live state. */
export const RunnerStateSchema = z.object({
  pubkey: NostrPubkeySchema,
  progress: UnitSchema, // 0..1 along the track
  lane: LaneSchema,
  speed: z.number().nonnegative(),
  energy: UnitSchema,
  poison: UnitSchema,
  status: RunnerStatusSchema,
  points: z.number().int(),
  /** Unix ms the sender stamped — used to drop stale frames. */
  t: z.number().int().nonnegative(),
});
export type RunnerState = z.infer<typeof RunnerStateSchema>;

/** kind 21002 content — a runner crossing the line. */
export const MatchFinishSchema = z.object({
  pubkey: NostrPubkeySchema,
  /** Unix ms of the finish — earliest wins (authoritative tiebreak). */
  finishTime: z.number().int().nonnegative(),
  position: z.number().int().positive(),
  points: z.number().int(),
});
export type MatchFinish = z.infer<typeof MatchFinishSchema>;
