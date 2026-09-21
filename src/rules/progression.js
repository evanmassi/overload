import {findExercise} from "./exercises.js";
import {workoutSlots, workoutFor, repRange, isOffDay} from "./workouts.js";
import {unitSuffix} from "./format.js";
import {isLogged} from "./sets.js";
import {WEIGHT_STEP_LB, BODYWEIGHT_LOAD_EQUIVALENT_LB, EPLEY_DIVISOR,
        EFFORT_STEPS, STALL_EXPOSURES, STALL_BACKOFF_PERCENT} from "../data/constants.js";

function num(value){
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : 0;
}

export function score(set, isBodyweight){
  if(!isLogged(set)) return 0;
  return isBodyweight
    ? num(set.r) * (1 + num(set.w) / BODYWEIGHT_LOAD_EQUIVALENT_LB)
    : num(set.w) * num(set.r);
}

export function trend(set, prior, isBodyweight){
  const now = score(set, isBodyweight);
  const then = score(prior, isBodyweight);
  return now > then ? "up" : now === then ? "same" : "down";
}

export function loggedAsBodyweight(exercise, sets){
  return exercise ? !!exercise.bw : !sets.some(set => set.w);
}

function estimatedMax(weight, reps){ return weight * (1 + reps / EPLEY_DIVISOR); }

export function loggedCount(session){
  let n = 0;
  for(const id in (session.entries || {})) n += session.entries[id].filter(isLogged).length;
  return n;
}

export function prescribedCount(block, day){
  const workout = workoutFor(block, day);
  return workoutSlots(workout).reduce((total, exercise) => total + exercise.s, 0);
}

export function estimateFor(set, isBodyweight){
  if(!isLogged(set)) return 0;
  return isBodyweight ? score(set, true) : estimatedMax(num(set.w), num(set.r));
}

export function bestEstimate(sets, isBodyweight){
  const logged = (sets || []).filter(isLogged);
  if(!logged.length) return null;
  return logged.reduce((best, set) =>
    estimateFor(set, isBodyweight) > estimateFor(best, isBodyweight) ? set : best);
}

export function topSet(sets, isBodyweight){
  const logged = sets.filter(isLogged);
  if(!logged.length) return null;
  return logged.reduce((best, set) => score(set, isBodyweight) > score(best, isBodyweight) ? set : best);
}

export function backoffWeight(sets, isBodyweight){
  const top = topSet(sets, isBodyweight);
  const weight = top ? num(top.w) : 0;
  if(!weight) return null;
  const stepped = Math.round(weight * (1 - STALL_BACKOFF_PERCENT / 100) / WEIGHT_STEP_LB) * WEIGHT_STEP_LB;
  return Math.max(WEIGHT_STEP_LB, stepped);
}

function earlierKeysOfSameKind(sessions, beforeKey, day){
  const offDay = day === undefined ? null : isOffDay(day);
  return Object.keys(sessions)
    .filter(key => key < beforeKey && (offDay === null || isOffDay(sessions[key].day) === offDay))
    .sort().reverse();
}

export function priorSets(sessions, exerciseId, beforeKey, day){
  for(const key of earlierKeysOfSameKind(sessions, beforeKey, day)){
    const session = sessions[key];
    const sets = session.entries && session.entries[exerciseId];
    if(sets && sets.some(isLogged))
      return {date: session.date, key, sets, effort: session.effort && session.effort[exerciseId]};
  }
  return null;
}

export function exposures(sessions, exerciseId, beforeKey, limit, day){
  const found = [];
  for(const key of earlierKeysOfSameKind(sessions, beforeKey, day)){
    const sets = sessions[key].entries && sessions[key].entries[exerciseId];
    if(sets && sets.some(isLogged)) found.push({date: sessions[key].date, sets});
    if(found.length === limit) break;
  }
  return found;
}

export function hasStalled(sessions, exercise, beforeKey, day){
  const recent = exposures(sessions, exercise.id, beforeKey, STALL_EXPOSURES, day);
  if(recent.length < STALL_EXPOSURES) return false;
  const best = recent.map(entry => score(topSet(entry.sets, exercise.bw), exercise.bw));
  const oldest = best[best.length - 1];
  return best.every(value => value <= oldest);
}

export function sessionVolume(session){
  const workout = workoutFor(session.block, session.day);
  const byId = {};
  for(const e of workoutSlots(workout)) byId[e.id] = e;
  let volume = 0;
  for(const id in (session.entries || {})){
    const exercise = byId[id] || findExercise(id);
    if(exercise && exercise.bw) continue;
    const reach = exercise ? (exercise.sides || 1) * (exercise.implements || 1) : 1;
    for(const set of session.entries[id])
      if(isLogged(set)) volume += num(set.w) * num(set.r) * reach;
  }
  return Math.round(volume);
}

export function suggestTarget(exercise, prior, held){
  if(!prior) return null;
  const top = topSet(prior.sets, exercise.bw);
  if(!top) return null;

  const sets = prior.sets.filter(isLogged);
  const topReps = num(top.r);
  const topWeight = num(top.w);
  const unit = unitSuffix(exercise);
  const effort = prior.effort || "medium";
  const step = EFFORT_STEPS[effort] === undefined ? 1 : EFFORT_STEPS[effort];
  const same = `${topWeight ? topWeight + "×" : ""}${topReps}${unit}`;

  if(held) return {label: same, why: "match it"};
  if(effort === "hard") return {label: same, why: "repeat it"};

  if(!topWeight) return {label: `${topReps + step}${unit || " reps"}`, why: "add reps"};

  const range = repRange(exercise.r);
  if(!range) return {label: `${topWeight}×${topReps + step}${unit}`, why: "add reps"};

  const toppedEverySet = (sets.length >= 2 || exercise.s === 1) && sets.every(set => num(set.r) >= range.max);
  if(toppedEverySet || topReps > range.max){
    const byLevel = exercise.load === "level";
    const weightStep = byLevel ? 1 : WEIGHT_STEP_LB;
    return {label: `${topWeight + weightStep * step}×${range.min}${unit}`, why: byLevel ? "add a level" : "add weight"};
  }

  return {label: `${topWeight}×${Math.min(topReps + step, range.max)}${unit}`, why: "add reps"};
}
