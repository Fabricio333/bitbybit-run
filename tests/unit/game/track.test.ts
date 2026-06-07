// @vitest-environment node
import { describe, expect, it } from "vitest";
import { TRACK } from "@/lib/game/track";

describe("game/track", () => {
  it("keeps every spawned item inside the three lane track", () => {
    expect(TRACK.lanes).toBe(3);

    for (const item of [
      ...TRACK.goodFood,
      ...TRACK.junkFood,
      ...TRACK.powerUps,
    ]) {
      expect(item.lane).toBeGreaterThanOrEqual(0);
      expect(item.lane).toBeLessThan(TRACK.lanes);
    }
  });

  it("distributes deterministic track items across all lanes", () => {
    const lanes = new Set(
      [...TRACK.goodFood, ...TRACK.junkFood, ...TRACK.powerUps].map(
        (item) => item.lane
      )
    );
    expect([...lanes].sort()).toEqual([0, 1, 2]);
  });
});
