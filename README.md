# 🏃 Bit by Bit Run

> A free, lightweight, web-based multiplayer **runner race** built for the
> [La Crypta Hackathon #4 — Gaming ("Zaps")](https://lacrypta.dev/hackathons/zaps).

Up to **8 runners** race down an athletics track. Grab the **good food** at the
hydration stations to fill your **energy bar** and sprint past your rivals — but
dodge the **junk food**, or your **poison bar** fills up and you have to run to
the bathroom and start over. First across the finish line wins, and the winner
can get **zapped** ⚡ in sats.

The whole game runs **for free on Vercel** with **no game server**: real-time
multiplayer is powered by **Nostr relays**, and persistent data lives in a free
**Neon Postgres** database.

---

## 🎯 Hackathon scoring map

This project is designed to hit all six judged topics:

| Topic                 | How we cover it                                                   |
| --------------------- | ----------------------------------------------------------------- |
| **Game Development**  | A complete 2.5D arcade runner built with Phaser                   |
| **Game Loops**        | Lobby → race → results → rematch, with an energy/poison risk loop |
| **Nostr Login**       | Sign in with your Nostr identity (NIP-07) — no email/password     |
| **Lightning Rewards** | One-click **zap the winner** via their Lightning address          |
| **Leaderboards**      | Global ranking across all matches (Neon Postgres)                 |
| **Multiplayer**       | Up to 8 live players, synced over Nostr ephemeral events          |

## 🧱 Tech stack

- **App shell:** Next.js 16 (App Router, Turbopack) — deployed free on Vercel
- **Game engine:** [Phaser](https://phaser.io) — fake-2.5D via sprite scaling
- **Styling:** SCSS modules + a CSS-variable token system (`styles/`)
- **i18n:** `next-intl` (Spanish default, English) with `[locale]` routing
- **Theme:** `next-themes` light/dark via `data-theme`
- **Realtime multiplayer:** Nostr **ephemeral events** as the transport (no server)
- **Lobby / match discovery:** Nostr **kind 30078** (NIP-33), pattern reused from
  La Crypta's [`gorilator-rpg`](https://github.com/agustinkassis/gorilator-rpg)
- **Auth:** `nostr-login` (NIP-07)
- **Database:** Neon (serverless Postgres) + Drizzle ORM
- **Payments:** manual zap via the winner's `lud16` Lightning address (WebLN)

> Repo conventions (structure, SCSS tokens, i18n, theme, tooling) follow the
> sibling **`bitbybit-cursats`** project.

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (ES default; /en for English)
```

Then open **`/play`** to try the Phase 1 single-player prototype.
Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`,
`npm run format`.

## 💸 Cost: $0

Everything runs on free tiers — Vercel (hosting), public Nostr relays
(realtime), and Neon (database). No always-on server is required. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why.

## 📚 Documentation

- [`docs/GAME-DESIGN.md`](docs/GAME-DESIGN.md) — the game: rules, mechanics, screens
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it works, free & serverless
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased plan toward the June 23 pitch

## 📅 Key dates

- **Jun 2** — registration opens
- **Jun 23** — final pitch (mentor feedback) ← real deadline
- **Jun 30** — prizes announced (1M sats total pool)

## 📄 License

MIT — see [`LICENSE`](LICENSE). Open source is encouraged by the hackathon.
