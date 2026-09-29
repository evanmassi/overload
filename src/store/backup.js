import {state, changes, persistSessions} from "./state.js";
import {loggedCount} from "../rules/progression.js";
import {migrateLegacySessions} from "./storage.js";
import {loadDate} from "./session.js";
import {iso} from "../rules/format.js";

export function showBackupResult(text){
  state.backupResult = text;
  changes.notify();
}

export function backupFile(){
  return {name: `overload-${iso(new Date())}.json`, text: JSON.stringify(state.sessions, null, 2)};
}

function mergeSessions(incoming){
  let merged = 0;
  for(const key in incoming){
    const session = incoming[key];
    if(!session || !session.entries || !session.day || !session.block) continue;
    if(!state.sessions[key] || loggedCount(session) > loggedCount(state.sessions[key])){
      state.sessions[key] = session;
      merged++;
    }
  }
  migrateLegacySessions(state.sessions);
  return merged;
}

export function importBackup(text){
  let incoming;
  try{ incoming = JSON.parse(text); }
  catch(e){ showBackupResult("bad file"); return; }
  if(!incoming || typeof incoming !== "object"){ showBackupResult("bad file"); return; }

  const merged = mergeSessions(incoming);
  persistSessions();
  state.backupResult = `merged ${merged}`;
  loadDate(state.current.date);
}
