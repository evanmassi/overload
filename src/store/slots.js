import {findExercise, workoutSlots} from "../rules/exercises.js";
import {isLogged} from "../rules/sets.js";
import {exerciseName} from "./customs.js";

export function resolveSlot(slot, swaps){
  const substituteId = swaps && swaps[slot.id];
  if(!substituteId || substituteId === slot.id) return slot;
  const known = findExercise(substituteId);
  const factors = known
    ? {bw: known.bw, unit: known.unit, load: known.load,
       per: known.per, sides: known.sides, implements: known.implements}
    : {};
  if(known && known.unit !== slot.unit) factors.r = known.r;
  return Object.assign({}, slot, factors, {
    id: substituteId,
    n: exerciseName(substituteId),
    swappedFrom: slot.id
  });
}

export function resolvedExercises(workout, swaps){
  return workoutSlots(workout).map(slot => resolveSlot(slot, swaps));
}

export function idsTakenElsewhere(slot, workout, swaps){
  const taken = new Set(resolvedExercises(workout, swaps).map(exercise => exercise.id));
  taken.delete(resolveSlot(slot, swaps).id);
  return taken;
}

export function strayIds(session, workout){
  const planned = new Set(resolvedExercises(workout, session.swaps).map(exercise => exercise.id));
  const entries = session.entries || {};
  return Object.keys(entries).filter(id => !planned.has(id) && entries[id].some(isLogged));
}
