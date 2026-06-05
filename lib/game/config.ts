/**
 * Tunable game constants for Bit by Bit Run (Phase 1, single-player).
 * Keep all "feel" numbers here so they're easy to balance.
 */

export const LANES = 8;

/** Logical render resolution (scaled to fit the screen). */
export const VIEW = {
  width: 960,
  height: 540,
};

/**
 * How far ahead the static track is drawn, in track-units. Much larger than the
 * food view distance so the orange track visually converges to the horizon
 * (the "sky line") and the bend can continue from there.
 */
export const TRACK_DRAW_DISTANCE = 4500;

/** Forward movement speeds, in track-units per second. */
export const SPEED = {
  base: 180, // automatic cruising speed
  sprint: 370, // while accelerating WITH energy
  brake: 120, // while braking
  exhausted: 150, // cap when energy is empty (slower than base, but not crawling)
};

/** Energy bar: spent to sprint, refilled by good food. Range 0..1. */
export const ENERGY = {
  start: 0.5,
  max: 1,
  drainPerSecond: 0.28, // while sprinting (lower = energy lasts longer)
  gainPerFood: 0.34, // fallback; per-food amounts live in foods.ts
};

/** Poison bar: filled by junk food. When full -> bathroom break. Range 0..1. */
export const POISON = {
  max: 1,
  gainPerFood: 0.34, // per junk food eaten
  decayPerSecond: 0.02, // slowly recovers over time
};

/** Points awarded during a race. */
export const POINTS = {
  goodFood: 10,
  junkFood: -5,
  finishBonus: 500,
};

/** How smoothly the runner slides between lanes (higher = snappier). */
export const LANE_TWEEN_SPEED = 9;

/**
 * Optional runner sprite sheet. Drop a PNG at `public${path}` (a horizontal
 * strip of equal frames) and the game animates it instead of the vector runner.
 * If the file is missing, the game silently falls back to the drawn runner.
 * See public/sprites/README.md for the spec + an AI prompt to generate it.
 */
export const RUNNER_SPRITE = {
  path: "/sprites/runner.png",
  frameWidth: 116, // per-frame size of the sheet (PixelLab export)
  frameHeight: 116,
  frameRate: 14, // animation speed (frames per second)
  scale: 1.4, // on-screen size multiplier (tune so the runner reads well)
  offsetY: 12, // vertical nudge so the feet sit on the track
};

/**
 * Phaser draws with numeric hex colors, not CSS vars. Keep these in sync with
 * the `--game-*` tokens in styles/_theme.scss.
 */
export const GAME_COLORS = {
  // Daytime athletics stadium.
  skyTop: 0x4aa3e0,
  skyHorizon: 0xcdeaf8,
  grassTop: 0x57a64e,
  grassBottom: 0x3c7d39,
  track: 0xdd7a3c, // orange tartan
  trackEdge: 0xc9692f,
  laneLine: 0xffffff,
  finish: 0xffffff,
  // Actors.
  runner: 0xffd166,
  runnerOutline: 0xffffff,
  runnerShadow: 0x000000,
  energy: 0x4ade80,
  poison: 0xc084fc,
  goodFood: 0x37c871,
  junkFood: 0xb44ce0,
  toast: 0xfff3d6,
  hudPanel: 0x0b1020,
};

/**
 * Food is drawn as an emoji on a colored halo so good vs junk is obvious at a
 * glance (icon + color, not color alone). ⚡ = energy (Lightning theme).
 */
export const FOOD_ICONS = {
  good: "⚡",
  junk: "🍔",
};
