import {PROGRAM} from "../data/program.js";
import {EXTRAS} from "../data/extras.js";
import {OFFDAYS} from "../data/offdays.js";
import {LOAD, PER, PATTERNS, COMPOUND} from "../data/taxonomy.js";
import {BLOCKS, DAY_KEYS, OFF_KEYS, REST, IMPLEMENTS_PER_LOAD,
        HEAVY_REP_CEILING, LEAD_SET_COUNT} from "../data/constants.js";

export const PATTERN_OF = {};
for(const pattern in PATTERNS) PATTERNS[pattern].forEach(id => { PATTERN_OF[id] = pattern; });

const LOAD_OF = {};
for(const kind in LOAD) LOAD[kind].forEach(id => { LOAD_OF[id] = kind; });

const PER_OF = {};
for(const side in PER) PER[side].forEach(id => { PER_OF[id] = side; });

const COMPOUND_PATTERNS = new Set(COMPOUND);

export function repRange(reps){
  const span = /(\d+)\s*-\s*(\d+)/.exec(reps);
  if(span) return {min: +span[1], max: +span[2]};
  const single = /^(\d+)/.exec(reps);
  return single ? {min: +single[1], max: +single[1]} : null;
}

export function restFor(exercise){
  if(!COMPOUND_PATTERNS.has(PATTERN_OF[exercise.id])) return REST.isolation;
  const range = repRange(exercise.r);
  if(range && range.max <= HEAVY_REP_CEILING) return REST.heavy;
  return exercise.s >= LEAD_SET_COUNT ? REST.lead : REST.accessory;
}

export function restAfterSet(exercise, index){
  return index + 1 >= exercise.s ? exercise.restAfter : exercise.rest;
}

export function workoutSlots(workout){
  if(!workout) return [];
  if(workout.sections) return workout.sections.flatMap(section => section.ex);
  return workout.ex.concat((workout.core || []).flat());
}

export function isOffDay(day){ return OFF_KEYS.includes(day); }

function tagLoadAndSides(exercise){
  exercise.load = LOAD_OF[exercise.id] || (exercise.bw ? "bw" : "single");
  if(exercise.load === "bw" || exercise.load === "level") exercise.bw = 1;
  exercise.per = PER_OF[exercise.id] || null;
  exercise.sides = exercise.per ? 2 : 1;
  exercise.implements = IMPLEMENTS_PER_LOAD[exercise.load];
}

for(const block of BLOCKS) for(const day of DAY_KEYS){
  const workout = PROGRAM[block][day];
  workout.ex.forEach(e => {
    e.rest = restFor(e);
    e.restAfter = REST.betweenExercises;
  });
  (workout.core || []).forEach(pair => pair.forEach((e, i) => {
    e.core = 1;
    e.rest = i ? REST.supersetRound : REST.supersetWalk;
    e.restAfter = i ? REST.betweenSupersets : REST.supersetWalk;
  }));
  workoutSlots(workout).forEach(tagLoadAndSides);
}

for(const block of BLOCKS) for(const day of OFF_KEYS){
  OFFDAYS[block][day].sections.forEach(section => section.ex.forEach(e => {
    if(e.s === undefined) e.s = section.rounds;
    if(section.on){ e.win = section.on; e.r = "AMRAP"; }
    e.rest = section.off;
    e.restAfter = section.off;
    tagLoadAndSides(e);
  }));
}

EXTRAS.forEach(e => {
  e.rest = restFor(e);
  e.restAfter = REST.betweenExercises;
  tagLoadAndSides(e);
});

const BY_ID = {};
for(const block of BLOCKS) for(const day of DAY_KEYS)
  workoutSlots(PROGRAM[block][day]).forEach(e => { BY_ID[e.id] = e; });
for(const block of BLOCKS) for(const day of OFF_KEYS)
  workoutSlots(OFFDAYS[block][day]).forEach(e => { if(!BY_ID[e.id]) BY_ID[e.id] = e; });
EXTRAS.forEach(e => { BY_ID[e.id] = e; });

export function findExercise(id){ return BY_ID[id] || null; }

export function exerciseIds(){ return Object.keys(BY_ID); }

export function workoutFor(block, day){
  const book = isOffDay(day) ? OFFDAYS : PROGRAM;
  return (book[block] && book[block][day]) || null;
}

export {PROGRAM, OFFDAYS, PATTERNS, EXTRAS};
