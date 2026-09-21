export const BLOCKS = ["A", "B", "C"];
export const DAY_KEYS = ["chest", "legs", "arms"];

export const OFF_KEYS = ["conditioning", "functional", "mobility"];

export const DAYS = {
  chest: {short: "Chest", label: "Chest & Back"},
  legs: {short: "Legs", label: "Legs & Back"},
  arms: {short: "Arms", label: "Shoulders & Arms"},
  conditioning: {short: "Cardio", label: "Cardio"},
  functional: {short: "Function", label: "Function"},
  mobility: {short: "Mobility", label: "Mobility"}
};

export const LEGACY_DAY_KEYS = {mon: "chest", wed: "legs", fri: "arms"};

export const SESSIONS_KEY = "overload.v1";
export const CUSTOM_KEY = "overload.custom.v1";
export const SOUND_KEY = "overload.sound.v1";
export const HOLD_KEY = "overload.hold.v1";

export const REST = {
  heavy: 180,
  lead: 120,
  accessory: 90,
  isolation: 60,
  betweenExercises: 90,
  coreSwitch: 15,
  coreRound: 45,
  betweenCorePairs: 60
};

export const HEAVY_REP_CEILING = 6;
export const LEAD_SET_COUNT = 4;

export const DEFAULT_REST = 90;
export const TIMER_TICK_MS = 250;
export const TIMER_RESET_DELAY_MS = 3000;
export const LIVE_FINISH_MS = 1000;
export const WARN_COUNTDOWN_SECONDS = 10;
export const FINAL_COUNTDOWN_SECONDS = 3;
export const VIBRATE_PATTERN = [200, 100, 200];
export const BEEP_PULSE_GAP_SECONDS = 0.06;
export const BEEP_LATE_TOLERANCE_SECONDS = 0.25;
export const BEEP_COUNTDOWN = {wave: "triangle", volume: 1, pulses: [{freq: 880, seconds: 0.12}]};
export const BEEP_GO = {wave: "triangle", volume: 1, pulses: [{freq: 1320, seconds: 1}]};

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
  bw: "bodyweight +",
  level: "machine level"
};

export const IMPLEMENTS_PER_LOAD = {pair: 2, single: 1, bar: 1, stack: 1, bw: 1, level: 0};

export const ICON_SWAP = '<i class="icon">swap_horiz</i>';
export const TREND_ICON = {
  up: '<i class="icon">keyboard_double_arrow_up</i>',
  same: '<i class="icon">radio_button_checked</i>',
  down: '<i class="icon">keyboard_double_arrow_down</i>'
};

export const EFFORT_LEVELS = ["easy", "medium", "hard"];
export const EFFORT_STEPS = {easy: 2, medium: 1, hard: 0};
export const STALL_EXPOSURES = 3;
export const STALL_BACKOFF_PERCENT = 10;
export const HOLD_RELEASE_MARGIN = 0.1;
export const CONSISTENCY_WEEKS = 26;

export const LONG_PRESS_MS = 500;
export const TIMER_PRESETS = [15, 30, 45, 60, 90, 120, 180, 300, 600];
export const BEEP_RELEASE_SECONDS = 0.12;
