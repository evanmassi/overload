export const BLOCKS = ["A", "B", "C"];
export const DAY_KEYS = ["chest", "legs", "arms"];

export const DAYS = {
  chest: {short: "Chest", label: "Chest & Back"},
  legs: {short: "Legs", label: "Legs & Back"},
  arms: {short: "Arms", label: "Shoulders & Arms"}
};

export const LEGACY_DAY_KEYS = {mon: "chest", wed: "legs", fri: "arms"};

export const SESSIONS_KEY = "overload.v1";
export const CUSTOM_KEY = "overload.custom.v1";

export const HEAVY_COMPOUND_SLOTS = 2;

export const REST = {
  heavy: 120,
  accessory: 60,
  betweenMoves: 90,
  supersetWalk: 15,
  supersetRound: 45,
  betweenSupersets: 60
};

export const DEFAULT_REST = 90;
export const TIMER_TICK_MS = 250;
export const TIMER_RESET_DELAY_MS = 3000;
export const VIBRATE_PATTERN = [200, 100, 200];

export const AUTOSAVE_DELAY_MS = 1200;
export const CONFIRM_WINDOW_MS = 4000;

export const WEIGHT_STEP_LB = 5;
export const BODYWEIGHT_LOAD_EQUIVALENT_LB = 40;
export const EPLEY_DIVISOR = 30;

export const LOAD_LABEL = {
  pair: "per dumbbell",
  single: "one dumbbell",
  bar: "total w/ bar",
  stack: "stack",
  bw: "bodyweight +"
};

export const IMPLEMENTS_PER_LOAD = {pair: 2, single: 1, bar: 1, stack: 1, bw: 1};

export const ICON_SWAP = '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h12M12 4l3 3-3 3"/><path d="M17 13H5m3-3-3 3 3 3"/></svg>';
export const ICON_UNDO = '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h9a3.5 3.5 0 010 7H9"/><path d="M4 10l3.5-3.5M4 10l3.5 3.5"/></svg>';
