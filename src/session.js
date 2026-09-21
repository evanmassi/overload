import {AUTOSAVE_DELAY_MS} from "./constants.js";
import {state, notify, persistSessions} from "./state.js";
import {loggedCount, priorSets} from "./progression.js";
import {blockIndexOf, blockLetter, activeBlockIndex, nextSessionIn, nextOffBlockIndex} from "./rotation.js";
import {isOffDay, workoutFor} from "./movements.js";
import {idsTakenElsewhere} from "./swaps.js";
import {releaseIfBeaten} from "./holds.js";
import {isLogged} from "./sets.js";
import {iso} from "./format.js";

let saveTimer = null;
let statusHandler = () => {};

export function onStatus(fn){ statusHandler = fn; }

const clock = date =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

function newSessionKey(dateStr){
  const stamp = `${dateStr}T${clock(new Date())}`;
  let key = stamp;
  for(let n = 2; state.sessions[key]; n++) key = `${stamp}.${n}`;
  return key;
}

function sessionsOn(sessions, dateStr){
  return Object.keys(sessions).filter(key => sessions[key] && sessions[key].date === dateStr).sort();
}

function sessionKeyFor(dateStr, day){
  return sessionsOn(state.sessions, dateStr).filter(key => state.sessions[key].day === day).pop() || null;
}

function setBlockIndex(index){
  state.current.blockIndex = Math.max(0, index);
  state.current.block = blockLetter(state.current.blockIndex);
  state.foldFlips.clear();
}

export function chooseBlock(index){
  setBlockIndex(index);
  queueSave();
  notify();
}

export function setDay(day){
  const current = state.current;
  if(day === current.day) return;
  const existing = sessionKeyFor(current.date, day);
  if(!loggedCount(current) && !existing){
    const crossing = isOffDay(day) !== isOffDay(current.day);
    current.day = day;
    if(crossing) setBlockIndex(isOffDay(day) ? nextOffBlockIndex(state.sessions, day) : activeBlockIndex(state.sessions));
    state.foldFlips.clear();
  } else {
    stash();
    openSession(existing || newSessionKey(current.date), current.date, day);
  }
  queueSave();
  notify();
}

function sessionsExcept(key){
  const rest = {};
  for(const other in state.sessions) if(other !== key) rest[other] = state.sessions[other];
  return rest;
}

export function relabelSession(key, day){
  const session = state.sessions[key];
  if(!session) return;
  const crossing = isOffDay(day) !== isOffDay(session.day);
  session.day = day;
  if(isOffDay(day) || crossing){
    const others = sessionsExcept(key);
    session.blockIndex = isOffDay(day) ? nextOffBlockIndex(others, day) : activeBlockIndex(others);
    session.block = blockLetter(session.blockIndex);
  }
  persistSessions();
  if(key === state.current.key){
    state.current.day = day;
    setBlockIndex(session.blockIndex);
  }
  notify();
}

function openSession(key, dateStr, day){
  const current = state.current;
  const saved = state.sessions[key];
  current.key = key;
  current.date = dateStr;

  if(saved){
    setBlockIndex(blockIndexOf(saved));
    current.day = saved.day;
  } else if(day){
    current.day = day;
    setBlockIndex(isOffDay(day) ? nextOffBlockIndex(state.sessions, day) : activeBlockIndex(state.sessions));
  } else {
    setBlockIndex(activeBlockIndex(state.sessions));
    current.day = nextSessionIn(state.sessions, current.blockIndex);
  }

  state.foldFlips.clear();
  current.entries = {};
  current.swaps = saved && saved.swaps ? Object.assign({}, saved.swaps) : {};
  current.notes = (saved && saved.notes) || "";
  current.effort = saved && saved.effort ? Object.assign({}, saved.effort) : {};
  current.startedAt = (saved && saved.startedAt) || null;
  current.lastLoggedAt = (saved && saved.lastLoggedAt) || null;
  if(saved && saved.entries)
    for(const id in saved.entries)
      current.entries[id] = saved.entries[id].map(set => ({w: set.w || "", r: set.r || ""}));

  notify();
}

export function loadDate(dateStr){
  const latest = sessionsOn(state.sessions, dateStr).pop();
  openSession(latest || newSessionKey(dateStr), dateStr, null);
}

export function loadSession(key){
  const saved = state.sessions[key];
  if(!saved){ loadDate(state.current.date); return; }
  openSession(key, saved.date, saved.day);
}

function markLogged(){
  if(state.current.date !== iso(new Date())) return;
  const now = Date.now();
  if(!state.current.startedAt) state.current.startedAt = now;
  state.current.lastLoggedAt = now;
}

export function setsFor(exerciseId){
  if(!state.current.entries[exerciseId]) state.current.entries[exerciseId] = [];
  return state.current.entries[exerciseId];
}

export function logSet(exercise, index, set){
  const sets = setsFor(exercise.id);
  while(sets.length <= index) sets.push({w: "", r: ""});
  const newlyLogged = !isLogged(sets[index]) && isLogged(set);
  sets[index] = set;
  if(newlyLogged) markLogged();
  const prior = priorSets(state.sessions, exercise.id, state.current.key, state.current.day);
  releaseIfBeaten(exercise, set, prior && prior.sets[index]);
  queueSave();
  return newlyLogged;
}

export function setEffort(exerciseId, level){
  if(!state.current.effort) state.current.effort = {};
  if(state.current.effort[exerciseId] === level) delete state.current.effort[exerciseId];
  else state.current.effort[exerciseId] = level;
  queueSave();
  notify();
}

export function setNotes(text){
  state.current.notes = text;
  queueSave();
}

export function swapSlot(slot, id){
  const plan = workoutFor(state.current.block, state.current.day);
  if(idsTakenElsewhere(slot, plan, state.current.swaps).has(id)) return false;
  if(id === slot.id) delete state.current.swaps[slot.id];
  else state.current.swaps[slot.id] = id;
  queueSave();
  notify();
  return true;
}

export function isAway(plan){
  return Object.keys(plan.travel).every(id => state.current.swaps[id] === plan.travel[id]);
}

export function setTravel(plan, away){
  for(const id in plan.travel){
    if(away) state.current.swaps[id] = plan.travel[id];
    else delete state.current.swaps[id];
  }
  queueSave();
  notify();
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
  if(current.lastLoggedAt) snap.lastLoggedAt = current.lastLoggedAt;
  if(Object.keys(current.swaps).length) snap.swaps = Object.assign({}, current.swaps);
  return snap;
}

function stash(){
  const snap = snapshot();
  if(loggedCount(snap) || snap.notes || snap.effort) state.sessions[state.current.key] = snap;
  else delete state.sessions[state.current.key];
}

function commitNow(){
  stash();
  persistSessions();
  statusHandler("saved");
}

function queueSave(){
  stash();
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

export function deleteSession(key){
  const date = state.sessions[key] && state.sessions[key].date;
  delete state.sessions[key];
  persistSessions();
  if(key === state.current.key) loadDate(date || state.current.date);
  else notify();
}

export function previousSameWorkout(){
  const {sessions, current} = state;
  const keys = Object.keys(sessions).filter(key => key < current.key).sort().reverse();
  for(const key of keys){
    const session = sessions[key];
    if(session.day === current.day && session.block === current.block) return {date: session.date, session};
  }
  return null;
}
