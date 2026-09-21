import {installStorage} from "./dom.mjs";

installStorage();

const {state, hydrate} = await import("../src/store/state.js");
const constants = await import("../src/data/constants.js");
const exercises = await import("../src/rules/exercises.js");
const workouts = await import("../src/rules/workouts.js");
const progression = await import("../src/rules/progression.js");
const rotation = await import("../src/rules/rotation.js");
const customs = await import("../src/store/customs.js");
const slots = await import("../src/store/slots.js");
const backup = await import("../src/store/backup.js");
const {HOWTO} = await import("../src/data/howto.js");
const {CATALOG, PATTERNS} = await import("../src/data/catalog.js");
const {PROGRAM} = await import("../src/data/program.js");

export function reset(){
  localStorage.clear();
  state.sessions = {};
  state.customNames = {};
  state.view = "log";
  state.current = {key: "2026-12-31T00:00:00", date: "2026-12-31", day: "chest", block: "A", blockIndex: 0, entries: {}, swaps: {}, notes: "", effort: {}};
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

export function prescribedExercises(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.DAY_KEYS)
    workouts.workoutSlots(workouts.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function offDayExercises(){
  const seen = new Map();
  for(const block of constants.BLOCKS) for(const day of constants.OFF_KEYS)
    workouts.workoutSlots(workouts.workoutFor(block, day)).forEach(e => seen.set(e.id, e));
  return seen;
}

export function everyExercise(){
  return new Map(exercises.exerciseIds().map(id => [id, exercises.findExercise(id)]));
}

export {state, hydrate, constants, exercises, workouts, progression, rotation, customs, slots, backup, HOWTO, CATALOG, PATTERNS, PROGRAM};
