# 📝 Changelog

All notable changes to **Bit by Bit Run** (project & documentation) are recorded
here. Format loosely based on [Keep a Changelog](https://keepachangelog.com/).
Dates use `YYYY-MM-DD`.

## [Unreleased]

### Changed (design)

- **Dark-mode arcade fix**: added an `--arcade-edge` token (dark on light /
  light on dark) so the hard border + offset shadow of buttons, cards, the
  locale/theme toggle and logo blocks stay visible on the dark background
  (neon-sticker look) instead of vanishing into it. Title text-shadows and the
  (white) polaroids keep the dark `--pixel-shadow`.
- **Landing polish**: the hero title uses the wordmark treatment (gradient
  "RUN") with the **Bitcoin "₿" as each capital B** of BitByBit (same color as
  the rest of the word — dark indigo on light, white on dark). The 4 runners sit
  inside tilted **polaroid** frames, wrapped in a reusable `<Container fill>`:
  flanking the center on desktop (≥1024px), and **2 above / 2 below** the text on
  tablet & mobile. **Framer Motion**: spring "pop" + idle wobble on the title,
  staggered entrance + idle float + hover lift/straighten on the polaroids (all
  respecting `prefers-reduced-motion`). Shorter two-line tagline ("Corré, comé,
  ganá 🏃💨 / El cardio nunca pagó tan bien. ₿"), smaller hero/tagline type on
  mobile. The **locale/theme toggle** uses the white pixel/arcade style, the
  **primary pink button** flips to white bg + pink text on hover, the footer was
  made fully responsive (centered, wrapping links on mobile), and the redundant
  "Cómo jugar" footer link was removed. `Container` gained a `fill` variant for
  single-screen pages.
- **Arcade overhaul**: new "Arcade Night" palette (indigo + pink/green/yellow,
  light variant too), **Pixelify Sans** pixel display font (titles, buttons, and
  the in-game canvas text), and **blocky arcade buttons/cards** (hard border +
  offset shadow + press). Logo blocks/wordmark recolored.
- **Landing** redesigned: shows all 4 characters with names + a humor tagline.
- **Single-screen** layout (sticky footer): landing, how-to-play, play and the
  **restyled sign-in** all fit one screen on desktop/tablet (footer included).
- **Responsive** verified on mobile + tablet (no overflow; cards reflow to 2×2,
  NIP-46 buttons stack).

### Added

- **Nostr login (Phase 2)** — ported the full sign-in system from
  `bitbybit-cursats`: `/sign-in` with all connection methods (NIP-07 extension,
  NIP-46 bunker/QR for Amber/nsec.app, raw nsec, create-new-identity),
  `SignerContext`, NIP-98 auth, JWT session (`jose`), and a **Neon + Drizzle**
  `users` table (trimmed to auth fields). Signer-aware navbar, vitest tests (55),
  `db:migrate`. Env in `.env.example`; details in [AUTH.md](AUTH.md).
- **Sound effects** — synthesized with the Web Audio API (zero assets, zero
  bytes): GO, eat good/junk, lane-change tick, a deliberately annoying **bathroom
  alarm** (dissonant detuned saws + LFO tremolo + noise splat + deflate), a
  **drunk beer wobble** (vibrato LFO), and a **finish jingle with reverb**
  (ConvolverNode). `lib/game/sound.ts` + a 🔊 mute toggle (localStorage) on `/play`.
- **Single-player depth & humor:**
  - The runner is now an **animated character** (swinging legs/arms, bob) instead
    of a circle, with a bathroom shake and a tipsy sway after beer.
  - **8 foods** (`lib/game/foods.ts`): water/banana/isotonic/gel (good) and
    donut/fries/burger/beer (junk), each with its own energy/toxicity and score.
  - **Crowd + funny signs**: bitcoiner/libertarian billboards line the track
    ("Taxation is theft, cardio is freedom", "HODL your legs"…) and a colorful
    crowd fills the stands.
  - **Varied, random eating phrases** with humor; **random bathroom lines**.
  - Beer adds a brief **drunk wobble**.
  - Longer match (track length 7500) with **many more signs & eating phrases**.
  - Bathroom break is now an **instant restart with a ~1s pause** at the start
    (start line + numbers visible again), not an animation.
  - Bigger, readable crowd signs; removed the horizon crowd; isotonic icon 🧃.
  - **Optional runner sprite sheet**: drop `public/sprites/runner.png` and the
    game animates it (Phaser anim); otherwise it falls back to the vector runner.
    See `public/sprites/README.md` for the spec + an AI prompt.
  - **Real runner sprite** (PixelLab): back-facing run cycle in the game, plus a
    front-facing CSS-animated `<RunnerSprite>` on the landing.
- `docs/CHARACTERS.md` — playable characters (PixelLab prompts/settings + the
  sprite pipeline) and `lib/game/characters.ts` — the character catalog.
- **Character selector**: a "Choose your runner" screen on `/play` (animated
  front-facing cards) → start the race as the picked character, with a "Change
  runner" link. The scene loads each character's sheet via the registry
  (`createGameConfig(..., sprite)`); `<RunnerSprite>` is now per-character.
- **Three more characters**: Barbie (`female`, 124²), T-Rex (`trex`, 120²) and
  the **Bitcoin coin** (`coin`, 112²) — catalogued in `lib/game/characters.ts`.
  Curated source frames live under `assets/characters/<id>/{north,south,rotations}`;
  raw root exports git-ignored. (The kawaii banana was dropped — too horizontal
  from the back.)
- **App shell & navigation:**
  - Global **Navbar** (brand logo left, locale/theme toggle + Login button right).
  - **Footer** (BitByBit RUN wordmark + links: How to play, Cursats, Habits,
    Arena, GitHub) — shown on every page except the full-screen game.
  - Shared brand components: `LogoBlocks`, `Wordmark` (gradient "RUN"), `Logo`.
  - **Locale + theme toggle** as a cursats-style segmented pill (emoji ☀️/🌙 +
    EN/ES).
  - Round, icon-only **back button** (custom arrow, no label) on the play page.
  - **How to play** page (`/how-to-play`) replacing the FAQ idea.
- **In-game localization:** the canvas text (GO!, food toasts, bathroom, FINISH)
  now follows the active locale (strings passed from React into the scene).

### Changed (UI/feel)

- The track now reaches the **horizon** and shows the **bend** (the oval curving
  away) at the far end.
- Food is rendered inside a **bubble** (translucent sphere + highlight + specular
  dot), echoing cursats' bubble surface.
- The game canvas is **vertically centered** on the play page.
- Bathroom-break toast stays on screen longer (2.4s) so it's readable.
- Track now starts at the bottom edge, with a **start line** at the beginning and
  **lane numbers 1–8 painted flat on the floor** (athletics-track reference).
- The bend now sweeps **left** and carries the lane lines into the curve.
- Brand `LogoBlocks` are vertically stacked ceramic blocks (matching cursats).
- Controls hint sits **directly under the canvas** (not pinned to the page).
- The track is now drawn as **pseudo-3D segments**: a straight that eases into a
  left curve (no kink at the junction) and tapers/fades smoothly into the
  horizon (lane lines thin + fade with distance).
- **Start line + lane numbers** are world elements at the start: only visible at
  the beginning (with an "on your marks" hold) and recede as you run, mirroring
  the finish line. Numbers are painted flat on the floor.
- Controls legend rebuilt as a component with **custom arrow-key icons** and the
  **WASD alternatives** shown.

### Added

- **First style pass** (daytime athletics look):
  - Re-skinned the track: daylight sky gradient, **orange tartan track**, **green
    grass** on the sides, white lane lines, checkered finish, runner with shadow.
  - **Food is now icons, not plain circles**: good food = ⚡ on a green halo,
    junk = 🍔 on a red halo (icon + color so good vs junk is obvious).
  - Canvas text uses the **Nunito** font (same family as `bitbybit-cursats`),
    on a translucent HUD panel with ⚡/🍔 bar labels.
  - Reusable `Button` component ported from `bitbybit-cursats` (ceramic-surface
    style) using our orange/green palette; used on the landing & play pages.
  - SCSS token system extended (accent + ceramic tints, `_common-mixins`,
    `_media-mixins`).
- **Phase 1 scaffold** — playable single-player prototype:
  - Next.js 16 (App Router, Turbopack) project following `bitbybit-cursats`
    conventions: root-level layout (no `src/`), SCSS token system under
    `styles/`, `next-intl` i18n (`[locale]` routing, ES default + EN),
    `next-themes` light/dark, ESLint/Prettier/EditorConfig.
  - Phaser game (`lib/game/`): fake-2.5D track, 8 lanes, keyboard controls
    (lane change / sprint / brake), energy & poison bars, fixed-position food,
    bathroom-break restart, finish line, points, and a finish overlay.
  - `components/game/game-canvas.tsx` mounts Phaser client-side only.
  - Verified: `typecheck`, `build`, and route smoke test (ES/EN) all pass.
- Initial project documentation:
  - Root `README.md` — overview, tech stack, hackathon scoring map.
  - `docs/GAME-DESIGN.md` — game concept, rules, mechanics, screens, match flow.
  - `docs/ARCHITECTURE.md` — serverless free architecture (Next.js + Phaser,
    Nostr transport, kind 30078 discovery, Neon Postgres, manual Lightning zaps).
  - `docs/ROADMAP.md` — 3-phase plan toward the Jun 23 pitch with risk register.
  - `docs/README.md` — documentation index.
  - `docs/CHANGELOG.md` — this changelog.

### Changed

- Tuned race feel: faster speeds (base 130 → 180) and track length retuned to
  4500 (was 1500 → too short, then 6000 → too slow). Energy starts at 50%.
- Removed the duplicated in-canvas controls hint (kept the translated one below).
- Static backdrop is drawn once; only moving pieces redraw each frame.

### Decided

- Game concept: 8-lane athletics runner race with an energy/poison food loop.
- View: 2.5D behind-the-runner (faked via sprite scaling in Phaser).
- Architecture A (lightweight & free): Phaser + Nostr ephemeral events as the
  realtime transport, no dedicated game server.
- Persistence: Neon Postgres + Prisma for leaderboard & match history.
- Lightning rewards: manual zap of the winner via their `lud16` address.

---

_Changelog started 2026-06-03._
