import {findExercise} from "../rules/exercises.js";
import {workoutSlots} from "../rules/workouts.js";
import {isLogged} from "../rules/sets.js";
import {exerciseName} from "./customs.js";

export function resolveSlot(slot, swaps){
  const substituteId = swaps && swaps[slot.id];
  if(!substituteId || substituteId === slot.id) return slot;
  const known = findExercise(substituteId);
  const identity = known && known.unit !== slot.unit ? Object.assign({}, known, {r: known.target}) : known;
  return Object.assign({}, slot, identity, {
    id: substituteId,
    n: exerciseName(substituteId),
    swappedFrom: slot.id
  });
}

export function resolvedExercises(workout, swaps){
  return workoutSlots(workout).map(slot => resolveSlot(slot, swaps));
}

export function keptSwaps(workout, swaps){
  const slotIds = workoutSlots(workout).map(slot => slot.id);
  const shown = slotIds.map(id => swaps[id] || id);
  const isShared = id => shown.indexOf(id) !== shown.lastIndexOf(id);
  const kept = {};
  for(const id of slotIds) if(swaps[id] && !isShared(swaps[id])) kept[id] = swaps[id];
  return kept;
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
