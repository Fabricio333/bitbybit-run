/**
 * Playable character catalog. Each entry points at an assembled sprite sheet in
 * `public/sprites/` (a horizontal strip of `frames` frames). Frame sizes differ
 * per character because PixelLab exports at slightly different sizes.
 *
 * Raw per-character frames live in `assets/characters/<id>/` (north / south /
 * rotations) and are stitched into these sheets — see docs/CHARACTERS.md.
 */

export type CharacterId = "default" | "female" | "trex" | "coin";

export type Character = {
  id: CharacterId;
  label: string;
  /** Back-facing run sheet (used in-game). */
  sheet: string;
  /** Front-facing run sheet (used in the UI, e.g. the landing). */
  southSheet: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Lane this character starts in (0-indexed; painted as `startLane + 1`).
   *  Each character owns a lane: Sprinter 1, Barbie 2, T-Rex 3, Bitcoin 4. */
  startLane: number;
  /** Accent color for this character's lane in the selection lobby (decorative,
   *  theme-independent). Drives the lane badge + claimed-card highlight. */
  laneColor: string;
};

export const CHARACTERS: Character[] = [
  {
    id: "default",
    label: "Sprinter",
    sheet: "/sprites/runner.png",
    southSheet: "/sprites/runner-south.png",
    frameWidth: 116,
    frameHeight: 116,
    frames: 8,
    startLane: 0, // lane 1
    laneColor: "#f5a524", // amber
  },
  {
    id: "female",
    label: "Barbie",
    sheet: "/sprites/runner-female.png",
    southSheet: "/sprites/runner-female-south.png",
    frameWidth: 124,
    frameHeight: 124,
    frames: 8,
    startLane: 1, // lane 2
    laneColor: "#ff5fa2", // pink
  },
  {
    id: "trex",
    label: "T-Rex",
    sheet: "/sprites/runner-trex.png",
    southSheet: "/sprites/runner-trex-south.png",
    frameWidth: 120,
    frameHeight: 120,
    frames: 8,
    startLane: 2, // lane 3
    laneColor: "#3fb950", // green
  },
  {
    id: "coin",
    label: "Bitcoin",
    sheet: "/sprites/runner-coin.png",
    southSheet: "/sprites/runner-coin-south.png",
    frameWidth: 112,
    frameHeight: 112,
    frames: 8,
    startLane: 3, // lane 4
    laneColor: "#f7931a", // bitcoin orange
  },
];

export const DEFAULT_CHARACTER = CHARACTERS[0];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? DEFAULT_CHARACTER;
}
