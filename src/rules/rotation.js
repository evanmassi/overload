import {BLOCKS, DAY_KEYS, RECENT_DAYS} from "../data/constants.js";
import {loggedCount} from "./progression.js";
import {iso} from "./format.js";

export function blockIndexOf(session){
  if(!session) return 0;
  return typeof session.blockIndex === "number"
    ? session.blockIndex
    : Math.max(0, BLOCKS.indexOf(session.block));
}

export function blockLetter(blockIndex){ return BLOCKS[blockIndex % BLOCKS.length]; }

export function withLetter(blockIndex, letter){
  return Math.floor(blockIndex / BLOCKS.length) * BLOCKS.length + BLOCKS.indexOf(letter);
}

function loggedOf(sessions, day){
  return Object.keys(sessions).sort().map(key => sessions[key])
    .filter(s => s && s.day === day && loggedCount(s));
}

function latestOf(sessions, day){ return loggedOf(sessions, day).pop() || null; }

export function previousOf(sessions, day, beforeKey){
  const earlier = Object.keys(sessions).filter(key => key < beforeKey).sort().map(key => sessions[key])
    .filter(s => s && s.day === day && loggedCount(s));
  return earlier.pop() || null;
}

export function nextBlockIndex(sessions, day){
  const latest = latestOf(sessions, day);
  return latest ? blockIndexOf(latest) + 1 : 0;
}

export function nextLiftingDay(sessions){
  const lastDate = day => { const latest = latestOf(sessions, day); return latest ? latest.date : ""; };
  return DAY_KEYS.reduce((pick, day) => lastDate(day) < lastDate(pick) ? day : pick);
}

export function recentDays(sessions, today){
  const since = iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - RECENT_DAYS + 1));
  return new Set(Object.keys(sessions).map(key => sessions[key])
    .filter(s => s && s.date >= since && loggedCount(s)).map(s => s.day));
}
