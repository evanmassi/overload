import {installStorage} from "./dom.mjs";

installStorage();

const {state, hydrate} = await import("../src/state.js");
const constants = await import("../src/constants.js");
const movements = await import("../src/movements.js");
const progression = await import("../src/progression.js");
const rotation = await import("../src/rotation.js");
const swaps = await import("../src/swaps.js");
const backup = await import("../src/backup.js");
const {HOWTO} = await import("../src/howto.js");
const {PATTERNS, LOAD, PER} = await import("../src/taxonomy.js");
const {EXTRAS} = await import("../src/extras.js");
const {MUSCLES} = await import("../src/muscles.js");

export function reset(){
  localStorage.clear();
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

export function prescribedMovements(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.DAY_KEYS)
    movements.allExercises(movements.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function offDayMovements(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.OFF_KEYS)
    movements.allExercises(movements.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function everyMovement(){
  const seen = prescribedMovements();
  offDayMovements().forEach((e, id) => { if(!seen.has(id)) seen.set(id, e); });
  EXTRAS.forEach(e => seen.set(e.id, e));
  return seen;
}

export {state, hydrate, constants, movements, progression, rotation, swaps, backup, HOWTO, PATTERNS, LOAD, PER, EXTRAS, MUSCLES};
