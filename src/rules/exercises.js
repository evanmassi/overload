import {CATALOG, PATTERNS} from "../data/catalog.js";
import {IMPLEMENTS_PER_LOAD} from "../data/constants.js";

const BODYWEIGHT_LOADS = new Set(["bw", "level"]);

function derive(id, record){
  return {
    id,
    n: record.n,
    pattern: record.pattern,
    load: record.load,
    bw: BODYWEIGHT_LOADS.has(record.load),
    per: record.per || null,
    sides: record.per ? 2 : 1,
    implements: IMPLEMENTS_PER_LOAD[record.load],
    unit: record.unit || null,
    target: record.target
  };
}

const EXERCISES = {};
for(const id in CATALOG) EXERCISES[id] = derive(id, CATALOG[id]);

export const IDS_BY_PATTERN = {};
for(const pattern in PATTERNS) IDS_BY_PATTERN[pattern] = [];
for(const id in EXERCISES) IDS_BY_PATTERN[EXERCISES[id].pattern].push(id);

export function findExercise(id){ return EXERCISES[id] || null; }

export function exerciseIds(){ return Object.keys(EXERCISES); }

export function musclesOf(id){ return CATALOG[id] ? CATALOG[id].muscles : null; }

export function isCompound(id){ return !!EXERCISES[id] && PATTERNS[EXERCISES[id].pattern].compound; }
