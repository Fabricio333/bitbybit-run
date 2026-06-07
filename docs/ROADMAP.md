# 🗺️ Roadmap — Bit by Bit Run

**Context:** solo developer, ~3 weeks. Today is **Jun 3**. The real deadline is
the **pitch on Jun 23**; prizes are announced **Jun 30**.

**Strategy:** build the game **single-player first** so it _feels_ good, then
layer multiplayer, then the hackathon-specific integrations. Ship a polished
small thing rather than a broken big thing.

---

## Phase 1 — Playable core (single-player) 🎯 _most important_

**Goal:** one runner on the track, the full energy/poison/food loop feels fun.

- [x] Scaffold Next.js 16 app + Phaser canvas (client-only mount)
- [x] Project conventions from `bitbybit-cursats` (SCSS tokens, i18n, theme)
- [x] Define the static `TRACK` data model (lanes, length, food positions)
- [x] Render the 2.5D behind-runner view (sprite scaling = fake depth)
- [x] Keyboard controls: lane change, accelerate, brake
- [x] Energy bar: fill on good food, spend on sprint, slow at zero
- [x] Poison bar: fill on junk food, "bathroom break" → restart on full
- [x] Finish line + win detection + points tally
- [x] HUD: energy, poison, position, points
- [x] Finish overlay (single-player time/score + restart)
- [ ] Tune the feel: speeds, energy drain, food spacing (playtest pass)
- [ ] Tiny sprites/art instead of plain circles (optional polish)

**Milestone (≈ Jun 10): the game is fun solo.** — core loop playable ✅,
feel-tuning pending.

## Phase 2 — Multiplayer + Nostr + leaderboard 🏆 _scores the hackathon_

**Goal:** real matches between real people, identity, and a saved ranking.

- [x] Nostr login — full sign-in ported from cursats (NIP-07 extension, NIP-46
      bunker/QR/Amber, nsec, create-identity) + JWT session + Neon `users` table.
      See [AUTH.md](AUTH.md). (Needs `DATABASE_URL` + `AUTH_SECRET` to run.)
- [ ] Lobby: publish/discover matches via kind `30078` (`t = bitbybit-run`)
- [ ] Create match / join match; host start button + auto-start at 4/4
- [ ] Synced countdown via `startAt` (kind `21001`)
- [ ] Broadcast own runner state at ~5 Hz (kind `21000`); interpolate others
- [ ] Minimap showing all runners' positions
- [ ] Finish events (kind `21002`); resolve winner + final standings
- [ ] Neon + Drizzle: persist `Match` / `Result`; global leaderboard page

**Milestone (≈ Jun 18): 2–4 players can race and the leaderboard updates.**

## Phase 3 — Lightning + polish ⚡ _differentiators_

**Goal:** the "zaps" theme + a demo-ready feel.

- [ ] Results screen: show winner `lud16` + **⚡ Zap winner** (WebLN)
- [ ] Landing page (100vh) + Rules & demo page
- [ ] Visual/audio polish, tiny sprites, juice (tweens, particles)
- [ ] Test with 4 real players; tune relay throttling & interpolation
- [ ] Record the pitch demo

**Milestone (≈ Jun 22): demo-ready for the Jun 23 pitch.**

---

## Scope guardrails (solo, 3 weeks)

- ✅ In scope: 2.5D **fake** depth, manual zap, client-authoritative runners,
  static track, public relays.
- 🚫 Out of MVP scope (future work): real 3D, Colyseus/authoritative server,
  automated NWC payouts, betting pots, randomized tracks, mobile controls.

## Risk register

| Risk                                        | Likelihood | Mitigation                                                                    |
| ------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Public relays rate-limit / lag at 4 players | Low        | 4-player cap keeps fan-out low (~15 ev/s/client); throttle ~5 Hz, tiny payloads, multi-relay, interpolate |
| 2.5D rendering eats too much time           | Medium     | Fall back to clean top-down 2D; the loop matters more than the look           |
| Multiplayer netcode slips                   | Medium     | Phase 1 is fun solo; multiplayer is additive, not blocking                    |
| Lightning/WebLN flakiness in demo           | Low        | It's manual & optional; pre-test wallets; have a fallback screenshot          |
| Doing too much solo                         | High       | Cut ruthlessly to the Phase-1/2 core; Phase 3 is bonus                        |

## Definition of done for the pitch

A spectator can: open the landing → log in with Nostr → create/join a match →
race with at least one other player → see the ranking → see it saved on the
global leaderboard → zap the winner. That single flow, working end-to-end, is the
pitch.
