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
  },
  {
    id: "female",
    label: "Barbie",
    sheet: "/sprites/runner-female.png",
    southSheet: "/sprites/runner-female-south.png",
    frameWidth: 124,
    frameHeight: 124,
    frames: 8,
  },
  {
    id: "trex",
    label: "T-Rex",
    sheet: "/sprites/runner-trex.png",
    southSheet: "/sprites/runner-trex-south.png",
    frameWidth: 120,
    frameHeight: 120,
    frames: 8,
  },
  {
    id: "coin",
    label: "Bitcoin",
    sheet: "/sprites/runner-coin.png",
    southSheet: "/sprites/runner-coin-south.png",
    frameWidth: 112,
    frameHeight: 112,
    frames: 8,
  },
];

export const DEFAULT_CHARACTER = CHARACTERS[0];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? DEFAULT_CHARACTER;
}
