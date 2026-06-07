import { ENERGY, LANES } from "./config";

export type RunnerPower = "shield";

export type RunnerAction =
  | "left"
  | "right"
  | "jump"
  | "duck"
  | "boost"
  | "power"
  | "restart";

export type RunnerState = {
  targetLane: number;
  energy: number;
  jumpTimer: number;
  duckTimer: number;
  boostTimer: number;
  shieldTimer: number;
  powerCharges: number;
  heldPower: RunnerPower | null;
};

export const RUNNER_ACTION = {
  jumpSeconds: 0.52,
  duckSeconds: 0.72,
  boostSeconds: 1.15,
  boostEnergyCost: 0.28,
  shieldSeconds: 3.5,
  maxPowerCharges: 3,
};

export function createRunnerState(
  overrides: Partial<RunnerState> = {}
): RunnerState {
  return {
    targetLane: Math.floor(LANES / 2),
    energy: ENERGY.start,
    jumpTimer: 0,
    duckTimer: 0,
    boostTimer: 0,
    shieldTimer: 0,
    powerCharges: 0,
    heldPower: null,
    ...overrides,
  };
}

export function updateRunnerState(state: RunnerState, dt: number): RunnerState {
  return {
    ...state,
    jumpTimer: Math.max(0, state.jumpTimer - dt),
    duckTimer: Math.max(0, state.duckTimer - dt),
    boostTimer: Math.max(0, state.boostTimer - dt),
    shieldTimer: Math.max(0, state.shieldTimer - dt),
  };
}

export function collectPowerUp(
  state: RunnerState,
  power: RunnerPower
): RunnerState {
  return {
    ...state,
    heldPower: power,
    powerCharges: Math.min(
      RUNNER_ACTION.maxPowerCharges,
      state.powerCharges + 1
    ),
  };
}

export function applyRunnerAction(
  state: RunnerState,
  action: RunnerAction
): RunnerState {
  switch (action) {
    case "left":
      return { ...state, targetLane: Math.max(0, state.targetLane - 1) };
    case "right":
      return { ...state, targetLane: Math.min(LANES - 1, state.targetLane + 1) };
    case "jump":
      return {
        ...state,
        jumpTimer: RUNNER_ACTION.jumpSeconds,
        duckTimer: 0,
      };
    case "duck":
      return {
        ...state,
        duckTimer: RUNNER_ACTION.duckSeconds,
        jumpTimer: 0,
      };
    case "boost":
      if (state.energy < RUNNER_ACTION.boostEnergyCost) return state;
      return {
        ...state,
        boostTimer: RUNNER_ACTION.boostSeconds,
        energy: Math.max(0, state.energy - RUNNER_ACTION.boostEnergyCost),
      };
    case "power":
      if (state.powerCharges <= 0 || state.heldPower !== "shield") return state;
      return {
        ...state,
        powerCharges: state.powerCharges - 1,
        heldPower: state.powerCharges - 1 > 0 ? state.heldPower : null,
        shieldTimer: RUNNER_ACTION.shieldSeconds,
      };
    case "restart":
      return state;
  }
}
