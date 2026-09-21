import {PROGRAM} from "../data/program.js";
import {OFFDAYS} from "../data/offdays.js";
import {BLOCKS, DAY_KEYS, OFF_KEYS, REST, HEAVY_REP_CEILING, LEAD_SET_COUNT} from "../data/constants.js";
import {findExercise, isCompound} from "./exercises.js";

export function repRange(reps){
  const span = /(\d+)\s*-\s*(\d+)/.exec(reps);
  if(span) return {min: +span[1], max: +span[2]};
  const single = /^(\d+)/.exec(reps);
  return single ? {min: +single[1], max: +single[1]} : null;
}

export function restFor(slot){
  if(!isCompound(slot.id)) return REST.isolation;
  const range = repRange(slot.r);
  if(range && range.max <= HEAVY_REP_CEILING) return REST.heavy;
  return slot.s >= LEAD_SET_COUNT ? REST.lead : REST.accessory;
}

export function restAfterSet(exercise, index){
  return index + 1 >= exercise.s ? exercise.restAfter : exercise.rest;
}

export function isOffDay(day){ return OFF_KEYS.includes(day); }

function ready(slot, placement){
  return Object.assign({}, findExercise(slot.id), slot, {unit: slot.unit || null}, placement);
}

const roundsWithRest = (slot, section) => ({
  s: slot.s === undefined ? section.rounds : slot.s,
  rest: section.off,
  restAfter: section.off
});

const PLACEMENT = {
  straight: slot => ({rest: restFor(slot), restAfter: REST.betweenExercises}),
  superset: (slot, section, i) => ({
    core: 1,
    s: section.rounds,
    rest: i % 2 ? REST.supersetRound : REST.supersetWalk,
    restAfter: i % 2 ? REST.betweenSupersets : REST.supersetWalk
  }),
  interval: (slot, section) => Object.assign(roundsWithRest(slot, section), {win: section.on, r: "AMRAP"}),
  circuit: roundsWithRest,
  finish: roundsWithRest
};

function build(workout){
  return Object.assign({}, workout, {sections: workout.sections.map(section => Object.assign({}, section, {
    ex: section.ex.map((slot, i) => ready(slot, PLACEMENT[section.kind](slot, section, i)))
  }))});
}

function buildBook(book, days){
  const built = {};
  for(const block of BLOCKS){
    built[block] = {};
    for(const day of days) built[block][day] = build(book[block][day]);
  }
  return built;
}

const LIFTING = buildBook(PROGRAM, DAY_KEYS);
const OFF_DAYS = buildBook(OFFDAYS, OFF_KEYS);

export function workoutFor(block, day){
  const book = isOffDay(day) ? OFF_DAYS : LIFTING;
  return (book[block] && book[block][day]) || null;
}

export function workoutSlots(workout){
  return workout ? workout.sections.flatMap(section => section.ex) : [];
}

export function supersetPairs(section){
  const pairs = [];
  for(let i = 0; i < section.ex.length; i += 2) pairs.push(section.ex.slice(i, i + 2));
  return pairs;
}
