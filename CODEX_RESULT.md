# Upstream multiplayer sync result

- Upstream merged: `cfc0bf9b8d65404bc94e77956a1296a26c9a2b12` (`upstream/main`).
- Merge strategy: manual fork sync from Codex output, with follow-up correction from Topolino to preserve the fork `/demo` gameplay contract.

## Conflicts / fork-preservation decisions

- `app/[locale]/play/page.tsx`: kept fork `GameRouteShell` and mobile-hidden header; added upstream authenticated `currentUser` for multiplayer lobby.
- `components/game/play-stage.tsx`: `/demo` stays local/single-player and uses the fork runner component with `laneCount={LANES}`. Competitive `/play` can use upstream multiplayer and opts into `MULTIPLAYER_LANES` only when an actual multiplayer race is active.
- `components/game/game-canvas.*`: kept fork fullscreen portrait canvas, swipe/tap restart dispatcher, and mobile boost/power buttons; added optional `RaceNet` plus optional `laneCount`.
- `components/game/game-controls.tsx`: kept desktop keyboard legend for lanes/jump/duck/boost/power/restart; added compact mobile gesture hints.
- `lib/game/config.ts`: restored fork `LANES = 3` for the demo/local runner and added `MULTIPLAYER_LANES = 4` for upstream multiplayer capacity.
- `lib/game/scenes/race-scene.ts`: combined upstream race networking/remotes/minimap/finish publishing with fork mobile camera, runner actions, power-ups, boost/power, and solo tap-to-restart. Scene lane count is runtime-configurable so `/demo` remains 3-lane while multiplayer can be 4-lane.
- `lib/multiplayer/types.ts` and `lib/schemas/match.ts`: multiplayer validation/capacity uses `MULTIPLAYER_LANES`, not the fork local `LANES`.
- `messages/en.json`, `messages/es.json`: combined multiplayer lobby/results/zap strings with fork controls/settings/restart copy.
- `tests/unit/ui/mobile-layout.test.ts`: added regression protection that `/demo` stays three-lane/local and mobile controls remain swipe + boost/power.

## Verification

- `npm test -- tests/unit/ui/mobile-layout.test.ts`: passed, 14 tests.
- `npm run typecheck`: passed.

Full final verification is run from the deployment checkout after this sync commit is applied: targeted multiplayer tests, lint, typecheck, build, PM2 restart, local smoke, public smoke.

## Manual inspection before deploy

- Smoke-test `/demo` specifically: should be the same fork mobile component/feel, 3 lanes, no multiplayer lobby/browser, swipe movement, boost/power buttons, tap restart.
- Smoke-test `/play` multiplayer separately: discovery/join, 4/4 auto-start, results, leaderboard/history persistence, zap winner flow.
