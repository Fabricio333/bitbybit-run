# 📝 Changelog

All notable changes to **Bit by Bit Run** (project & documentation) are recorded
here. Format loosely based on [Keep a Changelog](https://keepachangelog.com/).
Dates use `YYYY-MM-DD`.

## [Unreleased]

### Added

- **Runner-select lobby UI.** The character picker now reads as a 4-lane starting
  grid (UI only — no realtime sync yet; wired to local/mock state, ready for the
  Nostr lobby layer): numbered, color-accented lanes; hovering a runner flips it
  to its **back-facing** sprite (lined up at the blocks); claiming a lane swaps
  the character name for the player's **display name** (animated chip with Nostr
  avatar + "You" badge); open lanes show a dimmed/idle sprite; a `x/4` runner
  counter and a **Claim → Ready → Start** action flow. `RunnerSprite` gained a
  `facing` ("front" | "back") and `idle` prop; each `Character` gained a
  `laneColor`. `/play` passes the signed-in user's `display_name`/`avatar_url`.
- **Multiplayer foundation (Phase 2 groundwork).** The serverless realtime
  layer from `ARCHITECTURE.md §4` now exists in code — no UI yet, fully
  unit-tested. New `lib/multiplayer/`:
  - `transport.ts` — a thin `Transport` interface (publish/subscribe) with two
    implementations: `nostr-transport.ts` (public relays via `SimplePool`,
    dedupes by event id) and `memory-transport.ts` (in-process bus, makes the
    realtime contract testable with zero network).
  - `events.ts` + `lib/schemas/match.ts` — Zod-validated payloads and
    build/parse for the four event kinds (30078 discovery, 21001 control,
    21000 runner state, 21002 finish). Every inbound relay event is validated
    before it reaches state.
  - `match-state.ts` — a pure reducer: roster from discovery, newest-wins
    runner merge, winner resolved by earliest finish time (claimed positions
    are never trusted).
  - `match-client.ts` — orchestrator tying transport + reducer + a
    `SignerHandle`, with ~5 Hz broadcast throttling and a synced countdown;
    plus a `useMatch` React hook (`lib/hooks/use-match.ts`).
  - DB: `matches` + `results` tables (`lib/db/schema.ts`, migration
    `drizzle/0002`) reusing the existing `users.pubkey` identity, and
    server-only persistence/leaderboard queries in `lib/multiplayer/store.ts`.
  - Tests cover the schemas, the reducer, and two `MatchClient`s converging
    over the in-memory transport (same play state, runners and winner).

### Changed (design)

- **Track reduced from 8 lanes / 8 players to 4 lanes / 4 players.** Two reasons:
  (1) **Mobile-friendly by design** — in the 2.5D behind-runner view the track
  narrows toward the horizon, and 8 lanes are unreadable/untappable in a portrait
  viewport; 4 lanes keep each lane wide enough to see and touch. (2) **Lighter
  realtime layer** — runner-state fan-out over public Nostr relays grows ~N², so
  4 players cut received traffic from ~35 to ~15 events/s per client (~¼ of the
  relay load) and downgrade the "relays rate-limit at scale" risk from Medium to
  Low. Also fewer characters/tints to design and a far more realistic playtest
  target (4 real people vs 8) before the pitch. Updated across `GAME-DESIGN.md`
  (lanes, player count, `lane 0..3`, auto-start 4/4), `ARCHITECTURE.md`
  (`TRACK.lanes: 4`, `max: 4`, `lane:0..3`), `ROADMAP.md` (milestones, playtest,
  risk register) and `CHARACTERS.md`.

### Fixed

- **Sign-out** left a valid session cookie (a bare `cookies().delete()` doesn't
  clear a `secure`/`sameSite` cookie), so the navbar showed "Login" but `/sign-in`
  bounced the user straight back. `clearSession` now overwrites the cookie with
  `maxAge: 0` + matching attributes.
- **Nostr profile fetch** (first login + "sync profile") returned empty because
  the configured relays (damus/primal/nostr.band) frequently EOSE with no kind:0
  event. Switched to a metadata-reliable relay set (purplepag.es + nos.lol first)
  and raised the query timeout 3s→6s, so name/avatar/lightning actually populate.
- **Game restart** left the food bubbles invisible: `resetRace()` didn't clear
  the `resolved` set, so the whole track stayed "already eaten". Cleared on reset.

### Changed

- **/play** no longer shows the "change runner" button — the runner is locked
  once the race starts (pick it before starting). Sign-in method/extension
  descriptions use the body font in natural case (not the pixel/uppercase Button
  style) for legibility.

### Added (account)

- **Nostr profile in the navbar**: once signed in, the Login button is replaced
  by the user's **Nostr avatar** (kind:0 `picture`, with a 🏃 runner fallback)
  which opens a small menu — display name, **lightning address** (`lud16`, for
  zaps), **"Sync profile from Nostr"**, and sign out. No full settings page; the
  sync action re-fetches kind:0 and overwrites name/avatar/lightning so the row
  tracks Nostr. New `lud16` column on `users` (migration `0001`), persisted on
  first login and on sync; `avatar_url` + `lud16` now travel in the session
  (`/api/auth/session`, layout `initialSession`). New `POST /api/auth/sync-profile`.

### Changed (login + UI polish)

- **Login page**: removed the "Back to home" link; method **descriptions**
  ("Paste your nsec directly", …) now use the body font (the pixel font wasn't
  legible at that size).
- **Modal** restyled to the platform arcade look: hard border + hard offset
  block (theme-aware `--arcade-edge`), small radius, pixel display-font title.
- **Game header** (play + demo) restyled to arcade: a pixel "back key", phase
  label, and the sound toggle pinned right (both as arcade keycaps). The demo's
  back key navigates to **/how-to-play**.
- **How-to-play**: Energy title uses 🔋, Zap-the-winner uses ⚡, and the score
  chips render their numbers in the body font (legible).
- **Buttons** are now uppercase platform-wide. Landing tagline title-cased
  ("Run, Eat, Win"); landing CTAs reordered to **How to play** (left) · **Play**
  (right).

### Added

- **`CONTRIBUTING.md`** — contribution guide: local dev, change/commit/PR
  conventions, code of conduct, vulnerability reporting, and the security
  hardening currently in place vs. still pending. Root-level.
- **Test script split** — `test:unit`, `test:integration`
  (`--passWithNoTests`), and `test:db:migrate` (migrates against `.env.test`)
  in `package.json`, backing the parallel CI jobs.

### Changed

- **README** rewritten — spoiler-free intro plus Stack / Quick start /
  Documentation / Sister projects / License sections (Cost: $0 kept).

- **Fake ads on mobile + every route** — the spam ads are no longer desktop-only
  or hidden over the game. Below the `1280px` side-rail breakpoint a single ad
  now **floats fixed to the bottom of the screen** (the classic annoying mobile
  web banner: horizontal layout, "Ad" badge, X to close, slide-up/down
  animations, `prefers-reduced-motion` aware), drawing from the same pool and
  dismissal logic as the desktop columns (so they never appear at once). The
  route exclusion was dropped, so ads also show on `/play` and `/demo` (columns
  on desktop, banner on mobile). Files: `components/layout/fake-ads/`.
- **Demo "watch an ad to continue" interstitial** — tapping **"Seguir jugando"**
  after a demo race now opens a full-screen fake interstitial (random ad, loud
  arcade card) with a bogus **"Skip ad in 5s"** countdown that gates the close
  button; only at zero does the ✕ unlock. Dismissing it ends the round and
  **starts a fresh race** (remounts `GameCanvas` via a bumped `runId` key).
  Tapping the ad routes to its `/gotcha/<slug>` gag page. New `fakeAds` keys
  `skipIn` / `skip` (es/en). Files: `components/game/interstitial-ad.tsx`,
  `components/game/play-stage.tsx`.

- **Free demo mode** (`/demo`): single-player race with the Sprinter (no
  character picker, no login). Crossing the finish line opens a modal inviting
  the player to sign in to compete for zaps (returns to `/play` after login).
  The game now surfaces a finish event to React via an `onFinish` callback
  (`createGameConfig` → registry → `RaceScene.checkFinish`).
- **Fake margin ads (prototype)** — "spam" banners pinned to the empty desktop
  page margins, rendered once from the shared `[locale]` layout so they appear on
  every page (side columns at `1280px`+; see the mobile banner entry above for
  smaller screens). Loud arcade styling (thick block border + hard
  offset shadow, rotated blinking sticker, "Ad" badge, X to close),
  `prefers-reduced-motion` aware. Closing a banner plays a **slide-out**, then
  after a short beat a fresh ad from the pool **slides in** from the same edge
  (dismissals persist in `sessionStorage`); clearing the whole **18-ad pool**
  reveals a small reward. Each ad has a **unique URL** (`/gotcha/<slug>`) but
  they all resolve to one dynamic gag page that renders a **different
  bitcoin/nostr/lightning-scam-debunking joke per slug** (18 gags + a generic
  fallback for unknown slugs); gag CTAs only point to safe pages (home /
  how-to-play), never the game. Copy is i18n'd (`fakeAds` namespace, es/en).
  Files: `lib/fake-ads/ads.ts`, `components/layout/fake-ads/`,
  `app/[locale]/gotcha/[slug]/`.
- **Custom 404** — themed `app/[locale]/not-found.tsx` (pixel "404" + runner,
  arcade styling) plus an `app/[locale]/[...rest]` catch-all that triggers it so
  unknown localized paths render the styled 404 **inside** the layout (navbar,
  footer, providers, fonts) instead of Next's bare default. New `notFound` i18n
  namespace (es/en).

### Changed

- **`/play` now requires login** — anonymous visitors are redirected to
  `/sign-in?next=/play` (they can still try `/demo`).
- **How-to-play redesigned**: wrapped in `<Container>`, fully responsive card
  grid (3→2→1 columns) with **Framer Motion** entrance animations. Added the
  missing **Zap the winner** and **Ranking** cards; the Energy/Junk cards now
  show **per-food score chips** (💧+5 🍌+8 🧃+14 ⚡+20 / 🍩−5 🍟−8 🍔−12 🍺−16),
  and Controls use the **custom arrow-key icons** in keycaps. Added an outlined
  **Demo** button beside **Play now**.
- **Locale**: disabled `Accept-Language` auto-detection (`localeDetection:
false`) so the prefix-free default (es) always loads at the root —
  run.bitbybit.com.ar shows es; `/en/*` is the English variant via the toggle.

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
