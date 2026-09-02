import {PROGRAM} from "./program.js";
import {LOAD, PER, PATTERNS, COMPOUND} from "./taxonomy.js";
import {BLOCKS, DAY_KEYS, REST, IMPLEMENTS_PER_LOAD,
        HEAVY_REP_CEILING, LEAD_SET_COUNT} from "./constants.js";

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

export function allExercises(plan){
  if(!plan) return [];
  return plan.ex.concat((plan.core || []).flat());
}

for(const block of BLOCKS) for(const day of DAY_KEYS){
  const plan = PROGRAM[block][day];
  plan.ex.forEach(e => {
    e.rest = restFor(e);
    e.restAfter = REST.betweenMoves;
  });
  (plan.core || []).forEach(pair => pair.forEach((e, i) => {
    e.core = 1;
    e.rest = i ? REST.supersetRound : REST.supersetWalk;
    e.restAfter = i ? REST.betweenSupersets : REST.supersetWalk;
  }));
  allExercises(plan).forEach(e => {
    e.load = LOAD_OF[e.id] || (e.bw ? "bw" : "single");
    e.per = PER_OF[e.id] || null;
    e.sides = e.per ? 2 : 1;
    e.implements = IMPLEMENTS_PER_LOAD[e.load];
  });
}

const BY_ID = {};
for(const block of BLOCKS) for(const day of DAY_KEYS)
  allExercises(PROGRAM[block][day]).forEach(e => { BY_ID[e.id] = e; });

export function findExercise(id){ return BY_ID[id] || null; }

export function programIds(){ return Object.keys(BY_ID); }

export function workoutFor(block, day){
  return (PROGRAM[block] && PROGRAM[block][day]) || null;
}

export {PROGRAM, PATTERNS};
