/**
 * Food catalog. Four good foods and four junk foods, each with its own energy
 * (or toxicity) and score. Good food fills the energy bar; junk fills the
 * poison bar (a full poison bar sends the runner to the bathroom).
 */

export type FoodKind = "good" | "bad";

export type FoodDef = {
  id: string;
  icon: string; // emoji shown inside the bubble
  kind: FoodKind;
  energy: number; // energy gained (good only), 0..1
  poison: number; // poison gained (bad only), 0..1
  points: number; // score delta (negative for junk)
};

export const FOODS: Record<string, FoodDef> = {
  // — Good: water < banana < isotonic < gel —
  water: {
    id: "water",
    icon: "💧",
    kind: "good",
    energy: 0.14,
    poison: 0,
    points: 5,
  },
  banana: {
    id: "banana",
    icon: "🍌",
    kind: "good",
    energy: 0.24,
    poison: 0,
    points: 8,
  },
  isotonic: {
    id: "isotonic",
    icon: "🧃",
    kind: "good",
    energy: 0.34,
    poison: 0,
    points: 14,
  },
  gel: {
    id: "gel",
    icon: "⚡",
    kind: "good",
    energy: 0.46,
    poison: 0,
    points: 20,
  },
  // — Junk: donut < fries < burger < beer —
  donut: {
    id: "donut",
    icon: "🍩",
    kind: "bad",
    energy: 0,
    poison: 0.16,
    points: -5,
  },
  fries: {
    id: "fries",
    icon: "🍟",
    kind: "bad",
    energy: 0,
    poison: 0.24,
    points: -8,
  },
  burger: {
    id: "burger",
    icon: "🍔",
    kind: "bad",
    energy: 0,
    poison: 0.3,
    points: -12,
  },
  beer: {
    id: "beer",
    icon: "🍺",
    kind: "bad",
    energy: 0,
    poison: 0.42,
    points: -16,
  },
};

export const GOOD_IDS = ["water", "banana", "isotonic", "gel"];
export const BAD_IDS = ["donut", "fries", "burger", "beer"];
