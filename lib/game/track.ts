/**
 * Static track definition — shared, deterministic data.
 *
 * Food sits at FIXED positions (like hydration stations in a real race), so
 * every client renders the exact same track with zero synchronization. In the
 * multiplayer phase, all players import this same module.
 */

import { LANES } from "./config";
import { GOOD_IDS, BAD_IDS } from "./foods";

export type FoodItem = {
  id: string;
  lane: number; // 0..LANES-1
  at: number; // distance along the track where it sits
  type: string; // key into FOODS
};

export type Sign = {
  at: number; // distance along the track
  side: -1 | 1; // -1 = left of the track, 1 = right
  text: number; // index into the localized signs list
};

export type Track = {
  id: string;
  lanes: number;
  length: number; // distance to the finish line, in track-units
  goodFood: FoodItem[]; // hydration stations -> energy
  junkFood: FoodItem[]; // obstacles -> poison
};

const LENGTH = 7500;

/** Deterministically lay out food along the track (no randomness). */
function buildFood(
  prefix: string,
  startAt: number,
  step: number,
  laneSeed: number,
  typeIds: string[]
): FoodItem[] {
  const items: FoodItem[] = [];
  let i = 0;
  for (let at = startAt; at < LENGTH - 120; at += step) {
    // Deterministic zig-zag across lanes, cycling through the food types.
    const lane = (laneSeed + i * 3) % LANES;
    const type = typeIds[(i + laneSeed) % typeIds.length];
    items.push({ id: `${prefix}-${i}`, lane, at, type });
    i++;
  }
  return items;
}

export const TRACK: Track = {
  id: "classic-v1",
  lanes: LANES,
  length: LENGTH,
  // Foods placed a bit closer together so energy is easier to sustain.
  goodFood: buildFood("good", 140, 150, 2, GOOD_IDS),
  junkFood: buildFood("junk", 230, 210, 5, BAD_IDS),
};

/** Crowd signs lining the track, alternating sides. `text` cycles through the
 *  localized list of funny signs. */
function buildSigns(): Sign[] {
  const signs: Sign[] = [];
  let i = 0;
  for (let at = 320; at < LENGTH - 200; at += 360) {
    signs.push({ at, side: i % 2 === 0 ? -1 : 1, text: i });
    i++;
  }
  return signs;
}

export const SIGNS: Sign[] = buildSigns();
