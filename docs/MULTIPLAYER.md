# 🏁 Multiplayer — lobby flow & testing

How a live race is set up, and — importantly — **how to test it locally with
more than one player**. For the transport-level design (Nostr event kinds,
relays, the state machine) see [ARCHITECTURE.md](ARCHITECTURE.md) §4.

## Lobby flow

There is no game server. Each peer announces its own seat on the relays and
every client aggregates those presences into the roster.

1. **Host** opens the races browser and presses **Create race** (hosts a new
   match) or **Join** on an open one.
2. Pick a runner — each character owns a lane (Sprinter 1 … Bitcoin 4).
3. The **host** presses **"Crear carrera" / "Create race"**. This publishes the
   match and reveals the **invite link** — so a link can never be shared for a
   match that doesn't exist yet.
4. Others open the invite link (or Join from the browser) and pick a runner.
   They see **"Esperando al anfitrión… / Waiting for the host…"**.
5. The host presses **"Comenzar carrera" / "Start race"** to start with whoever
   is in, or the match **auto-starts at 4/4**. **"Volver / Back"** leaves the
   match.

A joiner whose invite link never yields any presence (a dead/expired link) sees
a **"race not found"** message with a way back to the browser instead of waiting
on an empty lobby.

## Testing multiplayer locally

> [!IMPORTANT]
> Everything in a match is keyed by the player's **Nostr pubkey** — the roster
> seat, the live runner state, and the finish record. Two browser tabs that
> share the same login share the same pubkey, so the match treats them as **one
> player** (the second selection overwrites the first, runner frames collide,
> etc.). To test a real 2+ player match you need **two distinct identities**.

Do this:

1. **Use two separate browser sessions** that don't share cookies/storage:
   - two different browser **profiles**, or
   - one normal window + one **incognito/private** window, or
   - two different browsers (e.g. Chrome + Firefox).
2. **Sign in with a different Nostr account in each** (a different nsec / NIP-07
   key / NIP-46 bunker per session). Same account in both = same pubkey = one
   player.
3. In session A: Create race → pick a runner → **Create race** → copy the invite
   link. In session B: open that link → pick a runner. A starts the race.
4. The relays are **public** (`wss://relay.damus.io`, `nos.lol`,
   `relay.primal.net`), so both sessions sync over the internet — testing on
   `localhost` is fine, no local relay needed.

Two tabs in the **same** session fall back to a local single-player lobby when
no live signer is present, which is also useful for solo iteration — but it is
**not** a multiplayer test.

## Note on the "shared restart" (poison → bathroom)

Eating too much junk fills the poison bar; at max the runner takes a **bathroom
break** — back to the start line. This reset is **per-player and entirely
local**: it changes only that client's own runner and **emits no event**, so one
player's bathroom break cannot reset another's race.

Because the track is **deterministic** (the same food sits at the same spots for
everyone), two players running similar lines will eat the same junk and may hit
the bathroom at nearly the same time — which can look causal but isn't.

The one code-level way a race could appear to "restart" is the Phaser game being
rebuilt by React. The live-match snapshot updates ~5 Hz, so `GameCanvas` is
deliberately built to **only** (re)create the game when the locale or chosen
character changes — never on an ordinary re-render (it depends on stable
primitives and reads everything else via refs). If you ever do observe a genuine
shared restart, capture both clients' console logs around the moment and check
whether the canvas remounts.
