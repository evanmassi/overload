import {loadSessions, saveSessions, loadCustomNames, saveCustomNames, loadHolds, saveHolds} from "./storage.js";

export const state = {
  sessions: {},
  customNames: {},
  holds: {},
  view: "log",
  foldFlips: new Set(),
  historyDays: new Set(),
  progressDays: new Set(),
  historyOpen: new Set(),
  backupResult: "",
  current: {key: null, date: null, day: null, block: null, blockIndex: 0, entries: {}, swaps: {}, notes: "", effort: {}, startedAt: null, lastLoggedAt: null}
};

export function channel(){
  const listeners = new Set();
  return {
    subscribe: fn => { listeners.add(fn); },
    notify: detail => listeners.forEach(fn => fn(detail))
  };
}

export const changes = channel();

export function hydrate(){
  state.customNames = loadCustomNames();
  state.holds = loadHolds();
  state.sessions = loadSessions();
}

export function persistSessions(){ saveSessions(state.sessions); }
export function persistCustomNames(){ saveCustomNames(state.customNames); }
export function persistHolds(){ saveHolds(state.holds); }
