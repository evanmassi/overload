import {findExercise, programIds} from "../rules/exercises.js";
import {ALIASES} from "../data/taxonomy.js";
import {state, persistCustomNames, persistSessions, persistHolds} from "./state.js";
import {loggedCount} from "../rules/progression.js";
import {isLogged} from "../rules/sets.js";

const squash = text => String(text).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

const ALIAS_OF = {};
for(const id in ALIASES) ALIASES[id].forEach(name => { ALIAS_OF[squash(name)] = id; });

export function exerciseName(id){
  const known = findExercise(id);
  return known ? known.n : (state.customNames[id] || id);
}

export function customIdFor(name){
  const target = squash(name);
  if(!target) return null;
  for(const id in state.customNames) if(squash(state.customNames[id]) === target) return id;
  for(const id of programIds()) if(squash(exerciseName(id)) === target) return id;
  if(ALIAS_OF[target]) return ALIAS_OF[target];
  return "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function setsLoggedFor(id){
  let n = 0;
  for(const date in state.sessions){
    const sets = (state.sessions[date].entries || {})[id];
    if(sets) n += sets.filter(isLogged).length;
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
  delete state.holds[id];
  persistHolds();
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
