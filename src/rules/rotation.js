import {BLOCKS, STRENGTH_ROTATION, RECENT_DAYS} from "../data/constants.js";
import {loggedCount} from "./progression.js";
import {iso} from "./format.js";
import {addDays} from "./calendar.js";

export function blockIndexOf(session){
  return typeof session.blockIndex === "number"
    ? session.blockIndex
    : Math.max(0, BLOCKS.indexOf(session.block));
}

export function blockLetter(blockIndex){ return BLOCKS[blockIndex % BLOCKS.length]; }

export function withLetter(blockIndex, letter){
  return Math.floor(blockIndex / BLOCKS.length) * BLOCKS.length + BLOCKS.indexOf(letter);
}

function lastLoggedOf(sessions, keys, day){
  return keys.sort().map(key => sessions[key]).filter(s => s.day === day && loggedCount(s)).pop() || null;
}

const latestOf = (sessions, day) => lastLoggedOf(sessions, Object.keys(sessions), day);

export function previousOf(sessions, day, beforeKey){
  return lastLoggedOf(sessions, Object.keys(sessions).filter(key => key < beforeKey), day);
}

export function nextBlockIndex(sessions, day){
  const latest = latestOf(sessions, day);
  return latest ? blockIndexOf(latest) + 1 : 0;
}

export function nextStrengthDay(sessions){
  const lastDate = day => { const latest = latestOf(sessions, day); return latest ? latest.date : ""; };
  return STRENGTH_ROTATION.reduce((pick, day) => lastDate(day) < lastDate(pick) ? day : pick);
}

export function recentDays(sessions, today){
  const since = iso(addDays(today, 1 - RECENT_DAYS));
  return new Set(Object.values(sessions).filter(s => s.date >= since && loggedCount(s)).map(s => s.day));
}
