# Fabricio fork changes

This fork is `Fabricio333/bitbybit-run`, based on `bitbybit-ar/bitbybit-run`.

## Deployment

- Production checkout: `/root/bitbybit-run`
- PM2 app: `bitbybit-run`
- Local port: `3018`
- Public working URL: `https://run.fabri.lat/demo`
- `run.fabriok.ar` was requested originally, but DNS did not resolve from this server during deployment checks.

## Important fork-only changes

### Local production support

- Added support for local PostgreSQL deployment.
- Fixed Nostr auth validation to use the public proxy URL correctly.

### Mobile-first runner / PWA experience

The original app behaved like a desktop site squeezed onto a phone. The fork turns the runner routes into a real mobile/PWA game view.

Key changes:

- Added a 3-lane mobile/PWA runner experience.
- Made `/demo` and `/play` use a shared fullscreen game shell.
- On mobile, the game owns the viewport:
  - `100dvh`/`100vw` game surface
  - no accidental page scroll
  - no wasted header/footer/ads space
  - route chrome hidden where it breaks gameplay
- Kept desktop behavior separate after the first mobile pass:
  - desktop keeps keyboard-first controls
  - desktop keyboard legend stays visible
  - desktop route chrome/layout is preserved where appropriate
  - mobile fullscreen rules are scoped to mobile breakpoints

### Touch controls and restart UX

- Mobile movement is swipe/gesture-first.
- Removed unnecessary movement overlay buttons.
- Kept explicit boost/power buttons for thumb-friendly discrete actions.
- Enlarged mobile action buttons.
- Fixed the end-state copy from desktop-only `press R to race again` to mobile-appropriate tap-to-restart copy.
- Wired tap on the game canvas to restart after a finished race.
- Preserved desktop keyboard restart with `R`.

### Camera / track feel

Several commits tune the pseudo-3D runner camera so mobile feels closer and more playable:

- Flattened the track camera angle.
- Zoomed/flattened game camera.
- Kept the runner visible after camera zoom.
- Adjusted track projection constants so the road appears closer and wider on mobile.

### PWA/cache correctness

- Bumped/updated service worker cache behavior.
- Prevented stale cached `/demo` route shells and framework assets from making the installed PWA show old UI after deploys.
- Verified the public `sw.js` during deployment checks.

### Regression protection

Added/extended UI regression tests covering:

- mobile fullscreen/no-scroll route shell
- route chrome hidden on game routes where needed
- mobile restart copy/input behavior
- boost/power buttons without movement overlays
- desktop preservation after mobile fixes
- service worker stale-cache prevention

## Local fork commits before upstream multiplayer sync

The important fork commits include:

- `60f4bf7 chore: support local postgres deployment`
- `bb837c4 fix: validate nostr auth against public proxy URL`
- `f7067b1 Add 3-lane mobile PWA runner`
- `8260fac fix: make runner mobile-first vertical UI`
- `d64d021 fix: make mobile game view fill screen`
- `104b7a7 fix: hide ads on mobile game routes`
- `23cb9f9 fix: make game routes fullscreen`
- `ba8d504 fix: restart game by tapping canvas`
- `462291b fix: share fullscreen game shell`
- `6017cb9 fix: flatten track camera angle`
- `779a55b fix: prevent stale cached demo page`
- `a36c4c9 fix: zoom and flatten game camera`
- `bc1b1b0 fix: enlarge mobile action buttons`
- `77a77ff fix: keep runner visible after camera zoom`
- `fe48a69 fix: scope fullscreen game UI to mobile`
- `0aa7c39 fix: hide touch overlays on desktop`

## Upstream multiplayer changes to merge

As of the sync audit, upstream `bitbybit-ar/bitbybit-run` had new multiplayer work not yet in the fork, including:

- lobby browser to discover and join open matches
- auto-start when lobby reaches 4/4 players
- hiding already-started matches from the browser
- finished-match persistence for leaderboard/history
- end-of-match results screen
- zap-the-winner flow with amount/message picker
- multiplayer integration tests

## Sync requirement

When updating this fork from upstream, preserve the fork's mobile/PWA runner UX and deployment support. The upstream multiplayer features should be merged into the fork without regressing:

- mobile `/demo` and `/play` fullscreen behavior
- swipe/tap controls and tap-to-restart
- desktop keyboard controls and keyboard legend
- service worker stale-cache safeguards
- PM2/local production deployment on port `3018`
