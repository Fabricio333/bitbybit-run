# Runner sprite sheet

Drop a file named **`runner.png`** in this folder and the game will animate it
instead of the built-in vector runner. If the file is missing, the game silently
falls back to the drawn runner — so the game always works.

## Current assets (already in place)

Generated with **PixelLab** (Character Creator) and assembled into horizontal
strips with `sharp`:

- **`runner.png`** — north / back-facing run (the in-game runner), 8 frames of
  **116 × 116** → 928 × 116.
- **`runner-south.png`** — south / front-facing run, used by the landing's
  CSS-animated `<RunnerSprite>`.

Config lives in `lib/game/config.ts` (`RUNNER_SPRITE`: frame size, frame rate,
scale, vertical offset). The raw PixelLab export folder is git-ignored.

## Required format

- **File:** `public/sprites/runner.png` (transparent PNG, alpha channel).
- **Layout:** a single **horizontal strip** of equal frames.
- **Frame size:** **64 × 64 px** each by default (so 8 frames → a 512 × 64
  image). Any size works — just keep `RUNNER_SPRITE.frameWidth/frameHeight` in
  sync (see below).
- **Frames:** ~6–8 frames of a back-view running cycle.
- The character is centered in each frame, feet near the bottom.

If you generate a different frame size, update `RUNNER_SPRITE.frameWidth` /
`frameHeight` (and `frameRate`) in `lib/game/config.ts` to match — the rest is
automatic (the animation uses however many frames the sheet contains).

## View & style

The game is seen **from behind the runner**, so the sprite must be a **back
view** (we see the runner's back as they run away from the camera). To match the
game: **gold/yellow sleeveless jersey, dark navy shorts, green cap.**

## AI prompt (copy into an image generator)

> Pixel-art sprite sheet of a cartoon athlete **seen from behind (back view)**,
> running away from the camera, mid run-cycle. **8 frames** laid out in a single
> **horizontal strip**, evenly spaced, each frame **128×128 px**, on a **fully
> transparent background** (PNG with alpha). The runner wears a **gold/yellow
> sleeveless running jersey, dark navy shorts, and a green cap**; arms swinging
> and legs alternating in a clear running cycle. Character centered and the same
> size in every frame, feet near the bottom. Flat colors with soft shading, a
> thick clean outline, bold and readable at small sizes. No background, no ground
> shadow, no text, no extra props. Friendly arcade / mobile-game style.

## Notes on which AI to use

Generic image models (DALL·E, Midjourney) struggle to produce **evenly-spaced,
transparent sprite sheets**. Better options:

- **Sprite-sheet / pixel-art tools:** PixelLab.ai, Scenario.gg, Layer.ai,
  Retro Diffusion — they understand frames + transparency.
- **Or** generate the **frames one by one** (same prompt, "single 128×128 frame,
  back-view run pose N of 8") and assemble them into a strip with a free tool
  (e.g. Piskel, or ImageMagick `montage`).
- **CC0 ready-made:** kenney.nl, itch.io (free), OpenGameArt — look for a
  back/top-down run cycle.
