/**
 * Static track definition — shared, deterministic data.
 *
 * Food sits at FIXED positions (like hydration stations in a real race), so
 * every client renders the exact same track with zero synchronization. In the
 * multiplayer phase, all players import this same module.
 */

import { LANES } from "./config";
import { GOOD_IDS, BAD_IDS, BOOST_IDS } from "./foods";

export type FoodItem = {
  id: string;
  lane: number; // 0..LANES-1
  at: number; // distance along the track where it sits
  type: string; // key into FOODS
};

export type PowerUpItem = {
  id: string;
  lane: number; // 0..LANES-1
  at: number;
  type: "shield";
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
  boosters: FoodItem[]; // 🚀 speed bursts, tucked inside junk-food gauntlets
};

const LENGTH = 11000;

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
    const lane = (laneSeed + i * 2) % LANES;
    const type = typeIds[(i + laneSeed) % typeIds.length];
    items.push({ id: `${prefix}-${i}`, lane, at, type });
    i++;
  }
  return items;
}

/**
 * Hand-placed "complicated zones": a 🚀 booster sitting in one lane, with junk
 * food filling some of the other lanes at the same distance. The zone is always
 * dodgeable — there's the booster's own (clean) lane to grab the burst, plus a
 * guaranteed junk-free escape lane to coast through if you'd rather skip it. The
 * junk in between makes reaching the 🚀 a precise merge — risk/reward, not a wall.
 */
const BOOST_ZONES: { at: number; lane: number }[] = [
  { at: 3000, lane: 0 },
  { at: 6500, lane: 3 },
  { at: 9500, lane: 1 },
];

function buildBoostZones(): { boosters: FoodItem[]; gauntletJunk: FoodItem[] } {
  const boosters: FoodItem[] = [];
  const gauntletJunk: FoodItem[] = [];
  BOOST_ZONES.forEach((zone, z) => {
    boosters.push({
      id: `boost-${z}`,
      lane: zone.lane,
      at: zone.at,
      type: BOOST_IDS[z % BOOST_IDS.length],
    });
    // The lane farthest from the booster is left as a guaranteed junk-free
    // escape, so the zone can ALWAYS be passed cleanly (two safe lanes: the 🚀
    // lane and the escape lane). Every remaining lane gets junk.
    let escape = 0;
    let best = -1;
    for (let lane = 0; lane < LANES; lane++) {
      const d = Math.abs(lane - zone.lane);
      if (d > best) {
        best = d;
        escape = lane;
      }
    }
    let g = 0;
    for (let lane = 0; lane < LANES; lane++) {
      if (lane === zone.lane || lane === escape) continue;
      gauntletJunk.push({
        id: `gauntlet-${z}-${g}`,
        lane,
        at: zone.at,
        type: BAD_IDS[g % BAD_IDS.length],
      });
      g++;
    }
  });
  return { boosters, gauntletJunk };
}

const { boosters: BOOSTERS, gauntletJunk: GAUNTLET_JUNK } = buildBoostZones();

export const TRACK: Track = {
  id: "classic-v1",
  lanes: LANES,
  length: LENGTH,
  // Foods placed a bit closer together so energy is easier to sustain.
  goodFood: buildFood("good", 140, 150, 2, GOOD_IDS),
  junkFood: [...buildFood("junk", 230, 210, 5, BAD_IDS), ...GAUNTLET_JUNK],
  boosters: BOOSTERS,
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
