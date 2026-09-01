import {loadSessions, saveSessions, loadCustomNames, saveCustomNames} from "./storage.js";

export const state = {
  sessions: {},
  customNames: {},
  view: "log",
  current: {date: null, day: null, block: null, blockIndex: 0, entries: {}, swaps: {}, notes: "", effort: {}, startedAt: null}
};

const listeners = new Set();

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
export function notify(){ listeners.forEach(fn => fn()); }

export function hydrate(){
  state.customNames = loadCustomNames();
  state.sessions = loadSessions();
}

export function persistSessions(){ saveSessions(state.sessions); }
export function persistCustomNames(){ saveCustomNames(state.customNames); }
