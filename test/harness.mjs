const store = {};

globalThis.localStorage = {
  getItem: key => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: key => { delete store[key]; },
  clear: () => { for(const key in store) delete store[key]; }
};

export function clearStorage(){ globalThis.localStorage.clear(); }

const {state, hydrate} = await import("../src/state.js");
const constants = await import("../src/constants.js");
const movements = await import("../src/movements.js");
const progression = await import("../src/progression.js");
const rotation = await import("../src/rotation.js");
const swaps = await import("../src/swaps.js");
const backup = await import("../src/backup.js");
const {HOWTO} = await import("../src/howto.js");
const {PATTERNS, LOAD, PER} = await import("../src/taxonomy.js");

export function reset(){
  clearStorage();
  state.sessions = {};
  state.customNames = {};
  state.view = "log";
  state.current = {date: "2026-12-31", day: "chest", block: "A", blockIndex: 0, entries: {}, swaps: {}, notes: ""};
}

export function logged(date, day, blockIndex, entries){
  return {
    date, day, blockIndex,
    block: constants.BLOCKS[blockIndex % 3],
    entries: entries || {some_lift: [{w: "50", r: "10"}]}
  };
}

export function setsOf(pairs){
  return pairs.map(([w, r]) => ({w: String(w), r: String(r)}));
}

export function everyMovement(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.DAY_KEYS)
    movements.allExercises(movements.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

let passed = 0;
let failed = 0;
let current = "";

export function section(name){
  current = name;
  console.log("\n" + name);
}

export function check(label, condition, detail){
  if(condition){ passed++; console.log("  PASS  " + label); return; }
  failed++;
  console.log("  FAIL  " + label + (detail === undefined ? "" : "  -> " + detail));
}

export function equal(label, got, want){
  const same = JSON.stringify(got) === JSON.stringify(want);
  check(label, same, same ? undefined : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}

export function report(){
  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

export {state, hydrate, constants, movements, progression, rotation, swaps, backup, HOWTO, PATTERNS, LOAD, PER};
