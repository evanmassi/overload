import {loadSessions, saveSessions, loadCustomNames, saveCustomNames, loadHolds, saveHolds} from "./storage.js";

export const state = {
  sessions: {},
  customNames: {},
  holds: {},
  view: "log",
  foldFlips: new Set(),
  historyDay: null,
  historyOpen: new Set(),
  current: {key: null, date: null, day: null, block: null, blockIndex: 0, entries: {}, swaps: {}, notes: "", effort: {}, startedAt: null, lastLoggedAt: null}
};

const listeners = new Set();

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
export function notify(){ listeners.forEach(fn => fn()); }

export function hydrate(){
  state.customNames = loadCustomNames();
  state.holds = loadHolds();
  state.sessions = loadSessions();
}

export function persistSessions(){ saveSessions(state.sessions); }
export function persistCustomNames(){ saveCustomNames(state.customNames); }
export function persistHolds(){ saveHolds(state.holds); }
