import {AUTOSAVE_DELAY_MS} from "../data/constants.js";
import {state, changes, channel, persistSessions} from "./state.js";
import {loggedCount, priorSets} from "../rules/progression.js";
import {blockIndexOf, blockLetter, withLetter, nextBlockIndex, nextLiftingDay} from "../rules/rotation.js";
import {workoutOf, restAfterSet} from "../rules/workouts.js";
import {idsTakenElsewhere, resolvedExercises, keptSwaps} from "./slots.js";
import {releaseIfBeaten} from "./holds.js";
import {isLogged} from "../rules/sets.js";
import {iso} from "../rules/format.js";

let saveTimer = null;
let shownToday = null;

export const saveStatus = channel();

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

function latestOn(dateStr, isMatch){
  return sessionsOn(state.sessions, dateStr).filter(key => isMatch(state.sessions[key])).pop() || null;
}

function setBlockIndex(index){
  state.current.blockIndex = Math.max(0, index);
  state.current.block = blockLetter(state.current.blockIndex);
  state.foldFlips.clear();
}

function carriedSwaps(){
  const current = state.current;
  const last = Object.keys(state.sessions).filter(key => key !== current.key).sort().map(key => state.sessions[key])
    .filter(s => s && s.day === current.day && s.block === current.block).pop();
  return last && last.swaps ? keptSwaps(workoutOf(current), last.swaps) : {};
}

function switchSession(existing, day, blockIndex){
  const current = state.current;
  if(!loggedCount(current) && !existing){
    current.day = day;
    setBlockIndex(blockIndex === null ? nextBlockIndex(state.sessions, day) : blockIndex);
    current.swaps = carriedSwaps();
  } else {
    stash();
    openSession(existing || newSessionKey(current.date), current.date, day, blockIndex);
  }
  queueSave();
  changes.notify();
}

export function chooseBlock(letter){
  const current = state.current;
  if(letter === current.block) return;
  const existing = latestOn(current.date, s => s.day === current.day && s.block === letter);
  switchSession(existing, current.day, withLetter(current.blockIndex, letter));
}

export function setDay(day){
  const current = state.current;
  if(day === current.day) return;
  switchSession(latestOn(current.date, s => s.day === day), day, null);
}

export function relabelSession(key, day, letter){
  const session = state.sessions[key];
  if(!session) return;
  session.day = day;
  session.blockIndex = withLetter(blockIndexOf(session), letter);
  session.block = letter;
  persistSessions();
  if(key === state.current.key){
    state.current.day = day;
    setBlockIndex(session.blockIndex);
  }
  changes.notify();
}

function openSession(key, dateStr, day, blockIndex){
  const current = state.current;
  const saved = state.sessions[key];
  current.key = key;
  current.date = dateStr;

  if(saved){
    setBlockIndex(blockIndexOf(saved));
    current.day = saved.day;
  } else {
    current.day = day || nextLiftingDay(state.sessions);
    setBlockIndex(blockIndex === null ? nextBlockIndex(state.sessions, current.day) : blockIndex);
  }

  state.foldFlips.clear();
  current.entries = {};
  current.swaps = saved ? Object.assign({}, saved.swaps) : carriedSwaps();
  current.notes = (saved && saved.notes) || "";
  current.effort = saved && saved.effort ? Object.assign({}, saved.effort) : {};
  current.startedAt = (saved && saved.startedAt) || null;
  current.lastLoggedAt = (saved && saved.lastLoggedAt) || null;
  if(saved && saved.entries)
    for(const id in saved.entries)
      current.entries[id] = saved.entries[id].map(set => ({w: set.w || "", r: set.r || ""}));

  changes.notify();
}

export function loadDate(dateStr){
  const latest = sessionsOn(state.sessions, dateStr).pop();
  openSession(latest || newSessionKey(dateStr), dateStr, null, null);
}

export function followToday(today){
  if(today === shownToday) return;
  const wasOnToday = shownToday === null || state.current.date === shownToday;
  shownToday = today;
  if(wasOnToday && !state.sessions[state.current.key]) loadDate(today);
}

export function loadSession(key){
  const saved = state.sessions[key];
  if(!saved){ loadDate(state.current.date); return; }
  openSession(key, saved.date, saved.day, null);
}

function markLogged(){
  if(state.current.date !== iso(new Date())) return;
  const now = Date.now();
  if(!state.current.startedAt) state.current.startedAt = now;
  state.current.lastLoggedAt = now;
}

function setsFor(exerciseId){
  if(!state.current.entries[exerciseId]) state.current.entries[exerciseId] = [];
  return state.current.entries[exerciseId];
}

export function currentSets(exerciseId){ return state.current.entries[exerciseId] || []; }

export function lastTimeFor(exerciseId){
  return priorSets(state.sessions, exerciseId, state.current.key, state.current.day);
}

export function logSet(exercise, index, set){
  const sets = setsFor(exercise.id);
  while(sets.length <= index) sets.push({w: "", r: ""});
  const newlyLogged = !isLogged(sets[index]) && isLogged(set);
  sets[index] = set;
  if(newlyLogged) markLogged();
  releaseIfBeaten(exercise, sets, lastTimeFor(exercise.id));
  queueSave();
  return newlyLogged;
}

export function setEffort(exerciseId, level){
  if(state.current.effort[exerciseId] === level) delete state.current.effort[exerciseId];
  else state.current.effort[exerciseId] = level;
  queueSave();
  changes.notify();
}

export function setNotes(text){
  state.current.notes = text;
  queueSave();
}

export function swapSlot(slot, id){
  const workout = workoutOf(state.current);
  if(idsTakenElsewhere(slot, workout, state.current.swaps).has(id)) return false;
  if(id === slot.id) delete state.current.swaps[slot.id];
  else state.current.swaps[slot.id] = id;
  queueSave();
  changes.notify();
  return true;
}

export function resetSwaps(){
  state.current.swaps = {};
  queueSave();
  changes.notify();
}

export function isAway(workout){
  return Object.keys(workout.travel).every(id => state.current.swaps[id] === workout.travel[id]);
}

export function setTravel(workout, away){
  for(const id in workout.travel){
    if(away) state.current.swaps[id] = workout.travel[id];
    else delete state.current.swaps[id];
  }
  queueSave();
  changes.notify();
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
  if(Object.keys(current.effort).length) snap.effort = Object.assign({}, current.effort);
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
  saveStatus.notify("saved");
}

function queueSave(){
  stash();
  saveStatus.notify("saving");
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
  else changes.notify();
}

export function openSetIndex(exercise){
  const sets = currentSets(exercise.id);
  for(let i = 0; i < exercise.s; i++) if(!isLogged(sets[i])) return i;
  return -1;
}

export function nextRest(){
  const workout = workoutOf(state.current);
  if(!workout) return null;
  for(const exercise of resolvedExercises(workout, state.current.swaps)){
    const index = openSetIndex(exercise);
    if(index >= 0) return restAfterSet(exercise, index);
  }
  return null;
}
