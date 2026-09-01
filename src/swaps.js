import {findExercise, programIds} from "./movements.js";
import {state, persistCustomNames, persistSessions} from "./state.js";
import {loggedCount} from "./progression.js";

const squash = text => String(text).toLowerCase().replace(/[^a-z0-9]/g, "");

export function exerciseName(id){
  const known = findExercise(id);
  return known ? known.n : (state.customNames[id] || id);
}

export function resolveSlot(slot){
  const substituteId = state.current.swaps[slot.id];
  if(!substituteId || substituteId === slot.id) return slot;
  const known = findExercise(substituteId);
  return Object.assign({}, slot, {
    id: substituteId,
    n: exerciseName(substituteId),
    bw: known ? known.bw : slot.bw,
    unit: known ? known.unit : slot.unit,
    swappedFrom: slot.id
  });
}

export function customIdFor(name){
  const target = squash(name);
  if(!target) return null;
  for(const id in state.customNames) if(squash(state.customNames[id]) === target) return id;
  for(const id of programIds()) if(squash(exerciseName(id)) === target) return id;
  return "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function setsLoggedFor(id){
  let n = 0;
  for(const date in state.sessions){
    const sets = (state.sessions[date].entries || {})[id];
    if(sets) n += sets.filter(set => set && set.r).length;
  }
  return n;
}

export function registerCustom(name){
  const id = customIdFor(name);
  if(!id) return null;
  if(!findExercise(id) && !state.customNames[id]){
    state.customNames[id] = name;
    persistCustomNames();
  }
  return id;
}

export function renameCustom(id, name){
  if(!name || !name.trim()) return false;
  state.customNames[id] = name.trim();
  persistCustomNames();
  return true;
}

export function removeCustom(id){
  delete state.customNames[id];
  persistCustomNames();
  for(const date in state.sessions){
    const session = state.sessions[date];
    if(session.entries && session.entries[id]) delete session.entries[id];
    if(session.swaps) for(const slotId in session.swaps)
      if(session.swaps[slotId] === id) delete session.swaps[slotId];
    if(!loggedCount(session)) delete state.sessions[date];
  }
  for(const slotId in state.current.swaps)
    if(state.current.swaps[slotId] === id) delete state.current.swaps[slotId];
  delete state.current.entries[id];
  persistSessions();
}
