// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LANES } from "@/lib/game/config";
import {
  applyRunnerAction,
  collectPowerUp,
  createRunnerState,
  updateRunnerState,
} from "@/lib/game/player-state";

describe("game/player-state", () => {
  it("uses exactly three lanes", () => {
    expect(LANES).toBe(3);
  });

  it("moves one lane at a time and clamps at lane boundaries", () => {
    let state = createRunnerState();

    state = applyRunnerAction(state, "left");
    expect(state.targetLane).toBe(0);

    state = applyRunnerAction(state, "left");
    expect(state.targetLane).toBe(0);

    state = applyRunnerAction(state, "right");
    state = applyRunnerAction(state, "right");
    expect(state.targetLane).toBe(2);

    state = applyRunnerAction(state, "right");
    expect(state.targetLane).toBe(2);
  });

  it("starts jump and duck action windows", () => {
    let state = createRunnerState();

    state = applyRunnerAction(state, "jump");
    expect(state.jumpTimer).toBeGreaterThan(0);
    expect(state.duckTimer).toBe(0);

    state = applyRunnerAction(state, "duck");
    expect(state.duckTimer).toBeGreaterThan(0);
    expect(state.jumpTimer).toBe(0);
  });

  it("uses boost only while energy is available and expires over time", () => {
    let state = createRunnerState({ energy: 0.5 });

    state = applyRunnerAction(state, "boost");
    expect(state.boostTimer).toBeGreaterThan(0);
    expect(state.energy).toBeLessThan(0.5);

    state = updateRunnerState(state, 10);
    expect(state.boostTimer).toBe(0);

    state = applyRunnerAction({ ...state, energy: 0 }, "boost");
    expect(state.boostTimer).toBe(0);
  });

  it("collects and consumes power-up charges", () => {
    let state = createRunnerState();

    state = collectPowerUp(state, "shield");
    expect(state.powerCharges).toBe(1);
    expect(state.heldPower).toBe("shield");

    state = applyRunnerAction(state, "power");
    expect(state.powerCharges).toBe(0);
    expect(state.shieldTimer).toBeGreaterThan(0);

    const afterEmptyUse = applyRunnerAction(state, "power");
    expect(afterEmptyUse).toEqual(state);
  });
});
