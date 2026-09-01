import {findExercise, allExercises, workoutFor} from "./movements.js";
import {WEIGHT_STEP_LB, BODYWEIGHT_LOAD_EQUIVALENT_LB, EPLEY_DIVISOR} from "./constants.js";

export function num(value){
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : 0;
}

export function score(set, isBodyweight){
  if(!set || !set.r) return 0;
  return isBodyweight
    ? num(set.r) * (1 + num(set.w) / BODYWEIGHT_LOAD_EQUIVALENT_LB)
    : num(set.w) * num(set.r);
}

export function estimatedMax(weight, reps){ return weight * (1 + reps / EPLEY_DIVISOR); }

export function loggedCount(session){
  let n = 0;
  for(const id in (session.entries || {}))
    for(const set of session.entries[id]) if(set && set.r) n++;
  return n;
}

export function priorSets(sessions, exerciseId, beforeDate){
  const dates = Object.keys(sessions).filter(d => d < beforeDate).sort().reverse();
  for(const date of dates){
    const sets = sessions[date].entries && sessions[date].entries[exerciseId];
    if(sets && sets.some(set => set && set.r)) return {date, sets};
  }
  return null;
}

export function sessionVolume(session, block, day){
  const plan = workoutFor(block, day);
  const byId = {};
  for(const e of allExercises(plan)) byId[e.id] = e;
  let volume = 0;
  for(const id in (session.entries || {})){
    const exercise = byId[id] || findExercise(id);
    if(exercise && exercise.bw) continue;
    const reach = exercise ? (exercise.sides || 1) * (exercise.implements || 1) : 1;
    for(const set of session.entries[id])
      if(set && set.r) volume += num(set.w) * num(set.r) * reach;
  }
  return Math.round(volume);
}

export function repRange(reps){
  const span = /(\d+)\s*-\s*(\d+)/.exec(reps);
  if(span) return {min: +span[1], max: +span[2]};
  const single = /^(\d+)/.exec(reps);
  return single ? {min: +single[1], max: +single[1]} : null;
}

export function suggestTarget(exercise, prior){
  if(!prior) return null;
  const sets = prior.sets.filter(set => set && set.r);
  if(!sets.length) return null;

  const top = sets.reduce((best, set) => score(set, exercise.bw) > score(best, exercise.bw) ? set : best);
  const topReps = num(top.r);
  const topWeight = num(top.w);
  const unit = exercise.unit === "sec" ? "s" : "";

  if(!topWeight) return {label: `${topReps + 1}${unit || " reps"}`, why: "add a rep"};

  const range = repRange(exercise.r);
  if(!range) return {label: `${topWeight}×${topReps + 1}${unit}`, why: "add a rep"};

  const toppedEverySet = sets.length >= 2 && sets.every(set => num(set.r) >= range.max);
  if(toppedEverySet || topReps > range.max)
    return {label: `${topWeight + WEIGHT_STEP_LB}×${range.min}${unit}`, why: "add weight"};

  return {label: `${topWeight}×${Math.min(topReps + 1, range.max)}${unit}`, why: "add a rep"};
}
