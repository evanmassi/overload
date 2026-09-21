import {installStorage} from "./dom.mjs";

installStorage();

const {state, hydrate} = await import("../src/store/state.js");
const constants = await import("../src/data/constants.js");
const exercises = await import("../src/rules/exercises.js");
const progression = await import("../src/rules/progression.js");
const rotation = await import("../src/rules/rotation.js");
const customs = await import("../src/store/customs.js");
const slots = await import("../src/store/slots.js");
const backup = await import("../src/store/backup.js");
const {HOWTO} = await import("../src/data/howto.js");
const {PATTERNS, LOAD, PER} = await import("../src/data/taxonomy.js");
const {EXTRAS} = await import("../src/data/extras.js");
const {MUSCLES} = await import("../src/data/muscles.js");

export function reset(){
  localStorage.clear();
  state.sessions = {};
  state.customNames = {};
  state.view = "log";
  state.current = {key: "2026-12-31T00:00:00", date: "2026-12-31", day: "chest", block: "A", blockIndex: 0, entries: {}, swaps: {}, notes: ""};
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
    exercises.allExercises(exercises.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function offDayMovements(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.OFF_KEYS)
    exercises.allExercises(exercises.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function everyMovement(){
  const seen = prescribedMovements();
  offDayMovements().forEach((e, id) => { if(!seen.has(id)) seen.set(id, e); });
  EXTRAS.forEach(e => seen.set(e.id, e));
  return seen;
}

export {state, hydrate, constants, exercises, progression, rotation, customs, slots, backup, HOWTO, PATTERNS, LOAD, PER, EXTRAS, MUSCLES};
