import {findExercise, allExercises, workoutFor, repRange} from "./movements.js";
import {WEIGHT_STEP_LB, BODYWEIGHT_LOAD_EQUIVALENT_LB, EPLEY_DIVISOR,
        EFFORT_STEPS, STALL_EXPOSURES} from "./constants.js";

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

export function prescribedCount(block, day){
  const plan = workoutFor(block, day);
  return allExercises(plan).reduce((total, exercise) => total + exercise.s, 0);
}

export function topSet(sets, isBodyweight){
  const logged = sets.filter(set => set && set.r);
  if(!logged.length) return null;
  return logged.reduce((best, set) => score(set, isBodyweight) > score(best, isBodyweight) ? set : best);
}

export function priorSets(sessions, exerciseId, beforeDate){
  const dates = Object.keys(sessions).filter(d => d < beforeDate).sort().reverse();
  for(const date of dates){
    const session = sessions[date];
    const sets = session.entries && session.entries[exerciseId];
    if(sets && sets.some(set => set && set.r))
      return {date, sets, effort: session.effort && session.effort[exerciseId]};
  }
  return null;
}

export function exposures(sessions, exerciseId, beforeDate, limit){
  const dates = Object.keys(sessions).filter(d => d < beforeDate).sort().reverse();
  const found = [];
  for(const date of dates){
    const sets = sessions[date].entries && sessions[date].entries[exerciseId];
    if(sets && sets.some(set => set && set.r)) found.push({date, sets});
    if(found.length === limit) break;
  }
  return found;
}

export function hasStalled(sessions, exercise, beforeDate){
  const recent = exposures(sessions, exercise.id, beforeDate, STALL_EXPOSURES);
  if(recent.length < STALL_EXPOSURES) return false;
  const best = recent.map(entry => score(topSet(entry.sets, exercise.bw), exercise.bw));
  const oldest = best[best.length - 1];
  return best.every(value => value <= oldest);
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

export function suggestTarget(exercise, prior){
  if(!prior) return null;
  const top = topSet(prior.sets, exercise.bw);
  if(!top) return null;

  const sets = prior.sets.filter(set => set && set.r);
  const topReps = num(top.r);
  const topWeight = num(top.w);
  const unit = exercise.unit === "sec" ? "s" : "";
  const effort = prior.effort || "medium";
  const step = EFFORT_STEPS[effort] === undefined ? 1 : EFFORT_STEPS[effort];

  if(effort === "hard")
    return {label: `${topWeight ? topWeight + "×" : ""}${topReps}${unit}`, why: "repeat it"};

  if(!topWeight) return {label: `${topReps + step}${unit || " reps"}`, why: "add reps"};

  const range = repRange(exercise.r);
  if(!range) return {label: `${topWeight}×${topReps + step}${unit}`, why: "add reps"};

  const toppedEverySet = sets.length >= 2 && sets.every(set => num(set.r) >= range.max);
  if(toppedEverySet || topReps > range.max)
    return {label: `${topWeight + WEIGHT_STEP_LB * step}×${range.min}${unit}`, why: "add weight"};

  return {label: `${topWeight}×${Math.min(topReps + step, range.max)}${unit}`, why: "add reps"};
}
