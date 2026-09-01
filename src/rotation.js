import {BLOCKS, DAY_KEYS} from "./constants.js";
import {loggedCount} from "./progression.js";

export function blockIndexOf(session){
  if(!session) return 0;
  return typeof session.blockIndex === "number"
    ? session.blockIndex
    : Math.max(0, BLOCKS.indexOf(session.block));
}

export function blockLetter(blockIndex){ return BLOCKS[blockIndex % BLOCKS.length]; }

export function cycleNumber(blockIndex){ return Math.floor(blockIndex / BLOCKS.length) + 1; }

export function cycleStart(blockIndex){ return Math.floor(blockIndex / BLOCKS.length) * BLOCKS.length; }

function loggedSessions(sessions){
  return Object.keys(sessions).map(date => sessions[date]).filter(s => s && loggedCount(s));
}

export function sessionsDoneIn(sessions, blockIndex){
  const done = new Set();
  loggedSessions(sessions).forEach(s => { if(blockIndexOf(s) === blockIndex) done.add(s.day); });
  return done;
}

export function activeBlockIndex(sessions){
  const logged = loggedSessions(sessions);
  if(!logged.length) return 0;
  const latest = logged.reduce((max, s) => Math.max(max, blockIndexOf(s)), 0);
  return sessionsDoneIn(sessions, latest).size >= DAY_KEYS.length ? latest + 1 : latest;
}

export function nextSessionIn(sessions, blockIndex){
  const done = sessionsDoneIn(sessions, blockIndex);
  return DAY_KEYS.find(day => !done.has(day)) || DAY_KEYS[0];
}
