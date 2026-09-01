import {BLOCKS, AUTOSAVE_DELAY_MS} from "./constants.js";
import {state, notify, persistSessions} from "./state.js";
import {loggedCount} from "./progression.js";
import {blockIndexOf, blockLetter, activeBlockIndex, nextSessionIn} from "./rotation.js";

let saveTimer = null;
let statusHandler = () => {};

export function onStatus(fn){ statusHandler = fn; }

export const iso = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function setBlockIndex(index){
  state.current.blockIndex = Math.max(0, index);
  state.current.block = blockLetter(state.current.blockIndex);
  state.expanded.clear();
}

export function setDay(day){
  state.current.day = day;
  state.expanded.clear();
}

export function loadDate(dateStr){
  const current = state.current;
  current.date = dateStr;
  const saved = state.sessions[dateStr];

  if(saved && loggedCount(saved)){
    setBlockIndex(blockIndexOf(saved));
    current.day = saved.day;
  } else {
    setBlockIndex(activeBlockIndex(state.sessions));
    current.day = nextSessionIn(state.sessions, current.blockIndex);
  }

  state.expanded.clear();
  current.entries = {};
  current.swaps = saved && saved.swaps ? Object.assign({}, saved.swaps) : {};
  current.notes = (saved && saved.notes) || "";
  current.effort = saved && saved.effort ? Object.assign({}, saved.effort) : {};
  current.startedAt = (saved && saved.startedAt) || null;
  if(saved && saved.entries)
    for(const id in saved.entries)
      current.entries[id] = saved.entries[id].map(set => ({w: set.w || "", r: set.r || ""}));

  notify();
}

export function markStarted(){
  if(!state.current.startedAt) state.current.startedAt = Date.now();
}

export function setEffort(exerciseId, level){
  if(!state.current.effort) state.current.effort = {};
  if(state.current.effort[exerciseId] === level) delete state.current.effort[exerciseId];
  else state.current.effort[exerciseId] = level;
  queueSave();
  notify();
}

export function setsFor(exerciseId){
  if(!state.current.entries[exerciseId]) state.current.entries[exerciseId] = [];
  return state.current.entries[exerciseId];
}

function cleanEntries(entries){
  const out = {};
  for(const id in entries){
    const sets = entries[id].map(set => ({w: (set.w || "").trim(), r: (set.r || "").trim()}));
    while(sets.length && !sets[sets.length - 1].r && !sets[sets.length - 1].w) sets.pop();
    if(sets.length) out[id] = sets;
  }
  return out;
}

function snapshot(){
  const current = state.current;
  const snap = {
    date: current.date,
    day: current.day,
    block: current.block,
    blockIndex: current.blockIndex,
    entries: cleanEntries(current.entries)
  };
  if(current.notes && current.notes.trim()) snap.notes = current.notes.trim();
  if(Object.keys(current.effort || {}).length) snap.effort = Object.assign({}, current.effort);
  if(current.startedAt) snap.startedAt = current.startedAt;
  if(Object.keys(current.swaps).length) snap.swaps = Object.assign({}, current.swaps);
  return snap;
}

function commitNow(){
  const snap = snapshot();
  if(loggedCount(snap)) state.sessions[snap.date] = snap;
  else delete state.sessions[snap.date];
  persistSessions();
  statusHandler("saved");
}

export function queueSave(){
  const snap = snapshot();
  if(loggedCount(snap)) state.sessions[snap.date] = snap;
  else delete state.sessions[snap.date];
  statusHandler("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(commitNow, AUTOSAVE_DELAY_MS);
}

export function flushNow(){
  const focused = typeof document !== "undefined" && document.activeElement;
  if(focused && focused.tagName === "INPUT") focused.blur();
  clearTimeout(saveTimer);
  commitNow();
}

export function deleteSession(date){
  delete state.sessions[date];
  persistSessions();
  if(date === state.current.date) loadDate(date);
  else notify();
}

export function previousSameWorkout(){
  const {sessions, current} = state;
  const dates = Object.keys(sessions).filter(d => d < current.date).sort().reverse();
  for(const date of dates){
    const session = sessions[date];
    if(session.day === current.day && session.block === current.block) return {date, session};
  }
  return null;
}
