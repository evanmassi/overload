import {findExercise} from "./exercises.js";
import {workoutSlots, workoutOf, repRange, isCrossTraining} from "./workouts.js";
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
    : num(set.w) * (1 + num(set.r) / EPLEY_DIVISOR);
}

export function trend(set, prior, isBodyweight){
  const now = score(set, isBodyweight);
  const then = score(prior, isBodyweight);
  return now > then ? "up" : now === then ? "same" : "down";
}

export function loggedAsBodyweight(exercise, sets){
  return exercise ? !!exercise.bw : !sets.some(set => set.w);
}

export function loggedCount(session){
  let n = 0;
  for(const id in (session.entries || {})) n += session.entries[id].filter(isLogged).length;
  return n;
}

export function prescribedCount(workout){
  return workoutSlots(workout).reduce((total, exercise) => total + exercise.s, 0);
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
  const crossTraining = day === undefined ? null : isCrossTraining(day);
  return Object.keys(sessions)
    .filter(key => key < beforeKey && (crossTraining === null || isCrossTraining(sessions[key].day) === crossTraining))
    .sort().reverse();
}

export function exposures(sessions, exerciseId, beforeKey, limit, day){
  const found = [];
  for(const key of earlierKeysOfSameKind(sessions, beforeKey, day)){
    const session = sessions[key];
    const sets = session.entries && session.entries[exerciseId];
    if(sets && sets.some(isLogged))
      found.push({date: session.date, key, sets, effort: session.effort && session.effort[exerciseId]});
    if(found.length === limit) break;
  }
  return found;
}

export function priorSets(sessions, exerciseId, beforeKey, day){
  return exposures(sessions, exerciseId, beforeKey, 1, day)[0] || null;
}

export function hasStalled(sessions, exercise, beforeKey, day){
  const recent = exposures(sessions, exercise.id, beforeKey, STALL_EXPOSURES, day);
  if(recent.length < STALL_EXPOSURES) return false;
  const best = recent.map(entry => score(topSet(entry.sets, exercise.bw), exercise.bw));
  const oldest = best[best.length - 1];
  return best.every(value => value <= oldest);
}

export function sessionVolume(session){
  const workout = workoutOf(session);
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
  const effort = prior.effort || "medium";
  const step = EFFORT_STEPS[effort] === undefined ? 1 : EFFORT_STEPS[effort];
  const aim = (w, r, change) => ({w: w ? String(w) : "", r: String(r), change, isPush: w > topWeight || r > topReps});
  const addReps = reps => aim(topWeight, reps, reps > topReps ? countChange(reps - topReps, unitSuffix(exercise)) : "every set");

  if(held) return aim(topWeight, topReps, "match it");
  if(effort === "hard") return aim(topWeight, topReps, "repeat it");

  const range = repRange(exercise.r);
  if(!topWeight || !range) return addReps(topReps + step);

  const toppedEverySet = (sets.length >= 2 || exercise.s === 1) && sets.every(set => num(set.r) >= range.max);
  if(toppedEverySet || topReps > range.max){
    const byLevel = exercise.load === "level";
    const added = (byLevel ? 1 : WEIGHT_STEP_LB) * step;
    return aim(topWeight + added, range.min, byLevel ? `+${added} level${added === 1 ? "" : "s"}` : `+${added} lb`);
  }

  return addReps(Math.min(topReps + step, range.max));
}

const signed = n => (n > 0 ? "+" : "−") + Math.abs(n);

function countChange(n, suffix){
  if(suffix === "s") return `${signed(n)}s`;
  if(suffix === "m") return `${signed(n)} min`;
  return `${signed(n)} rep${Math.abs(n) === 1 ? "" : "s"}`;
}

export function progressSince(exercise, first, latest, isBodyweight){
  const weightGain = num(latest.w) - num(first.w);
  const repGain = num(latest.r) - num(first.r);
  const byLevel = !!exercise && exercise.load === "level";
  const text = weightGain
    ? `${signed(weightGain)} ${byLevel ? "level" + (Math.abs(weightGain) === 1 ? "" : "s") : "lb"}`
    : repGain ? countChange(repGain, exercise ? unitSuffix(exercise) : "") : "same";
  return {text, direction: trend(latest, first, isBodyweight)};
}
