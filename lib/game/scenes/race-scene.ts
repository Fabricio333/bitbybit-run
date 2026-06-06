import * as Phaser from "phaser";
import {
  LANES,
  VIEW,
  SPEED,
  ENERGY,
  POISON,
  POINTS,
  LANE_TWEEN_SPEED,
  GAME_COLORS,
  FOOD_ICONS,
  RUNNER_SPRITE,
  TRACK_DRAW_DISTANCE,
} from "../config";
import { TRACK, SIGNS, type FoodItem } from "../track";
import { FOODS } from "../foods";
import { Sound } from "../sound";

/**
 * RaceScene — Phase 1, single-player.
 *
 * Fake-2.5D daytime athletics track. The player runs at the bottom edge
 * (distance d = 0) and the world scrolls toward them; everything "ahead" is
 * projected toward a vanishing point near the horizon. The straight runs from
 * the bottom up, then curves left and tapers to the horizon. Funny bitcoiner
 * signs line the track. No 3D, no image assets.
 */

const NEAR = 230; // perspective strength (bigger = flatter)
const VIEW_DISTANCE = 750; // how far ahead food/signs are rendered
const HIT_LANE_TOLERANCE = 0.5; // how close to a lane center counts as "in it"
const FOOD_POOL_SIZE = 20; // reusable emoji slots for visible food
const SIGN_POOL_SIZE = 6; // reusable billboards for visible signs
const START_LINE_WORLD = 0; // start line at the very start of the race
const NUMBERS_WORLD = 22; // lane numbers painted just past the start line
const START_HOLD = 1.2; // seconds the runner waits at the start ("on your marks")
const TRACK_STEP = 25; // marching step for the pseudo-3D track segments
const TRACK_BEND_START = 900; // distance where the track begins to curve
const TRACK_BEND_AMOUNT = -230; // max horizontal shift in px (negative = left)

type Projected = { x: number; y: number; s: number };

export type GameStrings = {
  go: string;
  finish: string;
  again: string;
  goodPhrases: string[];
  badPhrases: string[];
  bathrooms: string[];
  signs: string[];
};

const DEFAULT_STRINGS: GameStrings = {
  go: "GO!",
  finish: "🏁 FINISH!",
  again: "press R to race again",
  goodPhrases: ["yum! 😋", "pure energy ⚡"],
  badPhrases: ["ugh, bad idea 🤢"],
  bathrooms: ["🚽 Bathroom break!"],
  signs: ["PROOF OF RUN"],
};

export class RaceScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics; // static backdrop (drawn once)
  private world!: Phaser.GameObjects.Graphics; // food bubbles, signs, finish
  private runnerG!: Phaser.GameObjects.Graphics; // runner shadow + vector fallback
  private runnerSprite?: Phaser.GameObjects.Sprite; // used when a sheet is present
  private useSprite = false;
  private spriteKey = RUNNER_SPRITE.path; // texture key for the chosen character
  private hud!: Phaser.GameObjects.Graphics;

  private statusText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private foodPool: Phaser.GameObjects.Text[] = [];
  private startNumbers: Phaser.GameObjects.Text[] = [];
  private signPool: Phaser.GameObjects.Text[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  // Fonts (pulled from the CSS variables set by next/font).
  private fontBody = '"Nunito Sans", sans-serif';
  private fontDisplay = '"Nunito", sans-serif';

  // Localized in-game strings (handed in via the game registry).
  private strings: GameStrings = DEFAULT_STRINGS;

  // Player state.
  private now = 0; // last frame timestamp (ms)
  private playerDistance = 0; // 0..TRACK.length
  private playerLane = (LANES - 1) / 2; // fractional, tweened
  private targetLane = Math.round((LANES - 1) / 2);
  private energy = ENERGY.start;
  private poison = 0;
  private points = 0;
  private elapsed = 0; // seconds since GO
  private finished = false;
  private startHold = START_HOLD; // "on your marks" pause before the runner moves
  private drunkTimer = 0; // >0 while wobbling after a beer

  // Per-food "already resolved" flags (consumed or passed).
  private resolved = new Set<string>();

  // Layout (computed in create()).
  private horizonY = 0;
  private bottomY = 0;
  private laneSpacing = 0;
  private toastTimer = 0;

  constructor() {
    super({ key: "RaceScene" });
  }

  preload() {
    // Load the chosen character's sprite sheet (set in preBoot). A 404 just
    // means we fall back to the vector runner — swallow the load error.
    this.load.on("loaderror", () => {});
    const ch = this.registry.get("character") as
      | { sheet: string; frameWidth: number; frameHeight: number }
      | undefined;
    this.spriteKey = ch?.sheet ?? RUNNER_SPRITE.path;
    this.load.spritesheet(this.spriteKey, this.spriteKey, {
      frameWidth: ch?.frameWidth ?? RUNNER_SPRITE.frameWidth,
      frameHeight: ch?.frameHeight ?? RUNNER_SPRITE.frameHeight,
    });
  }

  create() {
    const { width, height } = this.scale;
    this.horizonY = height * 0.32;
    this.bottomY = height; // track starts at the very bottom edge
    this.laneSpacing = width * 0.118;

    this.readFonts();
    const s = this.registry.get("strings") as GameStrings | undefined;
    if (s) this.strings = s;

    // Static backdrop (sky, grass, crowd, orange track, lane lines).
    this.bg = this.add.graphics().setDepth(0);
    this.drawBackground();
    this.createStartMarkers();
    this.createSignMarkers();

    this.world = this.add.graphics().setDepth(1);

    // Reusable emoji slots for food.
    for (let i = 0; i < FOOD_POOL_SIZE; i++) {
      const txt = this.add
        .text(0, 0, "", { fontSize: "28px" })
        .setOrigin(0.5)
        .setDepth(2)
        .setVisible(false);
      this.foodPool.push(txt);
    }

    this.runnerG = this.add.graphics().setDepth(3);

    // If the sprite sheet loaded, build the run animation + sprite; otherwise
    // we keep using the drawn vector runner.
    if (this.textures.exists(this.spriteKey)) {
      this.useSprite = true;
      if (!this.anims.exists("run")) {
        this.anims.create({
          key: "run",
          frames: this.anims.generateFrameNumbers(this.spriteKey, {}),
          frameRate: RUNNER_SPRITE.frameRate,
          repeat: -1,
        });
      }
      this.runnerSprite = this.add
        .sprite(0, 0, this.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(3)
        .setVisible(false);
    }

    this.hud = this.add.graphics().setDepth(8);

    this.statusText = this.add
      .text(24, 20, "", {
        fontFamily: this.fontBody,
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setDepth(10);

    this.toastText = this.add
      .text(width / 2, height * 0.4, "", {
        fontFamily: this.fontDisplay,
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#0b1020",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Static bar labels (energy / poison) so each bar is self-explanatory.
    this.add.text(24, 41, FOOD_ICONS.good, { fontSize: "16px" }).setDepth(10);
    this.add.text(24, 65, FOOD_ICONS.junk, { fontSize: "16px" }).setDepth(10);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys("W,A,S,D,R") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.resetRace();
  }

  private readFonts() {
    if (typeof document === "undefined") return;
    const css = getComputedStyle(document.documentElement);
    const body = css.getPropertyValue("--font-body").trim();
    const display = css.getPropertyValue("--font-display").trim();
    if (body) this.fontBody = `${body}, "Nunito Sans", sans-serif`;
    if (display) this.fontDisplay = `${display}, "Nunito", sans-serif`;
  }

  /** Lane-number labels (1..8), positioned every frame by updateStartArea. */
  private createStartMarkers() {
    for (let i = 0; i < LANES; i++) {
      const txt = this.add
        .text(0, 0, String(i + 1), {
          fontFamily: this.fontDisplay,
          fontSize: "40px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#c9692f",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setVisible(false);
      this.startNumbers.push(txt);
    }
  }

  /** Reusable billboards for the crowd signs, positioned by updateSigns. */
  private createSignMarkers() {
    for (let i = 0; i < SIGN_POOL_SIZE; i++) {
      const txt = this.add
        .text(0, 0, "", {
          fontFamily: this.fontBody,
          fontSize: "24px",
          color: "#1a1a2e",
          backgroundColor: "#ffe3a3",
          align: "center",
          fontStyle: "bold",
          padding: { x: 10, y: 8 },
          wordWrap: { width: 240 },
        })
        .setOrigin(0.5, 1)
        .setDepth(2)
        .setVisible(false);
      this.signPool.push(txt);
    }
  }

  private resetRace() {
    this.playerDistance = 0;
    this.playerLane = (LANES - 1) / 2;
    this.targetLane = Math.round((LANES - 1) / 2);
    this.energy = ENERGY.start;
    this.poison = 0;
    this.points = 0;
    this.elapsed = 0;
    this.finished = false;
    this.startHold = START_HOLD;
    this.drunkTimer = 0;
    this.toastText.setText("");
    this.toastTimer = 0;
    // Forget which foods were eaten/passed so the bubbles render again
    // on the fresh run (otherwise the whole track stays "resolved").
    this.resolved.clear();
  }

  private pick(arr: string[]): string {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Project a point at distance `d` ahead, in `lane`, to screen space. */
  private project(d: number, lane: number): Projected {
    const s = NEAR / (NEAR + Math.max(0, d));
    const y = this.horizonY + (this.bottomY - this.horizonY) * s;
    const x =
      this.scale.width / 2 + (lane - (LANES - 1) / 2) * this.laneSpacing * s;
    return { x, y, s };
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;
    this.now = time;

    if (this.finished) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.resetRace();
    } else if (this.startHold > 0) {
      // "On your marks" — hold at the start so the start line + lane numbers
      // are visible before the runner takes off.
      this.startHold -= dt;
      if (this.startHold <= 0) {
        this.showToast(this.strings.go, 0.7);
        Sound.go();
      }
    } else {
      this.handleInput();
      this.updateMovement(dt);
      this.resolveFood();
      this.updatePoison(dt);
      if (this.drunkTimer > 0) this.drunkTimer -= dt;
      this.checkFinish();
      this.elapsed += dt;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastText.setText("");
    }

    this.drawWorld();
    this.updateSigns();
    this.updateStartArea();
    this.drawRunner();
    this.drawHud();
  }

  private handleInput() {
    const leftDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
      Phaser.Input.Keyboard.JustDown(this.keys.A);
    const rightDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
      Phaser.Input.Keyboard.JustDown(this.keys.D);

    if (leftDown) {
      this.targetLane = Math.max(0, this.targetLane - 1);
      Sound.lane();
    }
    if (rightDown) {
      this.targetLane = Math.min(LANES - 1, this.targetLane + 1);
      Sound.lane();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.resetRace();
  }

  private updateMovement(dt: number) {
    // Smoothly slide toward the target lane.
    this.playerLane +=
      (this.targetLane - this.playerLane) * Math.min(1, dt * LANE_TWEEN_SPEED);

    const accelerating = this.cursors.up.isDown || this.keys.W.isDown;
    const braking = this.cursors.down.isDown || this.keys.S.isDown;

    let speed = SPEED.base;
    if (braking) {
      speed = SPEED.brake;
    } else if (accelerating && this.energy > 0) {
      speed = SPEED.sprint;
      this.energy = Math.max(0, this.energy - ENERGY.drainPerSecond * dt);
    } else if (this.energy <= 0) {
      speed = SPEED.exhausted;
    }

    this.playerDistance += speed * dt;
  }

  private resolveFood() {
    const lane = Math.round(this.playerLane);
    const inLane = (f: FoodItem) =>
      Math.abs(f.lane - this.playerLane) <= HIT_LANE_TOLERANCE ||
      f.lane === lane;

    for (const f of [...TRACK.goodFood, ...TRACK.junkFood]) {
      if (this.resolved.has(f.id)) continue;
      if (f.at > this.playerDistance) continue; // not reached yet
      this.resolved.add(f.id);
      if (!inLane(f)) continue; // dodged (wrong lane)
      const def = FOODS[f.type];
      if (!def) continue;
      this.points += def.points;
      if (def.kind === "good") {
        this.energy = Math.min(ENERGY.max, this.energy + def.energy);
        this.showToast(
          `${def.icon} ${this.pick(this.strings.goodPhrases)}`,
          2.5
        );
        Sound.eatGood();
      } else {
        this.poison = Math.min(POISON.max, this.poison + def.poison);
        this.showToast(
          `${def.icon} ${this.pick(this.strings.badPhrases)}`,
          2.5
        );
        if (def.id === "beer") {
          this.drunkTimer = 1.8; // wobble!
          Sound.drunk();
        } else {
          Sound.eatJunk();
        }
      }
    }
  }

  private updatePoison(dt: number) {
    if (this.poison >= POISON.max) {
      // Bathroom break — straight back to the start, with a short pause so the
      // start line and lane numbers show again before the runner takes off.
      this.poison = 0;
      this.drunkTimer = 0;
      this.playerDistance = 0;
      this.energy = ENERGY.start;
      this.resolved.clear();
      this.startHold = 1.7;
      this.showToast(this.pick(this.strings.bathrooms), 1.7);
      Sound.bathroom();
      return;
    }
    this.poison = Math.max(0, this.poison - POISON.decayPerSecond * dt);
  }

  private checkFinish() {
    if (this.playerDistance >= TRACK.length) {
      this.finished = true;
      this.points += POINTS.finishBonus;
      Sound.finish();
      this.showToast(
        `${this.strings.finish}\n${this.elapsed.toFixed(1)}s   ${this.points} pts\n${this.strings.again}`,
        9999
      );
      // Surface the finish to React (e.g. the demo's login-invite modal).
      const onFinish = this.registry.get("onFinish") as
        | ((result: { time: number; points: number }) => void)
        | undefined;
      onFinish?.({ time: this.elapsed, points: this.points });
    }
  }

  private showToast(msg: string, seconds: number) {
    this.toastText.setText(msg);
    this.toastTimer = seconds;
  }

  // --- Rendering -----------------------------------------------------------

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  /** Static backdrop — drawn once: sky, grass, orange track, lane lines. */
  private drawBackground() {
    const { width, height } = this.scale;
    const g = this.bg;
    g.clear();

    // Sky (daylight gradient).
    g.fillGradientStyle(
      GAME_COLORS.skyTop,
      GAME_COLORS.skyTop,
      GAME_COLORS.skyHorizon,
      GAME_COLORS.skyHorizon,
      1
    );
    g.fillRect(0, 0, width, this.horizonY);

    // Grass.
    g.fillGradientStyle(
      GAME_COLORS.grassTop,
      GAME_COLORS.grassTop,
      GAME_COLORS.grassBottom,
      GAME_COLORS.grassBottom,
      1
    );
    g.fillRect(0, this.horizonY, width, height - this.horizonY);

    // March the track from the bottom to the horizon as pseudo-3D segments: a
    // straight that eases into a left curve (slope 0 at the junction → no kink)
    // and tapers smoothly toward the horizon. Food/runner stay on the straight
    // part (within VIEW_DISTANCE < TRACK_BEND_START), so they keep aligning
    // with project().
    type Seg = { s: number; y: number; cx: number };
    const segs: Seg[] = [];
    const bendSpan = TRACK_DRAW_DISTANCE - TRACK_BEND_START;
    for (let d = 0; d <= TRACK_DRAW_DISTANCE; d += TRACK_STEP) {
      let xOff = 0;
      if (d > TRACK_BEND_START) {
        const t = (d - TRACK_BEND_START) / bendSpan;
        xOff = TRACK_BEND_AMOUNT * t * t;
      }
      const s = NEAR / (NEAR + d);
      const y = this.horizonY + (this.bottomY - this.horizonY) * s;
      segs.push({ s, y, cx: width / 2 + xOff });
    }
    const edgeX = (seg: Seg, lane: number) =>
      seg.cx + (lane - (LANES - 1) / 2) * this.laneSpacing * seg.s;

    const leftEdge = segs.map((seg) => ({ x: edgeX(seg, -0.5), y: seg.y }));
    const rightEdge = segs.map((seg) => ({
      x: edgeX(seg, LANES - 0.5),
      y: seg.y,
    }));
    g.fillStyle(GAME_COLORS.track, 1);
    g.fillPoints([...leftEdge, ...rightEdge.slice().reverse()], true);

    // Lane lines — per-segment so width and opacity taper toward the horizon.
    for (let b = -0.5; b <= LANES - 0.5; b += 1) {
      const edge = b === -0.5 || b === LANES - 0.5;
      for (let i = 0; i < segs.length - 1; i++) {
        const a = segs[i];
        const c = segs[i + 1];
        const w = Math.max(0.5, (edge ? 5 : 3) * a.s);
        const alpha = Math.min(1, a.s * 3.2) * (edge ? 1 : 0.7);
        g.lineStyle(w, GAME_COLORS.laneLine, alpha);
        g.lineBetween(edgeX(a, b), a.y, edgeX(c, b), c.y);
      }
    }
  }

  /** Like project() but allows d < 0 (start line / numbers receding). */
  private projectRaw(d: number, lane: number): Projected {
    const s = NEAR / (NEAR + d);
    const y = this.horizonY + (this.bottomY - this.horizonY) * s;
    const x =
      this.scale.width / 2 + (lane - (LANES - 1) / 2) * this.laneSpacing * s;
    return { x, y, s };
  }

  /** Crowd signs as billboards beside the track, scrolling toward the player. */
  private updateSigns() {
    const g = this.world;
    const visible = SIGNS.map((sg) => ({ sg, d: sg.at - this.playerDistance }))
      .filter((x) => x.d >= 0 && x.d <= VIEW_DISTANCE)
      .sort((a, b) => b.d - a.d); // far first

    let slot = 0;
    for (const { sg, d } of visible) {
      if (slot >= this.signPool.length) break;
      const lane = sg.side === -1 ? -2.4 : LANES - 1 + 2.4;
      const p = this.project(d, lane);
      const scale = Math.min(1.5, Math.max(0.4, p.s * 2));
      const postH = 70 * scale;
      const signY = p.y - postH;
      // Post.
      g.lineStyle(Math.max(1.5, 4 * scale), 0x6b4f2a, 1);
      g.lineBetween(p.x, p.y, p.x, signY);
      // Billboard.
      const txt = this.signPool[slot++];
      const text =
        this.strings.signs[sg.text % this.strings.signs.length] ?? "";
      txt
        .setText(text)
        .setPosition(p.x, signY)
        .setScale(scale)
        .setVisible(true);
    }
    for (let i = slot; i < this.signPool.length; i++) {
      this.signPool[i].setVisible(false);
    }
  }

  /** Start line + lane numbers at the start of the track (only visible at the
   *  beginning; they recede out of view once running, like the finish line). */
  private updateStartArea() {
    const g = this.world;

    const lineD = START_LINE_WORLD - this.playerDistance;
    if (lineD > -40 && NEAR + lineD > 1) {
      const sl = this.projectRaw(lineD, -0.5);
      const sr = this.projectRaw(lineD, LANES - 0.5);
      g.lineStyle(Math.max(4, 12 * Math.min(1.2, sl.s)), 0xffffff, 1);
      g.lineBetween(sl.x, sl.y, sr.x, sr.y);
    }

    const d = NUMBERS_WORLD - this.playerDistance;
    const show = d > -26 && NEAR + d > 1;
    for (let i = 0; i < LANES; i++) {
      const txt = this.startNumbers[i];
      if (!show) {
        txt.setVisible(false);
        continue;
      }
      const p = this.projectRaw(d, i);
      txt
        .setVisible(p.y < this.scale.height + 80)
        .setPosition(p.x, p.y)
        .setScale(p.s, p.s * 0.55);
    }
  }

  private drawWorld() {
    const g = this.world;
    g.clear();

    // Finish line — a black/white checker band, if within view.
    const finishD = TRACK.length - this.playerDistance;
    if (finishD >= 0 && finishD <= VIEW_DISTANCE) {
      const l = this.project(finishD, -0.5);
      const r = this.project(finishD, LANES - 0.5);
      const thick = Math.max(3, 11 * l.s);
      g.lineStyle(thick, GAME_COLORS.finish, 1);
      g.lineBetween(l.x, l.y, r.x, r.y);
      const segs = 16;
      g.lineStyle(thick, 0x000000, 1);
      for (let i = 0; i < segs; i += 2) {
        const t0 = i / segs;
        const t1 = (i + 1) / segs;
        g.lineBetween(
          this.lerp(l.x, r.x, t0),
          this.lerp(l.y, r.y, t0),
          this.lerp(l.x, r.x, t1),
          this.lerp(l.y, r.y, t1)
        );
      }
    }

    // Food: a bubble with the food's emoji inside. Far-to-near.
    const visible = [...TRACK.goodFood, ...TRACK.junkFood]
      .map((f) => ({ f, def: FOODS[f.type] }))
      .filter(({ f, def }) => {
        if (!def) return false;
        const d = f.at - this.playerDistance;
        return !this.resolved.has(f.id) && d >= 0 && d <= VIEW_DISTANCE;
      })
      .map((x) => ({
        ...x,
        p: this.project(x.f.at - this.playerDistance, x.f.lane),
      }))
      .sort((a, b) => a.p.s - b.p.s);

    let slot = 0;
    for (const { def, p } of visible) {
      const r = Math.max(5, 22 * p.s);
      const cx = p.x;
      const cy = p.y - r;
      const color =
        def.kind === "good" ? GAME_COLORS.goodFood : GAME_COLORS.junkFood;
      this.drawBubble(g, cx, cy, r, color);

      if (slot < this.foodPool.length) {
        const txt = this.foodPool[slot++];
        txt
          .setText(def.icon)
          .setPosition(cx, cy)
          .setScale(Math.max(0.3, p.s))
          .setVisible(true);
      }
    }
    for (let i = slot; i < this.foodPool.length; i++) {
      this.foodPool[i].setVisible(false);
    }
  }

  /** Bubble surface (echoing cursats' bubble-surface mixin). */
  private drawBubble(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    color: number
  ) {
    g.fillStyle(color, 0.42);
    g.fillCircle(cx, cy, r);
    g.fillStyle(0xffffff, 0.16);
    g.fillCircle(cx - r * 0.22, cy - r * 0.28, r * 0.72);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - r * 0.32, cy - r * 0.34, Math.max(1, r * 0.16));
    g.lineStyle(Math.max(1, 1.5 * (r / 22)), 0xffffff, 0.5);
    g.strokeCircle(cx, cy, r);
  }

  /** A little back-view runner built from shapes, with a running animation
   *  (swinging legs/arms + bob) and a tipsy sway after a beer. */
  private drawRunner() {
    const g = this.runnerG;
    g.clear();

    const me = this.project(0, this.playerLane);
    const sway = this.drunkTimer > 0 ? Math.sin(this.now * 0.008) * 8 : 0;

    // Animated sprite path (when a sprite sheet is present). The sprite already
    // includes its own shadow, so we don't draw the vector one here.
    if (this.useSprite && this.runnerSprite) {
      const spr = this.runnerSprite;
      const moving = this.startHold <= 0 && !this.finished;
      if (moving && !spr.anims.isPlaying) spr.play("run");
      else if (!moving && spr.anims.isPlaying) spr.anims.pause();
      spr
        .setPosition(me.x + sway, me.y + RUNNER_SPRITE.offsetY)
        .setScale(RUNNER_SPRITE.scale)
        .setVisible(true);
      return;
    }

    // Vector fallback runner.
    const phase = this.playerDistance * 0.05;
    const bob = Math.sin(phase * 2) * 2.5;
    const cx = me.x + sway;
    const gy = me.y;

    const jersey = GAME_COLORS.runner; // gold
    const legCol = 0x1a2b4a;
    const skin = 0xf0b27a;

    // Shadow.
    g.fillStyle(GAME_COLORS.runnerShadow, 0.22);
    g.fillEllipse(me.x, gy - 2, 46, 12);

    const hipY = gy - 26 + bob;
    const shoulderY = gy - 50 + bob;
    const headY = gy - 60 + bob;
    const legSwing = Math.sin(phase) * 9;

    // Legs.
    g.lineStyle(8, legCol, 1);
    g.lineBetween(cx, hipY, cx - 5 + legSwing, gy);
    g.lineBetween(cx, hipY, cx + 5 - legSwing, gy - 5);

    // Arms (swing opposite the legs).
    g.lineStyle(6, jersey, 1);
    g.lineBetween(cx - 8, shoulderY + 4, cx - 11 - legSwing, shoulderY + 17);
    g.lineBetween(cx + 8, shoulderY + 4, cx + 11 + legSwing, shoulderY + 17);

    // Torso (jersey).
    g.fillStyle(jersey, 1);
    g.fillRoundedRect(cx - 10, shoulderY, 20, hipY - shoulderY + 6, 7);
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeRoundedRect(cx - 10, shoulderY, 20, hipY - shoulderY + 6, 7);

    // Head + cap.
    g.fillStyle(skin, 1);
    g.fillCircle(cx, headY, 9);
    g.fillStyle(0x16a34a, 1); // green cap
    g.fillEllipse(cx, headY - 5, 19, 10);
  }

  private drawHud() {
    const g = this.hud;
    g.clear();

    g.fillStyle(GAME_COLORS.hudPanel, 0.45);
    g.fillRoundedRect(12, 12, 290, 92, 12);

    const barX = 54;
    const barW = 232;
    const barH = 14;

    const ey = 44;
    g.fillStyle(0x0b1020, 0.6).fillRoundedRect(barX, ey, barW, barH, 6);
    g.fillStyle(GAME_COLORS.energy, 1).fillRoundedRect(
      barX,
      ey,
      Math.max(0, barW * this.energy),
      barH,
      6
    );

    const poy = 68;
    g.fillStyle(0x0b1020, 0.6).fillRoundedRect(barX, poy, barW, barH, 6);
    g.fillStyle(GAME_COLORS.poison, 1).fillRoundedRect(
      barX,
      poy,
      Math.max(0, barW * this.poison),
      barH,
      6
    );

    const pct = Math.min(100, (this.playerDistance / TRACK.length) * 100);
    this.statusText.setText(
      `${pct.toFixed(0)}%   ·   ${this.points} pts   ·   ${this.elapsed.toFixed(1)}s`
    );
  }
}

export type SpriteChoice = {
  sheet: string;
  frameWidth: number;
  frameHeight: number;
};

export const createGameConfig = (
  parent: HTMLElement,
  strings?: GameStrings,
  character?: SpriteChoice,
  onFinish?: (result: { time: number; points: number }) => void
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: VIEW.width,
  height: VIEW.height,
  backgroundColor: "#cdeaf8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  callbacks: {
    preBoot: (game) => {
      game.registry.set("strings", strings ?? DEFAULT_STRINGS);
      if (character) game.registry.set("character", character);
      if (onFinish) game.registry.set("onFinish", onFinish);
    },
  },
  scene: [RaceScene],
});
