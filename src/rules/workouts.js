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

function liftingWorkout(workout){
  return {
    focus: workout.focus,
    ex: workout.ex.map(slot => ready(slot, {rest: restFor(slot), restAfter: REST.betweenExercises})),
    core: workout.core.map(pair => pair.map((slot, i) => ready(slot, {
      core: 1,
      rest: i ? REST.supersetRound : REST.supersetWalk,
      restAfter: i ? REST.betweenSupersets : REST.supersetWalk
    })))
  };
}

function offDayWorkout(workout){
  return Object.assign({}, workout, {sections: workout.sections.map(section => Object.assign({}, section, {
    ex: section.ex.map(slot => ready(slot, Object.assign(
      {s: slot.s === undefined ? section.rounds : slot.s, rest: section.off, restAfter: section.off},
      section.on ? {win: section.on, r: "AMRAP"} : {})))
  }))});
}

function buildBook(book, days, build){
  const built = {};
  for(const block of BLOCKS){
    built[block] = {};
    for(const day of days) built[block][day] = build(book[block][day]);
  }
  return built;
}

const LIFTING = buildBook(PROGRAM, DAY_KEYS, liftingWorkout);
const OFF_DAYS = buildBook(OFFDAYS, OFF_KEYS, offDayWorkout);

export function workoutFor(block, day){
  const book = isOffDay(day) ? OFF_DAYS : LIFTING;
  return (book[block] && book[block][day]) || null;
}

export function workoutSlots(workout){
  if(!workout) return [];
  if(workout.sections) return workout.sections.flatMap(section => section.ex);
  return workout.ex.concat(workout.core.flat());
}
